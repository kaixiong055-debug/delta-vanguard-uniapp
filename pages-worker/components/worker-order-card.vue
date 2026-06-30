<template>
  <view class="worker-order-card" @tap="handleTap">
    <view class="card-head">
      <view class="order-title ss-line-1">{{ title }}</view>
      <view class="order-status">{{ statusText }}</view>
    </view>
    <view class="order-meta" v-if="order.orderNo || order.serviceNo">
      {{ order.orderNo || order.serviceNo }}
    </view>
    <view class="order-row" v-if="order.serverName || order.gameServer">
      <text class="label">区服</text>
      <text class="value">{{ order.serverName || order.gameServer }}</text>
    </view>
    <view class="order-row" v-if="order.requirement || order.remark">
      <text class="label">需求</text>
      <text class="value ss-line-2">{{ order.requirement || order.remark }}</text>
    </view>
    <view class="card-foot">
      <view class="time-text">{{ order.createTime || order.startTime || '' }}</view>
      <slot name="action" />
    </view>
  </view>
</template>

<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    order: {
      type: Object,
      default: () => ({}),
    },
  });

  const emits = defineEmits(['tap']);

  const title = computed(
    () => props.order.title || props.order.serviceName || props.order.goodsName || '服务任务',
  );
  const statusText = computed(() => props.order.statusText || props.order.statusName || '待处理');

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
</style>
