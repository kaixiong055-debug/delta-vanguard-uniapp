<template>
  <s-layout title="收入明细" :bgStyle="{ color: '#f4f6f8' }">
    <view class="income-page">
      <view class="summary-card" v-if="summary">
        <view v-for="item in summaryItems" :key="item.key" class="summary-item"
          ><view class="summary-value">{{ formatDeltaAmount(summary[item.key]) }}</view
          ><view class="summary-label">{{ item.label }}</view></view
        >
      </view>
      <view class="tabs"
        ><view
          v-for="item in statusOptions"
          :key="String(item.value)"
          class="tab"
          :class="{ active: state.status === item.value }"
          @tap="changeStatus(item.value)"
          >{{ item.label }}</view
        ></view
      >
      <view v-if="state.error" class="error-card"
        >{{ state.error }}<text @tap="getList(true)">重试</text></view
      >
      <view v-for="item in state.list" :key="item.id" class="record-card" @tap="goDetail(item.id)">
        <view class="record-title">{{ item.settlementNo }}</view>
        <view class="record-status">{{ item.settlementStatusName || '-' }}</view>
        <view class="record-amount">{{ formatDeltaAmount(item.workerAmount) }}</view>
        <view class="record-time"
          >服务单 {{ item.serviceOrderNo }} · {{ formatDeltaTime(item.createTime) }}</view
        >
      </view>
      <s-empty v-if="!state.loading && state.list.length === 0" text="暂无收入记录" />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
  import SettlementApi from '@/sheep/api/delta/settlement';
  import sheep from '@/sheep';
  import { formatDeltaAmount, formatDeltaTime } from '@/sheep/helper/delta';

  const summary = ref(null);
  const deltaStore = sheep.$store('delta');
  const summaryItems = [
    { key: 'pendingReviewAmount', label: '待审核' },
    { key: 'approvedAmount', label: '已通过' },
    { key: 'paidAmount', label: '已打款' },
    { key: 'rejectedAmount', label: '已驳回' },
    { key: 'totalPaidAmount', label: '累计打款' },
  ];
  const statusOptions = [
    { label: '全部', value: undefined },
    { label: '待审核', value: 0 },
    { label: '已通过', value: 1 },
    { label: '已打款', value: 2 },
    { label: '已驳回', value: 3 },
  ];
  const state = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    loading: false,
    loadStatus: 'more',
    status: undefined,
    error: '',
  });

  async function getSummary() {
    const res = await SettlementApi.getSummary({ showError: false });
    if (res?.code === 0) {
      summary.value = res.data || null;
    }
  }

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
    const res = await SettlementApi.getPage(
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
      state.error = res?.msg || '结算记录加载失败';
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
  function goDetail(id) {
    sheep.$router.go('/pages-worker/income/detail', { id });
  }

  function loadMore() {
    if (state.loadStatus !== 'more' || state.loading) {
      return;
    }
    state.pageNo++;
    getList();
  }

  function refresh() {
    getSummary();
    getList(true);
  }

  onShow(async () => {
    if (await deltaStore.guardWorkerPage()) refresh();
  });
  onPullDownRefresh(refresh);
  onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
  .income-page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .summary-card {
    display: flex;
    margin-bottom: 20rpx;
    padding: 26rpx 12rpx;
    border-radius: 18rpx;
    background: #17191f;
  }

  .summary-item {
    flex: 1;
    text-align: center;
  }

  .summary-value {
    color: #ffffff;
    font-size: 28rpx;
    line-height: 54rpx;
    font-weight: 800;
  }

  .summary-label {
    color: rgba(255, 255, 255, 0.68);
    font-size: 24rpx;
    line-height: 34rpx;
  }

  .record-card {
    margin-bottom: 16rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: #ffffff;
  }

  .record-title {
    color: #17191f;
    font-size: 28rpx;
    line-height: 40rpx;
    font-weight: 800;
  }
  .record-status {
    float: right;
    margin-top: -38rpx;
    color: #e60012;
    font-size: 22rpx;
  }
  .tabs {
    display: flex;
    overflow-x: auto;
    margin-bottom: 18rpx;
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

  .record-amount {
    margin-top: 10rpx;
    color: #e60012;
    font-size: 34rpx;
    line-height: 46rpx;
    font-weight: 800;
  }

  .record-time {
    margin-top: 8rpx;
    color: #969ca6;
    font-size: 23rpx;
    line-height: 34rpx;
  }
</style>
