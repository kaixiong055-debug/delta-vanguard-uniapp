<template>
  <s-layout title="接单大厅" :bgStyle="{ color: '#f4f6f8' }">
    <view class="worker-page">
      <view class="filters">
        <picker :range="serviceOptions" range-key="label" @change="changeServiceType">
          <view class="filter-item">{{ serviceOptions[state.serviceIndex].label }}</view>
        </picker>
        <picker :range="deviceOptions" range-key="label" @change="changeDeviceType">
          <view class="filter-item">{{ deviceOptions[state.deviceIndex].label }}</view>
        </picker>
      </view>
      <view v-if="state.error" class="error-card"
        >{{ state.error }}<text @tap="getList(true)">重试</text></view
      >
      <worker-order-card v-for="item in state.list" :key="item.id" :order="item" @tap="goDetail">
        <template #action>
          <button
            class="ss-reset-button card-btn"
            :disabled="claimingId === item.id"
            @tap.stop="confirmClaim(item)"
            >{{ claimingId === item.id ? '接单中' : '接单' }}</button
          >
        </template>
      </worker-order-card>
      <s-empty v-if="!state.loading && state.list.length === 0" text="暂无可接服务单" />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>
    <worker-tabbar active="/pages-worker/pool/index" />
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import OrderPoolApi from '@/sheep/api/delta/orderPool';
  import WorkerTabbar from '../components/worker-tabbar.vue';
  import WorkerOrderCard from '../components/worker-order-card.vue';
  import { DeltaRoute } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const claimingId = ref(null);
  const serviceOptions = [
    { label: '全部服务', value: undefined },
    { label: '陪玩', value: 1 },
    { label: '护航', value: 2 },
    { label: '趣味单', value: 3 },
  ];
  const deviceOptions = [
    { label: '全部设备', value: undefined },
    { label: '手机', value: 1 },
    { label: '平板', value: 2 },
    { label: 'PC', value: 3 },
  ];

  const state = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    loading: false,
    loadStatus: 'more',
    serviceIndex: 0,
    deviceIndex: 0,
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
    const res = await OrderPoolApi.getPage(
      {
        pageNo: state.pageNo,
        pageSize: state.pageSize,
        serviceType: serviceOptions[state.serviceIndex].value,
        deviceType: deviceOptions[state.deviceIndex].value,
      },
      { showError: false },
    );
    if (res?.code === 0) {
      const list = res.data?.list || [];
      state.total = res.data?.total || 0;
      state.list = reset ? list : state.list.concat(list);
      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
    } else {
      state.error = res?.msg || '加载失败，请重试';
      if (!reset && state.pageNo > 1) state.pageNo--;
      state.loadStatus = state.list.length > 0 ? 'more' : 'noMore';
    }
    state.loading = false;
    uni.stopPullDownRefresh();
  }

  function changeServiceType(e) {
    state.serviceIndex = Number(e.detail.value);
    getList(true);
  }
  function changeDeviceType(e) {
    state.deviceIndex = Number(e.detail.value);
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
    sheep.$router.go('/pages-worker/pool/detail', { id: order.id });
  }

  function confirmClaim(item) {
    if (claimingId.value) return;
    uni.showModal({
      title: '确认接单',
      content: `确认领取服务单 ${item.serviceOrderNo || ''}？`,
      success: ({ confirm }) => {
        if (confirm) claimOrder(item.id);
      },
    });
  }

  async function claimOrder(id) {
    if (claimingId.value) return;
    claimingId.value = id;
    const res = await OrderPoolApi.claimOrder(id);
    if (res?.code === 0) {
      await getList(true);
      sheep.$router.go(DeltaRoute.WORKER_ORDERS);
    }
    claimingId.value = null;
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

  .card-btn {
    min-width: 112rpx;
    height: 52rpx;
    padding: 0 22rpx;
    border-radius: 999rpx;
    background: #e60012;
    color: #ffffff;
    font-size: 24rpx;
    line-height: 52rpx;
  }
  .filters {
    display: flex;
    gap: 16rpx;
    margin-bottom: 20rpx;
  }
  .filters picker {
    flex: 1;
  }
  .filter-item {
    height: 64rpx;
    border-radius: 14rpx;
    background: #fff;
    color: #444;
    font-size: 24rpx;
    line-height: 64rpx;
    text-align: center;
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
