<template>
  <s-layout title="我的任务" :bgStyle="{ color: '#f4f6f8' }">
    <view class="worker-page">
      <view class="tabs">
        <view
          v-for="item in tabs"
          :key="String(item.value)"
          class="tab"
          :class="{ active: state.status === item.value }"
          @tap="changeStatus(item.value)"
        >
          {{ item.label }}
        </view>
      </view>

      <view v-if="state.error" class="error-card">
        {{ state.error }}
        <text @tap="getList(true)">重试</text>
      </view>

      <worker-order-card
        v-for="(item, index) in state.list"
        :key="item.id || `${item.serviceOrderNo || 'invalid-order'}-${index}`"
        :order="item"
        @tap="goDetail"
      />

      <s-empty v-if="!state.loading && !state.error && state.list.length === 0" text="暂无任务" />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>

    <worker-tabbar :active="DeltaRoute.WORKER_ORDERS" />
  </s-layout>
</template>

<script setup>
  import { reactive } from 'vue';
  import { onLoad, onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerOrderApi from '@/sheep/api/delta/workerOrder';
  import WorkerTabbar from '../components/worker-tabbar.vue';
  import WorkerOrderCard from '../components/worker-order-card.vue';
  import { DeltaRoute, ServiceOrderStatus } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');

  function normalizeLongId(value) {
    const text = String(value ?? '').trim();
    return /^[1-9]\d*$/.test(text) ? text : '';
  }

  function normalizeCount(value) {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 0) {
      return 0;
    }
    return number;
  }

  function restoreAfterLoadFailure(reset, requestedPage) {
    if (!reset && requestedPage > 1) {
      state.pageNo = requestedPage - 1;
    }
    state.loadStatus = state.list.length > 0 ? 'more' : 'noMore';
  }

  function normalizeOrder(item = {}) {
    return {
      ...item,
      id: normalizeLongId(item.id),
    };
  }

  const tabs = [
    { label: '全部', value: undefined },
    { label: '待开始', value: ServiceOrderStatus.ACCEPTED_PENDING_START },
    { label: '进行中', value: ServiceOrderStatus.IN_PROGRESS },
    { label: '待验收', value: ServiceOrderStatus.WORKER_SUBMITTED },
    { label: '已完成', value: ServiceOrderStatus.COMPLETED },
  ];

  const allowedStatuses = tabs.map((item) => item.value).filter((value) => value !== undefined);

  const state = reactive({
    status: undefined,
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    loading: false,
    loadStatus: 'more',
    error: '',
  });

  function normalizeStatus(value) {
    if (value === undefined || value === null || value === '') return undefined;
    const status = Number(value);
    return allowedStatuses.includes(status) ? status : undefined;
  }

  async function getList(reset = false) {
    if (state.loading) {
      uni.stopPullDownRefresh();
      return;
    }

    if (!reset && state.loadStatus === 'noMore') {
      uni.stopPullDownRefresh();
      return;
    }

    if (reset) {
      state.pageNo = 1;
      state.list = [];
      state.total = 0;
      state.loadStatus = 'more';
      state.error = '';
    }

    const requestedPage = state.pageNo;
    state.loading = true;
    state.error = '';
    state.loadStatus = 'loading';

    try {
      const params = {
        pageNo: requestedPage,
        pageSize: state.pageSize,
      };
      if (state.status !== undefined) params.status = state.status;

      const res = await WorkerOrderApi.getPage(params, { showError: false });

      if (res?.code !== 0) {
        state.error = res?.msg || '任务加载失败';
        restoreAfterLoadFailure(reset, requestedPage);
        return;
      }

      const rows = Array.isArray(res.data?.list) ? res.data.list.map(normalizeOrder) : [];
      const total = normalizeCount(res.data?.total);

      state.total = total;
      state.list = reset ? rows : state.list.concat(rows);
      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
    } catch (error) {
      state.error = error?.msg || error?.message || '任务加载失败';
      restoreAfterLoadFailure(reset, requestedPage);
    } finally {
      state.loading = false;
      uni.stopPullDownRefresh();
    }
  }

  function changeStatus(status) {
    if (state.loading) return;

    const normalized = normalizeStatus(status);

    if (normalized === state.status) return;

    state.status = normalized;
    getList(true);
  }

  function loadMore() {
    if (state.loadStatus !== 'more' || state.loading) return;
    state.pageNo += 1;
    getList();
  }

  function goDetail(order = {}) {
    const serviceOrderId = normalizeLongId(order.id);

    if (!serviceOrderId) {
      sheep.$helper.toast('服务单 ID 不存在');
      return;
    }

    sheep.$router.go('/pages-worker/order/detail', {
      id: serviceOrderId,
    });
  }

  async function loadWithWorkerGuard() {
    try {
      if (await deltaStore.guardWorkerPage()) {
        await getList(true);
      }
    } catch (error) {
      state.error = error?.msg || error?.message || '打手身份校验失败';
    } finally {
      uni.stopPullDownRefresh();
    }
  }

  onLoad((options = {}) => {
    state.status = normalizeStatus(options.status);
  });

  onShow(loadWithWorkerGuard);
  onPullDownRefresh(loadWithWorkerGuard);
  onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
  .worker-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 130rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .tabs {
    display: flex;
    margin-bottom: 20rpx;
    padding: 8rpx;
    overflow-x: auto;
    border-radius: 16rpx;
    background: #ffffff;
  }

  .tab {
    flex: 1;
    min-width: 120rpx;
    height: 58rpx;
    border-radius: 12rpx;
    color: #7e8490;
    font-size: 24rpx;
    line-height: 58rpx;
    text-align: center;
  }

  .tab.active {
    color: #ffffff;
    background: #e60012;
    font-weight: 800;
  }

  .error-card {
    margin-bottom: 18rpx;
    padding: 22rpx;
    border-radius: 14rpx;
    color: #8c929d;
    background: #fff;
    font-size: 24rpx;
  }

  .error-card text {
    float: right;
    color: #e60012;
  }
</style>
