<template>
  <s-layout title="服务订单详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <view v-if="detail.id" class="card">
        <view class="head"
          ><view class="title">{{ detail.productName || '服务订单' }}</view
          ><service-status :status="detail.status"
        /></view>
        <image
          v-if="detail.productPicUrl"
          class="product-image"
          :src="detail.productPicUrl"
          mode="aspectFill"
        />
        <view v-for="row in detailRows" :key="row.label" class="row"
          ><text>{{ row.label }}</text
          ><view>{{ row.value }}</view></view
        >
      </view>
      <view v-if="error" class="error">{{ error }}<text @tap="refresh">重试</text></view>
      <s-empty v-if="!loading && !error && !detail.id" text="暂无服务订单详情" />

      <view v-if="detail.id" class="action-grid">
        <button class="ss-reset-button ghost" @tap="go('/pages-delta/service-order/progress')"
          >履约进度</button
        >
        <button class="ss-reset-button ghost" @tap="go('/pages-delta/service-order/evidence')"
          >服务凭证</button
        >
        <button
          v-if="canAccept"
          class="ss-reset-button primary"
          @tap="go('/pages-delta/service-order/accept')"
          >验收通过</button
        >
        <button
          v-if="canAccept"
          class="ss-reset-button warning"
          @tap="go('/pages-delta/service-order/rework')"
          >要求返工</button
        >
        <button
          v-if="canCancel"
          class="ss-reset-button warning"
          @tap="go('/pages-delta/cancel/apply')"
          >申请取消</button
        >
        <button
          v-if="canAfterSale"
          class="ss-reset-button primary"
          @tap="go('/pages-delta/after-sale/apply')"
          >申请售后</button
        >
      </view>

      <view v-if="timeline.length" class="card section"
        ><view class="section-title">履约时间线</view><progress-timeline :list="timeline"
      /></view>
      <view v-if="acceptances.length || reworks.length" class="card section"
        ><view class="section-title">验收与返工记录</view
        ><view v-for="item in acceptances" :key="`a-${item.id}`" class="record"
          ><view>{{ item.acceptanceResultName || '验收记录' }}</view
          ><text>{{ item.remark || '-' }} · {{ formatDeltaTime(item.createTime) }}</text></view
        ><view v-for="item in reworks" :key="`r-${item.id}`" class="record"
          ><view>第 {{ item.reworkNo }} 次返工</view
          ><text>{{ item.reason }} · {{ formatDeltaTime(item.createTime) }}</text></view
        ></view
      >
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import ProgressTimeline from '../components/progress-timeline.vue';
  import ServiceStatus from '../components/service-status.vue';
  import {
    acceptableStatuses,
    afterSaleStatuses,
    cancelableStatuses,
    formatDeltaAmount,
    formatDeltaTime,
    getDeviceTypeText,
    getServiceTypeText,
  } from '@/sheep/helper/delta';

  const id = ref('');
  const detail = ref({});
  const timeline = ref([]);
  const acceptances = ref([]);
  const reworks = ref([]);
  const loading = ref(false);
  const error = ref('');
  const canAccept = computed(() => acceptableStatuses.includes(Number(detail.value.status)));
  const canCancel = computed(() => cancelableStatuses.includes(Number(detail.value.status)));
  const canAfterSale = computed(() => afterSaleStatuses.includes(Number(detail.value.status)));
  const detailRows = computed(() => [
    { label: '服务单号', value: detail.value.serviceOrderNo || '-' },
    { label: '商城订单', value: detail.value.tradeOrderNo || '-' },
    { label: 'SKU 规格', value: detail.value.skuName || '-' },
    { label: '服务类型', value: getServiceTypeText(detail.value.serviceType) },
    { label: '设备类型', value: getDeviceTypeText(detail.value.deviceType) },
    { label: '购买数量', value: detail.value.count ?? '-' },
    { label: '服务金额', value: formatDeltaAmount(detail.value.serviceAmount) },
    { label: '创建时间', value: formatDeltaTime(detail.value.createTime) },
    { label: '更新时间', value: formatDeltaTime(detail.value.updateTime) },
  ]);
  async function refresh() {
    loading.value = true;
    error.value = '';
    const [detailRes, timelineRes, acceptanceRes, reworkRes] = await Promise.all([
      ServiceOrderApi.getDetail(id.value, { showError: false }),
      ServiceOrderApi.getTimeline(id.value, { showError: false }),
      ServiceOrderApi.getAcceptanceList(id.value, { showError: false }),
      ServiceOrderApi.getReworkList(id.value, { showError: false }),
    ]);
    if (detailRes?.code === 0) detail.value = detailRes.data || {};
    else error.value = detailRes?.msg || '详情加载失败';
    if (timelineRes?.code === 0) timeline.value = timelineRes.data || [];
    if (acceptanceRes?.code === 0) acceptances.value = acceptanceRes.data || [];
    if (reworkRes?.code === 0) reworks.value = reworkRes.data || [];
    loading.value = false;
  }
  function go(url) {
    sheep.$router.go(url, { id: id.value });
  }
  onLoad((options = {}) => {
    id.value = options.id || '';
  });
  onShow(() => {
    if (id.value) refresh();
  });
</script>

<style lang="scss" scoped>
  .page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }
  .card {
    padding: 28rpx;
    border-radius: 18rpx;
    background: #fff;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
  }
  .title {
    flex: 1;
    margin-right: 16rpx;
    font-size: 32rpx;
    font-weight: 800;
  }
  .product-image {
    width: 100%;
    height: 260rpx;
    margin-bottom: 16rpx;
    border-radius: 14rpx;
  }
  .row {
    display: flex;
    justify-content: space-between;
    padding: 15rpx 0;
    border-top: 1rpx solid #eee;
    color: #333;
    font-size: 24rpx;
  }
  .row text {
    color: #999;
  }
  .row view {
    max-width: 70%;
    text-align: right;
  }
  .action-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
    margin-top: 22rpx;
  }
  .action-grid button {
    height: 76rpx;
    border-radius: 999rpx;
    font-size: 25rpx;
    line-height: 76rpx;
  }
  .ghost {
    color: #333;
    background: #fff;
  }
  .primary {
    color: #fff;
    background: #e60012;
  }
  .warning {
    color: #e60012;
    background: #fff0f1;
  }
  .section {
    margin-top: 22rpx;
  }
  .section-title {
    margin-bottom: 16rpx;
    font-size: 28rpx;
    font-weight: 800;
  }
  .record {
    padding: 14rpx 0;
    border-top: 1rpx solid #eee;
    color: #333;
    font-size: 24rpx;
  }
  .record text {
    color: #999;
    font-size: 22rpx;
  }
  .error {
    margin-bottom: 18rpx;
    padding: 22rpx;
    border-radius: 14rpx;
    background: #fff;
    color: #999;
  }
  .error text {
    float: right;
    color: #e60012;
  }
</style>
