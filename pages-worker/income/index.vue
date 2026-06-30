<template>
  <s-layout title="收入明细" :bgStyle="{ color: '#f4f6f8' }">
    <view class="income-page">
      <view class="summary-card" v-if="summary">
        <view class="summary-item">
          <view class="summary-value">{{ summary.totalIncome || 0 }}</view>
          <view class="summary-label">累计收入</view>
        </view>
        <view class="summary-item">
          <view class="summary-value">{{ summary.waitSettlement || 0 }}</view>
          <view class="summary-label">待结算</view>
        </view>
      </view>

      <view v-for="item in state.list" :key="item.id" class="record-card">
        <view class="record-title">{{ item.title || item.typeName || '收入记录' }}</view>
        <view class="record-amount">{{ item.amount || item.price || 0 }}</view>
        <view class="record-time">{{ item.createTime || '' }}</view>
      </view>
      <s-empty v-if="!state.loading && state.list.length === 0" text="暂无收入记录" />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
  import SettlementApi from '@/sheep/api/delta/settlement';

  const summary = ref(null);
  const state = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    loading: false,
    loadStatus: 'more',
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
    state.loadStatus = 'loading';
    const res = await SettlementApi.getRecordPage(
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

  function refresh() {
    getSummary();
    getList(true);
  }

  onLoad(refresh);
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
    padding: 30rpx 18rpx;
    border-radius: 18rpx;
    background: #17191f;
  }

  .summary-item {
    flex: 1;
    text-align: center;
  }

  .summary-value {
    color: #ffffff;
    font-size: 40rpx;
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
