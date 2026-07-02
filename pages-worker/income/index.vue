<template>
  <s-layout title="收入结算" :bgStyle="{ color: '#f4f6f8' }">
    <view class="income-page">
      <view class="summary-card">
        <view class="summary-primary">
          <view class="summary-primary-label">累计已打款</view>
          <view class="summary-primary-value">
            {{ formatSummaryAmount('totalPaidAmount') }}
          </view>
        </view>
        <view class="summary-grid">
          <view v-for="item in summaryItems" :key="item.key" class="summary-item">
            <view class="summary-value">{{ formatSummaryAmount(item.key) }}</view>
            <view class="summary-label">{{ item.label }}</view>
          </view>
        </view>
        <view v-if="summaryError" class="summary-error" @tap="refreshWithWorkerGuard">
          {{ summaryError }}，点击重试
        </view>
      </view>

      <view class="notice-card">
        <view>这里展示服务订单产生的结算记录，不代表商城余额或可提现余额。</view>
        <view>结算由平台审核和打款，小程序当前不提供提现操作。</view>
      </view>

      <scroll-view class="tabs" scroll-x :show-scrollbar="false">
        <view class="tabs-inner">
          <view
            v-for="item in statusOptions"
            :key="item.key"
            class="tab"
            :class="{ active: state.status === item.value }"
            @tap="changeStatus(item.value)"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>

      <view class="status-tip">{{ statusDescription }}</view>

      <view v-if="state.error" class="error-card">
        <text>{{ state.error }}</text>
        <text class="retry" @tap="refreshWithWorkerGuard">重试</text>
      </view>

      <view
        v-for="(item, index) in state.list"
        :key="item.id || `${item.settlementNo || 'invalid-settlement'}-${index}`"
        class="record-card"
        @tap="goDetail(item.id)"
      >
        <view class="record-head">
          <view>
            <view class="record-label">结算单号</view>
            <view class="record-title">{{ safeText(item.settlementNo) }}</view>
          </view>
          <view class="record-status" :class="`status-${Number(item.settlementStatus)}`">
            {{ formatStatus(item) }}
          </view>
        </view>

        <view class="income-row">
          <text>打手收入</text>
          <text>{{ formatAmount(item.workerAmount) }}</text>
        </view>

        <view class="record-grid">
          <view class="record-field">
            <text>服务单号</text>
            <view>{{ safeText(item.serviceOrderNo) }}</view>
          </view>
          <view class="record-field">
            <text>服务金额</text>
            <view>{{ formatAmount(item.serviceAmount) }}</view>
          </view>
          <view class="record-field">
            <text>平台费用</text>
            <view>{{ formatAmount(item.platformFee) }}</view>
          </view>
          <view class="record-field">
            <text>创建时间</text>
            <view>{{ formatDeltaTime(item.createTime) }}</view>
          </view>
        </view>

        <view class="record-more">查看详情 ›</view>
      </view>

      <s-empty
        v-if="!state.loading && !state.error && state.list.length === 0"
        text="暂无结算记录"
      />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, reactive, ref } from 'vue';
  import { onLoad, onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
  import SettlementApi from '@/sheep/api/delta/settlement';
  import sheep from '@/sheep';
  import {
    SettlementStatus,
    formatDeltaAmount,
    formatDeltaTime,
    getSettlementStatusText,
  } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const summary = ref({});
  const summaryError = ref('');
  const summaryLoading = ref(false);

  const summaryItems = [
    { key: 'pendingReviewAmount', label: '待审核金额' },
    { key: 'approvedAmount', label: '已通过待打款' },
    { key: 'paidAmount', label: '已打款金额' },
    { key: 'rejectedAmount', label: '已驳回金额' },
  ];

  const validSettlementStatuses = Object.values(SettlementStatus);

  const statusOptions = [
    { key: 'all', label: '全部', value: undefined },
    { key: 'pending', label: '待审核', value: SettlementStatus.PENDING_REVIEW },
    { key: 'approved', label: '已通过', value: SettlementStatus.APPROVED },
    { key: 'paid', label: '已打款', value: SettlementStatus.PAID },
    { key: 'rejected', label: '已驳回', value: SettlementStatus.REJECTED },
  ];

  const statusDescriptions = {
    [SettlementStatus.PENDING_REVIEW]: '订单完成后生成结算记录，等待平台审核。',
    [SettlementStatus.APPROVED]: '平台已经审核通过，等待安排打款。',
    [SettlementStatus.PAID]: '平台已经完成打款，可进入详情查看实际打款时间。',
    [SettlementStatus.REJECTED]: '进入详情查看审核说明，需要处理时联系平台客服。',
  };

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

  const statusDescription = computed(
    () => statusDescriptions[state.status] || '查看全部服务订单结算记录及平台处理状态。',
  );

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

  function normalizeSettlementStatus(value) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const status = Number(value);

    return validSettlementStatuses.includes(status) ? status : undefined;
  }

  function normalizeSettlementRecord(item = {}) {
    return {
      ...item,
      id: normalizeLongId(item.id),
    };
  }

  function hasValue(value) {
    return value !== null && value !== undefined && value !== '';
  }

  function safeText(value) {
    return hasValue(value) ? String(value) : '-';
  }

  function formatAmount(value) {
    if (!hasValue(value)) return '-';
    const amount = Number(value);
    return Number.isFinite(amount) ? formatDeltaAmount(amount) : '-';
  }

  function formatStatus(item) {
    const status = getSettlementStatusText(item?.settlementStatus);
    return status === '-' ? safeText(item?.settlementStatusName) : status;
  }

  function formatSummaryAmount(key) {
    return formatAmount(summary.value?.[key]);
  }

  function restoreAfterLoadFailure(reset, requestedPage) {
    if (!reset && requestedPage > 1) {
      state.pageNo = requestedPage - 1;
    }

    state.loadStatus = state.list.length > 0 ? 'more' : 'noMore';
  }

  async function getSummary() {
    if (summaryLoading.value) return;

    summaryLoading.value = true;
    summaryError.value = '';
    try {
      const res = await SettlementApi.getSummary({
        showError: false,
        showLoading: false,
      });
      if (res?.code === 0) {
        summary.value = res.data && typeof res.data === 'object' ? res.data : {};
      } else {
        summary.value = {};
        summaryError.value = res?.msg || '收入总览加载失败';
      }
    } catch (error) {
      summary.value = {};
      summaryError.value = error?.msg || error?.message || '收入总览加载失败';
    } finally {
      summaryLoading.value = false;
    }
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

      if (state.status !== undefined) {
        params.status = state.status;
      }

      const res = await SettlementApi.getPage(params, {
        showError: false,
        showLoading: false,
      });

      if (res?.code === 0) {
        const rows = Array.isArray(res.data?.list)
          ? res.data.list.map(normalizeSettlementRecord)
          : [];
        state.total = normalizeCount(res.data?.total);
        state.list = reset ? rows : state.list.concat(rows);
        state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
      } else {
        state.error = res?.msg || '结算记录加载失败';
        restoreAfterLoadFailure(reset, requestedPage);
      }
    } catch (error) {
      state.error = error?.msg || error?.message || '结算记录加载失败';
      restoreAfterLoadFailure(reset, requestedPage);
    } finally {
      state.loading = false;
      uni.stopPullDownRefresh();
    }
  }

  async function refreshWithWorkerGuard() {
    try {
      const allowed = await deltaStore.guardWorkerPage();

      if (!allowed) return;

      await Promise.all([getSummary(), getList(true)]);
    } catch (guardError) {
      state.error = guardError?.msg || guardError?.message || '打手身份校验失败';
    } finally {
      uni.stopPullDownRefresh();
    }
  }

  async function changeStatus(status) {
    if (state.loading) return;

    const nextStatus = normalizeSettlementStatus(status);

    if (state.status === nextStatus) return;

    try {
      const allowed = await deltaStore.guardWorkerPage();
      if (!allowed) return;

      state.status = nextStatus;
      await getList(true);
    } catch (guardError) {
      state.error = guardError?.msg || guardError?.message || '打手身份校验失败';
    }
  }

  function goDetail(id) {
    const settlementId = normalizeLongId(id);

    if (!settlementId) {
      sheep.$helper.toast('结算 ID 不存在');
      return;
    }

    sheep.$router.go('/pages-worker/income/detail', {
      id: settlementId,
    });
  }

  function loadMore() {
    if (state.loading || state.loadStatus !== 'more') {
      return;
    }

    state.pageNo += 1;
    getList();
  }

  onLoad((options = {}) => {
    state.status = normalizeSettlementStatus(options.status);
  });

  onShow(async () => {
    await refreshWithWorkerGuard();
  });

  onPullDownRefresh(async () => {
    await refreshWithWorkerGuard();
  });
  onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
  .income-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 60rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .summary-card {
    overflow: hidden;
    margin-bottom: 18rpx;
    border-radius: 20rpx;
    color: #fff;
    background: #17191f;
  }

  .summary-primary {
    padding: 34rpx 28rpx 26rpx;
    text-align: center;
  }

  .summary-primary-label {
    color: rgba(255, 255, 255, 0.68);
    font-size: 24rpx;
  }

  .summary-primary-value {
    margin-top: 8rpx;
    font-size: 50rpx;
    line-height: 66rpx;
    font-weight: 800;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    border-top: 1rpx solid rgba(255, 255, 255, 0.1);
  }

  .summary-item {
    padding: 22rpx 12rpx;
    border-right: 1rpx solid rgba(255, 255, 255, 0.08);
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
    text-align: center;
  }

  .summary-value {
    font-size: 27rpx;
    font-weight: 700;
  }

  .summary-label {
    margin-top: 6rpx;
    color: rgba(255, 255, 255, 0.62);
    font-size: 21rpx;
  }

  .summary-error {
    padding: 16rpx 24rpx;
    color: #ffd1d4;
    background: rgba(230, 0, 18, 0.18);
    font-size: 22rpx;
    text-align: center;
  }

  .notice-card,
  .status-tip,
  .error-card,
  .record-card {
    margin-bottom: 18rpx;
    border-radius: 16rpx;
    background: #fff;
  }

  .notice-card {
    padding: 22rpx 24rpx;
    color: #747b87;
    font-size: 23rpx;
    line-height: 38rpx;
  }

  .tabs {
    width: 100%;
    margin-bottom: 14rpx;
    border-radius: 14rpx;
    background: #fff;
    white-space: nowrap;
  }

  .tabs-inner {
    display: inline-flex;
    padding: 8rpx;
  }

  .tab {
    width: 128rpx;
    height: 58rpx;
    border-radius: 10rpx;
    color: #777d87;
    font-size: 23rpx;
    line-height: 58rpx;
    text-align: center;
  }

  .tab.active {
    color: #fff;
    background: #e60012;
    font-weight: 700;
  }

  .status-tip {
    padding: 18rpx 22rpx;
    color: #7f8590;
    font-size: 23rpx;
    line-height: 36rpx;
  }

  .error-card,
  .record-head,
  .income-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .error-card {
    padding: 22rpx;
    color: #8c929d;
    font-size: 24rpx;
  }

  .retry {
    color: #e60012;
  }

  .record-card {
    padding: 24rpx;
  }

  .record-label {
    color: #9a9fa8;
    font-size: 21rpx;
  }

  .record-title {
    margin-top: 5rpx;
    color: #20242c;
    font-size: 27rpx;
    font-weight: 800;
  }

  .record-status {
    padding: 7rpx 14rpx;
    border-radius: 999rpx;
    color: #8c6400;
    background: #fff7df;
    font-size: 21rpx;
  }

  .record-status.status-1,
  .record-status.status-2 {
    color: #168a48;
    background: #edf9f2;
  }

  .record-status.status-3 {
    color: #c63843;
    background: #fff0f1;
  }

  .income-row {
    margin-top: 20rpx;
    padding: 20rpx;
    border-radius: 12rpx;
    color: #737984;
    background: #f7f8fa;
    font-size: 24rpx;
  }

  .income-row text:last-child {
    color: #e60012;
    font-size: 36rpx;
    font-weight: 800;
  }

  .record-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18rpx 24rpx;
    margin-top: 20rpx;
  }

  .record-field text {
    color: #9a9fa8;
    font-size: 21rpx;
  }

  .record-field view {
    overflow: hidden;
    margin-top: 5rpx;
    color: #343841;
    font-size: 23rpx;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .record-more {
    margin-top: 20rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid #eff1f4;
    color: #8f949d;
    font-size: 22rpx;
    text-align: right;
  }
</style>
