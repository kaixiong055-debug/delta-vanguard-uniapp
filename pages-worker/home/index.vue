<template>
  <s-layout title="打手工作台" :bgStyle="{ color: '#f4f6f8' }">
    <view class="worker-page">
      <view v-if="guardError" class="notice-card">
        <view class="notice-title">身份校验失败</view>
        <view class="notice-desc">{{ guardError }}</view>
        <button class="ss-reset-button retry-btn" @tap="loadHome">重试</button>
      </view>

      <block v-else>
        <view class="hero">
          <view class="avatar">
            <image
              v-if="profile.avatar"
              class="avatar-img"
              :src="profile.avatar"
              mode="aspectFill"
            />
            <text v-else>{{ avatarText }}</text>
          </view>
          <view class="hero-info">
            <view class="hero-title">
              {{ profile.displayName || identity.displayName || '打手工作台' }}
            </view>
            <view class="hero-subtitle">
              {{ identity.workerNo || profile.workerNo || '身份已通过审核' }}
            </view>
          </view>
        </view>

        <view class="status-card">
          <view class="status-row">
            <text class="label">审核状态</text>
            <text class="value">{{ deltaStore.statusInfo.title }}</text>
          </view>
          <view class="status-row">
            <text class="label">工作状态</text>
            <text class="value">{{ deltaStore.workStatusText }}</text>
          </view>

          <view v-if="isBusy" class="busy-tip">
            当前有正在履约的任务，工作状态由系统自动维护。
          </view>

          <view class="status-actions">
            <button
              class="ss-reset-button ghost-btn"
              :disabled="isBusy"
              @tap="setWorkStatus(DeltaWorkStatus.ONLINE)"
            >
              设为在线
            </button>
            <button
              class="ss-reset-button ghost-btn"
              :disabled="isBusy"
              @tap="setWorkStatus(DeltaWorkStatus.OFFLINE)"
            >
              设为离线
            </button>
            <button
              class="ss-reset-button ghost-btn"
              :disabled="isBusy"
              @tap="setWorkStatus(DeltaWorkStatus.PAUSED)"
            >
              暂停接单
            </button>
          </view>
        </view>

        <view class="task-overview">
          <view class="overview-head">
            <view>
              <view class="overview-title">任务概览</view>
              <view class="overview-desc">俱乐部分派和平台任务统一显示</view>
            </view>
            <text class="overview-link" @tap="goOrders()">全部任务</text>
          </view>

          <view class="stat-grid">
            <view class="stat-card" @tap="goOrders(ServiceOrderStatus.ACCEPTED_PENDING_START)">
              <view class="stat-value">{{ taskStats.pendingStart }}</view>
              <view class="stat-label">待开始</view>
            </view>
            <view class="stat-card" @tap="goOrders(ServiceOrderStatus.IN_PROGRESS)">
              <view class="stat-value">{{ taskStats.inProgress }}</view>
              <view class="stat-label">进行中</view>
            </view>
            <view class="stat-card" @tap="goOrders(ServiceOrderStatus.WORKER_SUBMITTED)">
              <view class="stat-value">{{ taskStats.waitingAccept }}</view>
              <view class="stat-label">待验收</view>
            </view>
          </view>

          <view v-if="taskStats.error" class="overview-error" @tap="loadTaskOverview">
            {{ taskStats.error }}，点击重试
          </view>
        </view>

        <view v-if="priorityOrder.id" class="priority-card" @tap="goOrderDetail(priorityOrder)">
          <view class="priority-head">
            <view class="priority-title">优先处理</view>
            <view class="priority-status">
              {{ priorityOrder.statusName || getServiceOrderStatusText(priorityOrder.status) }}
            </view>
          </view>
          <view class="priority-name">{{ priorityOrder.productName || '服务任务' }}</view>
          <view class="priority-no">服务单：{{ priorityOrder.serviceOrderNo || '-' }}</view>
          <view class="priority-foot">
            <text>{{ formatDeltaAmount(priorityOrder.serviceAmount) }}</text>
            <text>进入任务 ›</text>
          </view>
        </view>

        <view class="entry-grid">
          <view v-for="item in entries" :key="item.url" class="entry-card" @tap="go(item.url)">
            <view class="entry-icon">{{ item.icon }}</view>
            <view class="entry-title">{{ item.title }}</view>
            <view class="entry-desc">{{ item.desc }}</view>
          </view>
        </view>

        <button class="ss-reset-button exit-btn" @tap="exitToShop">返回商城模式</button>
      </block>
    </view>

    <worker-tabbar :active="DeltaRoute.WORKER_HOME" />
  </s-layout>
</template>

<script setup>
  import { computed, reactive, ref } from 'vue';
  import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { showAuthModal } from '@/sheep/hooks/useModal';
  import WorkerOrderApi from '@/sheep/api/delta/workerOrder';
  import WorkerTabbar from '../components/worker-tabbar.vue';
  import {
    DeltaAppMode,
    DeltaAuditStatus,
    DeltaRoute,
    DeltaWorkStatus,
    ServiceOrderStatus,
    formatDeltaAmount,
    getServiceOrderStatusText,
  } from '@/sheep/helper/delta';

  const userStore = sheep.$store('user');
  const deltaStore = sheep.$store('delta');
  const guardError = ref('');
  const priorityOrder = ref({});

  const taskStats = reactive({
    pendingStart: 0,
    inProgress: 0,
    waitingAccept: 0,
    loading: false,
    error: '',
  });

  const entries = [
    { title: '接单大厅', desc: '查看并领取匹配服务单', icon: '抢', url: DeltaRoute.WORKER_POOL },
    {
      title: '我的任务',
      desc: '执行平台与俱乐部分派任务',
      icon: '单',
      url: DeltaRoute.WORKER_ORDERS,
    },
    {
      title: '收入结算',
      desc: '查看审核、待打款和已打款记录',
      icon: '收',
      url: DeltaRoute.WORKER_INCOME,
    },
    {
      title: '消息通知',
      desc: '查看 Delta 站内消息',
      icon: '信',
      url: DeltaRoute.DELTA_NOTIFICATIONS,
    },
  ];

  const identity = computed(() => deltaStore.identity || {});
  const profile = computed(() => deltaStore.profile || {});
  const avatarText = computed(() =>
    (profile.value.displayName || identity.value.displayName || '打').slice(0, 1),
  );
  const currentWorkStatus = computed(() =>
    Number(profile.value.workStatus ?? identity.value.workStatus ?? DeltaWorkStatus.OFFLINE),
  );
  const isBusy = computed(() => currentWorkStatus.value === DeltaWorkStatus.BUSY);

  async function loadTaskOverview() {
    if (taskStats.loading) return;

    taskStats.loading = true;
    taskStats.error = '';

    const statuses = [
      ServiceOrderStatus.ACCEPTED_PENDING_START,
      ServiceOrderStatus.IN_PROGRESS,
      ServiceOrderStatus.WORKER_SUBMITTED,
    ];

    try {
      const results = await Promise.all(
        statuses.map((status) =>
          WorkerOrderApi.getPage(
            { pageNo: 1, pageSize: 1, status },
            { showError: false, showLoading: false },
          ),
        ),
      );

      const invalidResult = results.find((res) => res?.code !== 0);
      if (invalidResult) {
        taskStats.error = invalidResult?.msg || '任务概览加载失败';
        return;
      }

      const [pendingRes, progressRes, submittedRes] = results;
      taskStats.pendingStart = Number(pendingRes.data?.total || 0);
      taskStats.inProgress = Number(progressRes.data?.total || 0);
      taskStats.waitingAccept = Number(submittedRes.data?.total || 0);

      const first = (res) => (Array.isArray(res.data?.list) ? res.data.list[0] : null);
      priorityOrder.value = first(progressRes) || first(pendingRes) || first(submittedRes) || {};
    } catch (error) {
      taskStats.error = error?.msg || error?.message || '任务概览加载失败';
      priorityOrder.value = {};
    } finally {
      taskStats.loading = false;
    }
  }

  async function loadHome() {
    guardError.value = '';

    if (!userStore.isLogin) {
      showAuthModal();
      deltaStore.exitWorkerMode(DeltaRoute.SHOP_USER);
      uni.stopPullDownRefresh();
      return;
    }

    const res = await deltaStore.fetchWorkerIdentity({ force: true, showError: false });
    if (res?.code !== 0) {
      guardError.value = deltaStore.identityError || '请稍后重试';
      uni.stopPullDownRefresh();
      return;
    }

    const status = Number(
      deltaStore.identity?.auditStatus ?? deltaStore.identity?.applicationStatus,
    );

    if (status === DeltaAuditStatus.DISABLED || status === DeltaAuditStatus.BLACKLISTED) {
      uni.showToast({
        title: deltaStore.statusInfo.desc,
        icon: 'none',
      });
      deltaStore.exitWorkerMode(DeltaRoute.SHOP_USER);
      uni.stopPullDownRefresh();
      return;
    }

    if (!deltaStore.canEnterWorker) {
      sheep.$router.redirect(deltaStore.resolveWorkerRoute(deltaStore.identity));
      uni.stopPullDownRefresh();
      return;
    }

    deltaStore.setAppMode(DeltaAppMode.WORKER);
    await deltaStore.fetchWorkerProfile({ showError: false });
    await loadTaskOverview();
    uni.stopPullDownRefresh();
  }

  async function setWorkStatus(workStatus) {
    if (isBusy.value) {
      sheep.$helper.toast('履约中的打手不能手动切换工作状态');
      return;
    }
    await deltaStore.updateWorkerWorkStatus(workStatus);
  }

  function exitToShop() {
    deltaStore.exitWorkerMode(DeltaRoute.SHOP_USER);
  }

  function go(url) {
    sheep.$router.go(url);
  }

  function goOrders(status) {
    const params = status === undefined ? {} : { status };
    sheep.$router.go(DeltaRoute.WORKER_ORDERS, params);
  }

  function goOrderDetail(order) {
    if (!order?.id) return;
    sheep.$router.go('/pages-worker/order/detail', { id: order.id });
  }

  onShow(loadHome);
  onPullDownRefresh(loadHome);
</script>

<style lang="scss" scoped>
  .worker-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 140rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .hero,
  .status-card,
  .entry-card,
  .notice-card,
  .task-overview,
  .priority-card {
    border-radius: 18rpx;
    background: #ffffff;
  }

  .hero {
    display: flex;
    align-items: center;
    padding: 30rpx;
  }

  .avatar {
    width: 92rpx;
    height: 92rpx;
    overflow: hidden;
    border-radius: 50%;
    color: #ffffff;
    background: #e60012;
    font-size: 34rpx;
    line-height: 92rpx;
    text-align: center;
    font-weight: 800;
  }

  .avatar-img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .hero-info {
    flex: 1;
    min-width: 0;
    margin-left: 22rpx;
  }

  .hero-title,
  .notice-title,
  .entry-title {
    color: #17191f;
    font-size: 34rpx;
    line-height: 48rpx;
    font-weight: 800;
  }

  .hero-subtitle,
  .notice-desc,
  .entry-desc {
    margin-top: 8rpx;
    color: #8c929d;
    font-size: 25rpx;
    line-height: 38rpx;
  }

  .status-card,
  .notice-card,
  .task-overview,
  .priority-card {
    margin-top: 22rpx;
    padding: 28rpx;
  }

  .status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 58rpx;
    border-bottom: 1rpx solid #f0f1f3;
  }

  .status-row:last-of-type {
    border-bottom: 0;
  }

  .label {
    color: #8c929d;
    font-size: 25rpx;
  }

  .value {
    color: #252932;
    font-size: 25rpx;
    font-weight: 800;
  }

  .busy-tip {
    margin-top: 18rpx;
    padding: 16rpx 18rpx;
    border-radius: 12rpx;
    color: #9a5b00;
    background: #fff7e8;
    font-size: 23rpx;
    line-height: 34rpx;
  }

  .status-actions {
    display: flex;
    margin-top: 24rpx;
  }

  .ghost-btn {
    flex: 1;
    height: 58rpx;
    margin-right: 12rpx;
    border-radius: 999rpx;
    color: #e60012;
    background: #fff0f1;
    font-size: 23rpx;
    line-height: 58rpx;
  }

  .ghost-btn:last-child {
    margin-right: 0;
  }

  .ghost-btn[disabled] {
    opacity: 0.45;
  }

  .overview-head,
  .priority-head,
  .priority-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .overview-title,
  .priority-title {
    color: #17191f;
    font-size: 29rpx;
    font-weight: 800;
  }

  .overview-desc {
    margin-top: 6rpx;
    color: #9399a3;
    font-size: 22rpx;
  }

  .overview-link {
    color: #e60012;
    font-size: 24rpx;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14rpx;
    margin-top: 22rpx;
  }

  .stat-card {
    padding: 22rpx 10rpx;
    border-radius: 14rpx;
    background: #f7f8fa;
    text-align: center;
  }

  .stat-value {
    color: #17191f;
    font-size: 36rpx;
    font-weight: 800;
  }

  .stat-label {
    margin-top: 6rpx;
    color: #7f8590;
    font-size: 22rpx;
  }

  .overview-error {
    margin-top: 18rpx;
    color: #e60012;
    font-size: 23rpx;
    text-align: center;
  }

  .priority-status {
    padding: 6rpx 14rpx;
    border-radius: 999rpx;
    color: #e60012;
    background: #fff0f1;
    font-size: 22rpx;
  }

  .priority-name {
    margin-top: 18rpx;
    color: #252932;
    font-size: 28rpx;
    line-height: 42rpx;
    font-weight: 800;
  }

  .priority-no {
    margin-top: 8rpx;
    color: #9399a3;
    font-size: 22rpx;
  }

  .priority-foot {
    margin-top: 20rpx;
    padding-top: 18rpx;
    border-top: 1rpx solid #f0f1f3;
    color: #e60012;
    font-size: 24rpx;
    font-weight: 700;
  }

  .entry-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18rpx;
    margin-top: 22rpx;
  }

  .entry-card {
    padding: 26rpx;
  }

  .entry-icon {
    width: 58rpx;
    height: 58rpx;
    border-radius: 16rpx;
    color: #ffffff;
    background: #e60012;
    font-size: 24rpx;
    line-height: 58rpx;
    text-align: center;
    font-weight: 800;
  }

  .entry-title {
    margin-top: 18rpx;
    font-size: 28rpx;
    line-height: 40rpx;
  }

  .entry-desc {
    margin-top: 6rpx;
    font-size: 22rpx;
    line-height: 32rpx;
  }

  .exit-btn,
  .retry-btn {
    height: 82rpx;
    margin-top: 28rpx;
    border-radius: 999rpx;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }

  .exit-btn {
    color: #ffffff;
    background: #17191f;
  }

  .retry-btn {
    width: 100%;
    color: #ffffff;
    background: #e60012;
  }
</style>
