<template>
  <s-layout title="打手工作台" :bgStyle="{ color: '#f4f6f8' }">
    <view class="worker-page">
      <view v-if="guardError" class="notice-card">
        <view class="notice-title">身份校验失败</view>
        <view class="notice-desc">{{ guardError }}</view>
        <button class="ss-reset-button retry-btn" @tap="guardWorkerHome">重试</button>
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
            <view class="hero-title">{{
              profile.displayName || identity.displayName || '打手工作台'
            }}</view>
            <view class="hero-subtitle">{{
              identity.workerNo || profile.workerNo || '身份已通过审核'
            }}</view>
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
          <view class="status-actions">
            <button class="ss-reset-button ghost-btn" @tap="setWorkStatus(DeltaWorkStatus.ONLINE)">
              设为在线
            </button>
            <button class="ss-reset-button ghost-btn" @tap="setWorkStatus(DeltaWorkStatus.OFFLINE)">
              设为离线
            </button>
            <button class="ss-reset-button ghost-btn" @tap="setWorkStatus(DeltaWorkStatus.PAUSED)">
              暂停接单
            </button>
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
  import { computed, ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { showAuthModal } from '@/sheep/hooks/useModal';
  import WorkerTabbar from '../components/worker-tabbar.vue';
  import {
    DeltaAppMode,
    DeltaAuditStatus,
    DeltaRoute,
    DeltaWorkStatus,
  } from '@/sheep/helper/delta';

  const userStore = sheep.$store('user');
  const deltaStore = sheep.$store('delta');
  const guardError = ref('');
  const entries = [
    { title: '接单大厅', desc: '查看并领取匹配服务单', icon: '抢', url: DeltaRoute.WORKER_POOL },
    { title: '我的任务', desc: '执行服务与提交凭证', icon: '单', url: DeltaRoute.WORKER_ORDERS },
    { title: '收入结算', desc: '查看结算状态和收入', icon: '收', url: DeltaRoute.WORKER_INCOME },
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

  async function guardWorkerHome() {
    guardError.value = '';
    if (!userStore.isLogin) {
      showAuthModal();
      deltaStore.exitWorkerMode(DeltaRoute.SHOP_USER);
      return;
    }
    const res = await deltaStore.fetchWorkerIdentity({ force: true, showError: false });
    if (res?.code !== 0) {
      guardError.value = deltaStore.identityError || '请稍后重试';
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
      return;
    }
    if (!deltaStore.canEnterWorker) {
      const route = deltaStore.resolveWorkerRoute(deltaStore.identity);
      sheep.$router.redirect(route);
      return;
    }
    deltaStore.setAppMode(DeltaAppMode.WORKER);
    await deltaStore.fetchWorkerProfile({ showError: false });
  }

  async function setWorkStatus(workStatus) {
    await deltaStore.updateWorkerWorkStatus(workStatus);
  }

  function exitToShop() {
    deltaStore.exitWorkerMode(DeltaRoute.SHOP_USER);
  }

  function go(url) {
    sheep.$router.go(url);
  }

  onShow(guardWorkerHome);
</script>

<style lang="scss" scoped>
  .worker-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 0;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .hero,
  .status-card,
  .entry-card,
  .notice-card {
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
    border-radius: 50%;
    overflow: hidden;
    background: #e60012;
    color: #ffffff;
    font-size: 34rpx;
    line-height: 92rpx;
    text-align: center;
    font-weight: 800;
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    display: block;
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
  .notice-card {
    margin-top: 22rpx;
    padding: 28rpx;
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
    color: #fff;
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

  .status-actions {
    display: flex;
    margin-top: 24rpx;
  }

  .ghost-btn {
    flex: 1;
    height: 58rpx;
    margin-right: 12rpx;
    border-radius: 999rpx;
    background: #fff0f1;
    color: #e60012;
    font-size: 23rpx;
    line-height: 58rpx;
  }

  .ghost-btn:last-child {
    margin-right: 0;
  }

  .exit-btn,
  .retry-btn {
    margin-top: 28rpx;
    height: 82rpx;
    border-radius: 999rpx;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }

  .exit-btn {
    background: #17191f;
    color: #ffffff;
  }

  .retry-btn {
    width: 100%;
    background: #e60012;
    color: #ffffff;
  }
</style>
