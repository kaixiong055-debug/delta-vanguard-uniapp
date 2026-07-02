<template>
  <s-layout title="退款记录" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <view v-if="state.error" class="error"
        >{{ state.error }}<text @tap="load(true)">重试</text></view
      >
      <view v-for="item in state.list" :key="item.id" class="card" @tap="go(item.id)">
        <view class="head">
          <view>{{ item.refundNo || '-' }}</view>
          <text :class="statusClass(item.refundStatus)">{{ item.refundStatusName || getDeltaRefundStatusText(item.refundStatus) }}</text>
        </view>
        <view class="meta">服务单 ID：{{ item.serviceOrderId || '-' }}</view>
        <view class="amount">{{ formatDeltaOptionalAmount(item.refundAmount) }}</view>
        <view class="foot">{{ formatDeltaTime(item.createTime) }}</view>
      </view>
      <s-empty
        v-if="!state.loading && !state.error && !state.list.length"
        text="暂无退款记录"
      />
      <uni-load-more v-if="state.list.length" :status="state.loadStatus" />
    </view>
  </s-layout>
</template>
<script setup>
import { reactive } from 'vue';
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import sheep from '@/sheep';
import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
import {
  formatDeltaOptionalAmount,
  formatDeltaTime,
  DeltaRefundStatus,
  getDeltaRefundStatusText,
} from '@/sheep/helper/delta';

const state = reactive({
  list: [],
  pageNo: 1,
  pageSize: 10,
  total: 0,
  loading: false,
  loadStatus: 'more',
  error: '',
});

function statusClass(status) {
  const s = Number(status);
  if (s === DeltaRefundStatus.MANUAL_COMPLETED) return 'tag-success';
  if (s === DeltaRefundStatus.MANUAL_FAILED) return 'tag-fail';
  if (s === DeltaRefundStatus.PENDING_MANUAL || s === DeltaRefundStatus.MANUAL_PROCESSING)
    return 'tag-pending';
  if (s === DeltaRefundStatus.CANCELED) return 'tag-neutral';
  return '';
}

async function load(reset = false) {
  if (state.loading) return;
  if (reset) {
    state.pageNo = 1;
    state.list = [];
    state.total = 0;
    state.loadStatus = 'more';
    state.error = '';
  }
  if (!reset && state.loadStatus === 'noMore') return;
  state.loading = true;
  state.error = '';
  try {
    const res = await ServiceOrderApi.getRefundPage(
      { pageNo: state.pageNo, pageSize: state.pageSize },
      { showError: false },
    );
    if (res?.code === 0) {
      const rows = Array.isArray(res.data?.list) ? res.data.list : [];
      const total = Number(res.data?.total) || 0;
      state.total = total;
      state.list = reset ? rows : state.list.concat(rows);
      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
    } else {
      state.error = res?.msg || '加载失败';
      if (!reset && state.pageNo > 1) state.pageNo--;
    }
  } catch (e) {
    state.error = '加载失败';
    if (!reset && state.pageNo > 1) state.pageNo--;
  } finally {
    state.loading = false;
    uni.stopPullDownRefresh();
  }
}

function go(id) {
  sheep.$router.go('/pages-delta/refund/detail', { id });
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
.card,
.error {
  margin-bottom: 16rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #fff;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 27rpx;
  font-weight: 800;
}
.head text {
  font-size: 22rpx;
  font-weight: 600;
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
}
.tag-pending {
  color: #e6a23c;
  background: #fdf6ec;
}
.tag-success {
  color: #67c23a;
  background: #f0f9eb;
}
.tag-fail {
  color: #f56c6c;
  background: #fef0f0;
}
.tag-neutral {
  color: #909399;
  background: #f4f4f5;
}
.meta,
.foot {
  margin-top: 10rpx;
  color: #888;
  font-size: 23rpx;
}
.amount {
  margin-top: 12rpx;
  font-size: 32rpx;
  font-weight: 800;
  color: #e60012;
}
.error {
  color: #999;
}
.error text {
  float: right;
  color: #e60012;
}
</style>
