<template>
  <view class="worker-order-card" @tap="handleTap">
    <view class="card-head">
      <view class="order-title ss-line-1">{{ order.productName || '服务任务' }}</view>
      <view class="order-status">{{
        order.statusName || getServiceOrderStatusText(order.status)
      }}</view>
    </view>
    <view class="order-meta">服务单：{{ order.serviceOrderNo || '-' }}</view>
    <view class="order-row">
      <text class="label">类型</text>
      <text class="value"
        >{{ order.serviceTypeName || getServiceTypeText(order.serviceType) }} ·
        {{ order.deviceTypeName || getDeviceTypeText(order.deviceType) }}</text
      >
    </view>
    <view class="order-row" v-if="order.skuName">
      <text class="label">规格</text>
      <text class="value ss-line-2">{{ order.skuName }}</text>
    </view>
    <view class="card-foot">
      <view>
        <view class="amount-text">{{ formatDeltaAmount(order.serviceAmount) }}</view>
        <view class="time-text">{{ formatDeltaTime(order.createTime) }}</view>
      </view>
      <slot name="action" />
    </view>
  </view>
</template>

<script setup>
  import {
    formatDeltaAmount,
    formatDeltaTime,
    getDeviceTypeText,
    getServiceOrderStatusText,
    getServiceTypeText,
  } from '@/sheep/helper/delta';

  const props = defineProps({
    order: {
      type: Object,
      default: () => ({}),
    },
  });

  const emits = defineEmits(['tap']);

  function handleTap() {
    emits('tap', props.order);
  }
</script>

<style lang="scss" scoped>
  .worker-order-card {
    margin-bottom: 18rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: #ffffff;
    box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.04);
  }

  .card-head,
  .card-foot,
  .order-row {
    display: flex;
    align-items: center;
  }

  .order-title {
    flex: 1;
    min-width: 0;
    color: #16181d;
    font-size: 30rpx;
    line-height: 42rpx;
    font-weight: 800;
  }

  .order-status {
    margin-left: 18rpx;
    padding: 6rpx 14rpx;
    border-radius: 999rpx;
    color: #e60012;
    background: #fff0f1;
    font-size: 22rpx;
    line-height: 30rpx;
  }

  .order-meta {
    margin-top: 8rpx;
    color: #9aa0aa;
    font-size: 22rpx;
    line-height: 32rpx;
  }

  .order-row {
    margin-top: 16rpx;
    align-items: flex-start;
  }

  .label {
    width: 80rpx;
    flex-shrink: 0;
    color: #8b9099;
    font-size: 24rpx;
    line-height: 36rpx;
  }

  .value {
    flex: 1;
    min-width: 0;
    color: #3b3f47;
    font-size: 24rpx;
    line-height: 36rpx;
  }

  .card-foot {
    justify-content: space-between;
    margin-top: 18rpx;
  }

  .time-text {
    color: #a7adb7;
    font-size: 22rpx;
    line-height: 32rpx;
  }

  .amount-text {
    color: #e60012;
    font-size: 28rpx;
    font-weight: 800;
  }
</style>
