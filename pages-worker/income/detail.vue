<template>
  <s-layout title="结算详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="detail-page">
      <view v-if="error" class="error-card">
        <text>{{ error }}</text>
        <text class="retry" @tap="loadDetail">重试</text>
      </view>

      <block v-if="detail.id">
        <view class="hero-card">
          <view class="hero-label">打手收入</view>
          <view class="hero-amount">{{ formatAmount(detail.workerAmount) }}</view>
          <view class="hero-meta">
            <view class="status" :class="`status-${Number(detail.settlementStatus)}`">
              {{ statusText }}
            </view>
            <view class="settlement-no">结算单号：{{ safeText(detail.settlementNo) }}</view>
          </view>
        </view>

        <view v-if="statusNotice" class="status-notice" :class="noticeClass">
          <view class="notice-title">{{ statusNotice.title }}</view>
          <view class="notice-content">{{ statusNotice.content }}</view>
        </view>

        <view class="section-card">
          <view class="section-title">结算信息</view>
          <view v-for="row in settlementRows" :key="row.label" class="row">
            <text>{{ row.label }}</text>
            <view>{{ row.value }}</view>
          </view>
        </view>

        <view class="section-card">
          <view class="section-title">审核与备注</view>
          <view v-for="row in reviewRows" :key="row.label" class="row">
            <text>{{ row.label }}</text>
            <view>{{ row.value }}</view>
          </view>
        </view>
      </block>

      <s-empty v-if="!loading && !error && !detail.id" text="暂无结算详情" />
    </view>

    <view class="fixed-explanation">
      <view>服务完成后由系统生成结算记录。</view>
      <view>平台审核通过后安排打款，并更新实际打款时间。</view>
      <view>小程序当前只提供结算查询，不提供提现或修改金额操作。</view>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import SettlementApi from '@/sheep/api/delta/settlement';
  import {
    SettlementStatus,
    formatCommissionRate,
    formatDeltaAmount,
    formatDeltaTime,
    getSettlementStatusText,
  } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const id = ref('');
  const detail = ref({});
  const loading = ref(false);
  const error = ref('');

  const statusText = computed(() => {
    const status = getSettlementStatusText(detail.value.settlementStatus);
    return status === '-' ? safeText(detail.value.settlementStatusName) : status;
  });

  const statusNotice = computed(() => {
    const status = Number(detail.value.settlementStatus);
    const notices = {
      [SettlementStatus.PENDING_REVIEW]: {
        title: '等待平台审核',
        content: '订单完成后已生成结算记录，平台审核后会更新处理结果。',
      },
      [SettlementStatus.APPROVED]: {
        title: '审核已通过',
        content: '平台已经审核通过，正在等待安排打款。',
      },
      [SettlementStatus.PAID]: {
        title: '平台已打款',
        content: `实际打款时间：${formatDeltaTime(detail.value.paidTime)}`,
      },
      [SettlementStatus.REJECTED]: {
        title: '结算已驳回',
        content: safeText(detail.value.rejectReason),
      },
    };
    return notices[status] || null;
  });

  const noticeClass = computed(() => {
    const status = Number(detail.value.settlementStatus);
    if (status === SettlementStatus.REJECTED) return 'notice-rejected';
    if (status === SettlementStatus.PAID) return 'notice-paid';
    return '';
  });

  const settlementRows = computed(() => [
    { label: '结算单号', value: safeText(detail.value.settlementNo) },
    { label: '服务单号', value: safeText(detail.value.serviceOrderNo) },
    { label: '服务金额', value: formatAmount(detail.value.serviceAmount) },
    { label: '抽成比例', value: formatRate(detail.value.commissionRate) },
    { label: '平台费用', value: formatAmount(detail.value.platformFee) },
    { label: '打手收入', value: formatAmount(detail.value.workerAmount) },
    { label: '结算状态', value: statusText.value },
    { label: '创建时间', value: formatDeltaTime(detail.value.createTime) },
    { label: '更新时间', value: formatDeltaTime(detail.value.updateTime) },
  ]);

  const reviewRows = computed(() => [
    { label: '审核时间', value: formatDeltaTime(detail.value.reviewTime) },
    { label: '打款时间', value: formatDeltaTime(detail.value.paidTime) },
    { label: '驳回原因', value: safeText(detail.value.rejectReason) },
    { label: '审核说明', value: safeText(detail.value.reviewRemark) },
    { label: '结算备注', value: safeText(detail.value.remark) },
  ]);

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

  function formatRate(value) {
    return hasValue(value) ? formatCommissionRate(Number(value)) : '-';
  }

  async function loadDetail() {
    if (!id.value || loading.value) return;

    loading.value = true;
    error.value = '';

    try {
      const res = await SettlementApi.getDetail(id.value, {
        showError: false,
        showLoading: false,
      });
      if (res?.code === 0) {
        detail.value = res.data && typeof res.data === 'object' ? res.data : {};
      } else {
        detail.value = {};
        error.value = res?.msg || '结算详情加载失败';
      }
    } catch (err) {
      detail.value = {};
      error.value = err?.msg || err?.message || '结算详情加载失败';
    } finally {
      loading.value = false;
    }
  }

  onLoad((options = {}) => {
    id.value = options.id || '';
    if (!id.value) error.value = '结算 ID 不存在';
  });

  onShow(async () => {
    if (id.value && (await deltaStore.guardWorkerPage())) await loadDetail();
  });
</script>

<style lang="scss" scoped>
  .detail-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 250rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .hero-card,
  .section-card,
  .status-notice,
  .error-card {
    margin-bottom: 20rpx;
    border-radius: 18rpx;
    background: #fff;
  }

  .hero-card {
    padding: 34rpx 28rpx;
    color: #fff;
    background: #17191f;
  }

  .hero-label {
    color: rgba(255, 255, 255, 0.66);
    font-size: 24rpx;
  }

  .hero-amount {
    margin-top: 8rpx;
    font-size: 58rpx;
    line-height: 76rpx;
    font-weight: 800;
  }

  .hero-meta,
  .row,
  .error-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .hero-meta {
    gap: 20rpx;
    margin-top: 20rpx;
  }

  .status {
    flex-shrink: 0;
    padding: 7rpx 14rpx;
    border-radius: 999rpx;
    color: #ffd66b;
    background: rgba(255, 214, 107, 0.14);
    font-size: 21rpx;
  }

  .status.status-1,
  .status.status-2 {
    color: #79e4a8;
    background: rgba(76, 205, 132, 0.14);
  }

  .status.status-3 {
    color: #ff9ba2;
    background: rgba(255, 108, 118, 0.14);
  }

  .settlement-no {
    overflow: hidden;
    color: rgba(255, 255, 255, 0.62);
    font-size: 22rpx;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status-notice {
    padding: 24rpx;
    border-left: 7rpx solid #e7ad22;
  }

  .status-notice.notice-paid {
    border-left-color: #23a55a;
  }

  .status-notice.notice-rejected {
    border-left-color: #e60012;
    background: #fff7f7;
  }

  .notice-title,
  .section-title {
    color: #22262e;
    font-size: 28rpx;
    font-weight: 800;
  }

  .notice-content {
    margin-top: 9rpx;
    color: #707680;
    font-size: 24rpx;
    line-height: 38rpx;
  }

  .notice-rejected .notice-content {
    color: #c63843;
  }

  .section-card {
    padding: 26rpx;
  }

  .section-title {
    margin-bottom: 12rpx;
  }

  .row {
    gap: 24rpx;
    padding: 18rpx 0;
    border-top: 1rpx solid #eff1f4;
    color: #353a43;
    font-size: 24rpx;
    text-align: right;
  }

  .row text {
    flex-shrink: 0;
    color: #9499a2;
  }

  .fixed-explanation {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    padding: 22rpx 28rpx calc(22rpx + env(safe-area-inset-bottom));
    border-top: 1rpx solid #e9ebee;
    color: #858b94;
    background: #fff;
    font-size: 22rpx;
    line-height: 35rpx;
  }

  .error-card {
    padding: 24rpx;
    color: #7f8590;
    font-size: 24rpx;
  }

  .retry {
    color: #e60012;
  }
</style>
