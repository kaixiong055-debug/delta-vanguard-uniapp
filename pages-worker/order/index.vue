<template>
  <s-layout title="我的任务" :bgStyle="{ color: '#f4f6f8' }">
    <view class="worker-page">
      <view class="tabs">
        <view
          v-for="item in tabs"
          :key="item.value"
          class="tab"
          :class="{ active: state.status === item.value }"
          @tap="changeStatus(item.value)"
        >
          {{ item.label }}
        </view>
      </view>
      <view v-if="state.error" class="error-card"
        >{{ state.error }}<text @tap="getList(true)">重试</text></view
      >
      <worker-order-card v-for="item in state.list" :key="item.id" :order="item" @tap="goDetail" />
      <s-empty v-if="!state.loading && state.list.length === 0" text="暂无任务" />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>
    <worker-tabbar active="/pages-worker/order/index" />
  </s-layout>
</template>

<script setup>
  import { reactive } from 'vue';
  import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerOrderApi from '@/sheep/api/delta/workerOrder';
  import WorkerTabbar from '../components/worker-tabbar.vue';
  import WorkerOrderCard from '../components/worker-order-card.vue';
  import { ServiceOrderStatus } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');

  const tabs = [
    { label: '全部', value: undefined },
    { label: '待开始', value: ServiceOrderStatus.ACCEPTED_PENDING_START },
    { label: '进行中', value: ServiceOrderStatus.IN_PROGRESS },
    { label: '待验收', value: ServiceOrderStatus.WORKER_SUBMITTED },
    { label: '已完成', value: ServiceOrderStatus.COMPLETED },
  ];

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

  async function getList(reset = false) {
    if (state.loading) {
      return;
    }
    if (reset) {
      state.pageNo = 1;
      state.list = [];
      state.loadStatus = 'more';
    }
    state.loading = true;
    state.error = '';
    state.loadStatus = 'loading';
    const res = await WorkerOrderApi.getPage(
      {
        pageNo: state.pageNo,
        pageSize: state.pageSize,
        status: state.status,
      },
      { showError: false },
    );
    if (res?.code === 0) {
      const list = res.data?.list || [];
      state.total = res.data?.total || 0;
      state.list = reset ? list : state.list.concat(list);
      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
    } else {
      state.error = res?.msg || '任务加载失败';
      if (!reset && state.pageNo > 1) state.pageNo--;
      state.loadStatus = state.list.length > 0 ? 'more' : 'noMore';
    }
    state.loading = false;
    uni.stopPullDownRefresh();
  }

  function changeStatus(status) {
    state.status = status;
    getList(true);
  }

  function loadMore() {
    if (state.loadStatus !== 'more' || state.loading) {
      return;
    }
    state.pageNo++;
    getList();
  }

  function goDetail(order) {
    sheep.$router.go('/pages-worker/order/detail', { id: order.id });
  }

  onShow(async () => {
    if (await deltaStore.guardWorkerPage()) getList(true);
  });
  onPullDownRefresh(() => getList(true));
  onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
  .worker-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 0;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .tabs {
    display: flex;
    margin-bottom: 20rpx;
    padding: 8rpx;
    border-radius: 16rpx;
    background: #ffffff;
  }

  .tab {
    flex: 1;
    min-width: 0;
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
  .tabs {
    overflow-x: auto;
  }
  .tab {
    min-width: 120rpx;
  }
  .error-card {
    margin-bottom: 18rpx;
    padding: 22rpx;
    border-radius: 14rpx;
    background: #fff;
    color: #8c929d;
    font-size: 24rpx;
  }
  .error-card text {
    float: right;
    color: #e60012;
  }
</style>
