<template>
  <s-layout title="接单大厅" :bgStyle="{ color: '#f4f6f8' }">
    <view class="worker-page">
      <worker-order-card v-for="item in state.list" :key="item.id" :order="item" @tap="goDetail">
        <template #action>
          <button class="ss-reset-button card-btn" @tap.stop="takeOrder(item.id)">接单</button>
        </template>
      </worker-order-card>
      <s-empty v-if="!state.loading && state.list.length === 0" text="暂无可接服务单" />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>
    <worker-tabbar active="/pages-worker/pool/index" />
  </s-layout>
</template>

<script setup>
  import { reactive } from 'vue';
  import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import OrderPoolApi from '@/sheep/api/delta/orderPool';
  import WorkerTabbar from '../components/worker-tabbar.vue';
  import WorkerOrderCard from '../components/worker-order-card.vue';

  const state = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    loading: false,
    loadStatus: 'more',
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
    state.loadStatus = 'loading';
    const res = await OrderPoolApi.getPage(
      {
        pageNo: state.pageNo,
        pageSize: state.pageSize,
      },
      { showError: false },
    );
    if (res?.code === 0) {
      const list = res.data?.list || [];
      state.total = res.data?.total || 0;
      state.list = reset ? list : state.list.concat(list);
      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
    } else {
      state.loadStatus = state.list.length > 0 ? 'more' : 'noMore';
    }
    state.loading = false;
    uni.stopPullDownRefresh();
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

  async function takeOrder(id) {
    const res = await OrderPoolApi.takeOrder(id);
    if (res?.code === 0) {
      getList(true);
    }
  }

  onLoad(() => getList(true));
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
</style>
