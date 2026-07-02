<template>
  <s-layout title="售后记录" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <scroll-view scroll-x class="tabs">
        <view class="tab-row">
          <view
            v-for="item in statuses"
            :key="String(item.value ?? 'all')"
            class="tab"
            :class="{ active: state.status === item.value }"
            @tap="change(item.value)"
          >{{ item.label }}</view>
        </view>
      </scroll-view>
      <view v-if="state.error" class="error"
        >{{ state.error }}<text @tap="load(true)">重试</text></view
      >
      <view v-for="item in state.list" :key="item.id" class="card" @tap="go(item.id)">
        <view class="head">
          <view>{{ item.afterSaleNo || '-' }}</view>
          <text :class="statusClass(item.status)">{{ item.statusName || getDeltaAfterSaleStatusText(item.status) }}</text>
        </view>
        <view class="meta">服务单 {{ item.serviceOrderNo || '-' }}</view>
        <view class="reason">{{ item.reason || '-' }}</view>
        <view class="foot">
          <text>{{ formatDeltaTime(item.createTime) }}</text>
          <view>{{ formatDeltaOptionalAmount(item.requestedRefundAmount) }}</view>
        </view>
      </view>
      <s-empty
        v-if="!state.loading && !state.error && !state.list.length"
        text="暂无售后记录"
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
  DeltaAfterSaleStatus,
  getDeltaAfterSaleStatusText,
} from '@/sheep/helper/delta';

const statuses = [
  { label: '全部', value: undefined },
  { label: '待处理', value: DeltaAfterSaleStatus.PENDING },
  { label: '已受理', value: DeltaAfterSaleStatus.ACCEPTED },
  { label: '已驳回', value: DeltaAfterSaleStatus.REJECTED },
  { label: '已仲裁', value: DeltaAfterSaleStatus.ARBITRATED },
  { label: '已关闭', value: DeltaAfterSaleStatus.CLOSED },
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

function normalizeLongId(value) {
  const text = String(value ?? '').trim();
  return /^[1-9]\d*$/.test(text) ? text : '';
}

function normalizeTotal(value) {
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

function statusClass(status) {
  const s = Number(status);
  if (s === DeltaAfterSaleStatus.ACCEPTED || s === DeltaAfterSaleStatus.ARBITRATED)
    return 'tag-success';
  if (s === DeltaAfterSaleStatus.REJECTED) return 'tag-fail';
  if (s === DeltaAfterSaleStatus.PENDING) return 'tag-pending';
  if (s === DeltaAfterSaleStatus.CLOSED) return 'tag-neutral';
  return '';
}

async function load(reset = false) {
  if (state.loading) {
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

  if (!reset && state.loadStatus === 'noMore') {
    uni.stopPullDownRefresh();
    return;
  }

  const requestedPage = state.pageNo;
  state.loading = true;
  state.error = '';
  state.loadStatus = 'loading';

  try {
    const params = { pageNo: requestedPage, pageSize: state.pageSize };
    if (state.status !== undefined) params.status = state.status;
    const res = await ServiceOrderApi.getAfterSalePage(params, { showError: false });
    if (res?.code === 0) {
      const rows = Array.isArray(res.data?.list) ? res.data.list : [];
      const total = normalizeTotal(res.data?.total);
      state.total = total;
      state.list = reset ? rows : state.list.concat(rows);
      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
      return;
    }

    state.error = res?.msg || '售后记录加载失败';
    restoreAfterLoadFailure(reset, requestedPage);
  } catch (error) {
    state.error = error?.msg || error?.message || '售后记录加载失败';
    restoreAfterLoadFailure(reset, requestedPage);
  } finally {
    state.loading = false;
    uni.stopPullDownRefresh();
  }
}

async function change(status) {
  if (state.loading || state.status === status) return;
  state.status = status;
  await load(true);
}

function go(value) {
  const id = normalizeLongId(value);
  if (!id) {
    sheep.$helper.toast('售后记录 ID 不存在');
    return;
  }

  sheep.$router.go('/pages-delta/after-sale/detail', { id });
}

function more() {
  if (state.loading || state.loadStatus !== 'more') {
    return;
  }
  state.pageNo++;
  load();
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
  align-items: center;
}
.head {
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
.reason,
.foot {
  margin-top: 10rpx;
  color: #777;
  font-size: 23rpx;
}
.foot view {
  color: #e60012;
  font-weight: 800;
}
.reason {
  color: #333;
  word-break: break-all;
}
.error {
  color: #999;
}
.error text {
  float: right;
  color: #e60012;
}
</style>
