<template>
  <s-layout title="售后记录" :bgStyle="{ color: '#f4f6f8' }"
    ><view class="page"
      ><scroll-view scroll-x class="tabs"
        ><view class="tab-row"
          ><view
            v-for="item in statuses"
            :key="String(item.value)"
            class="tab"
            :class="{ active: state.status === item.value }"
            @tap="change(item.value)"
            >{{ item.label }}</view
          ></view
        ></scroll-view
      ><view v-if="state.error" class="error"
        >{{ state.error }}<text @tap="load(true)">重试</text></view
      ><view v-for="item in state.list" :key="item.id" class="card" @tap="go(item.id)"
        ><view class="head"
          ><view>{{ item.afterSaleNo }}</view
          ><text>{{ item.statusName || '-' }}</text></view
        ><view class="meta">服务单 {{ item.serviceOrderNo }}</view
        ><view class="reason">{{ item.reason || '-' }}</view
        ><view class="foot"
          ><text>{{ item.createTime || '-' }}</text
          ><view>{{ formatDeltaAmount(item.requestedRefundAmount) }}</view></view
        ></view
      ><s-empty
        v-if="!state.loading && !state.error && !state.list.length"
        text="暂无售后记录" /><uni-load-more
        v-if="state.list.length"
        :status="state.loadStatus" /></view
  ></s-layout>
</template>
<script setup>
  import { reactive } from 'vue';
  import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import { formatDeltaAmount } from '@/sheep/helper/delta';
  const statuses = [
    { label: '全部', value: undefined },
    { label: '待处理', value: 0 },
    { label: '已受理', value: 1 },
    { label: '已驳回', value: 2 },
    { label: '已仲裁', value: 3 },
    { label: '已关闭', value: 4 },
  ];
  const state = reactive({
    status: undefined,
    list: [],
    pageNo: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    loadStatus: 'more',
    error: '',
  });
  async function load(reset = false) {
    if (state.loading) return;
    if (reset) {
      state.pageNo = 1;
      state.list = [];
    }
    state.loading = true;
    state.error = '';
    const res = await ServiceOrderApi.getAfterSalePage(
      { pageNo: state.pageNo, pageSize: state.pageSize, status: state.status },
      { showError: false },
    );
    if (res?.code === 0) {
      const rows = res.data?.list || [];
      state.total = res.data?.total || 0;
      state.list = reset ? rows : state.list.concat(rows);
      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
    } else {
      state.error = res?.msg || '加载失败';
      if (!reset && state.pageNo > 1) state.pageNo--;
    }
    state.loading = false;
    uni.stopPullDownRefresh();
  }
  function change(status) {
    state.status = status;
    load(true);
  }
  function go(id) {
    sheep.$router.go('/pages-delta/after-sale/detail', { id });
  }
  function more() {
    if (!state.loading && state.loadStatus === 'more') {
      state.pageNo++;
      load();
    }
  }
  onShow(() => load(true));
  onPullDownRefresh(() => load(true));
  onReachBottom(more);
</script>
<style lang="scss" scoped>
  .page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }
  .tabs {
    margin-bottom: 16rpx;
    white-space: nowrap;
  }
  .tab-row {
    display: inline-flex;
    padding: 8rpx;
    border-radius: 14rpx;
    background: #fff;
  }
  .tab {
    min-width: 120rpx;
    height: 56rpx;
    border-radius: 10rpx;
    color: #777;
    font-size: 23rpx;
    line-height: 56rpx;
    text-align: center;
  }
  .tab.active {
    color: #fff;
    background: #e60012;
  }
  .card,
  .error {
    margin-bottom: 16rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: #fff;
  }
  .head,
  .foot {
    display: flex;
    justify-content: space-between;
  }
  .head {
    font-size: 27rpx;
    font-weight: 800;
  }
  .head text,
  .foot view {
    color: #e60012;
  }
  .meta,
  .reason,
  .foot {
    margin-top: 10rpx;
    color: #777;
    font-size: 23rpx;
  }
  .reason {
    color: #333;
  }
  .error {
    color: #999;
  }
  .error text {
    float: right;
    color: #e60012;
  }
</style>
