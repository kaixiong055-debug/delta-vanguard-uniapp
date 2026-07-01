<template>
  <view class="market-card" @tap="$emit('tap', item)">
    <view class="card-head">
      <view>
        <view class="card-title">{{ item.serviceTypeName || '服务挂牌' }}</view>
        <view class="listing-no">{{ item.listingNo || '-' }}</view>
      </view>
      <view class="status">{{ item.listingStatusName || '-' }}</view>
    </view>
    <view class="amount">{{ formatDeltaAmount(item.serviceAmount) }}</view>
    <view class="summary">{{ item.requirementSummary || '暂无需求摘要' }}</view>
    <view class="time-row"
      ><text>发布时间</text><text>{{ formatDeltaTime(item.publishTime) }}</text></view
    >
    <view class="time-row"
      ><text>截止时间</text><text>{{ formatDeltaTime(item.expireTime) }}</text></view
    >
    <view v-if="item.claimTime" class="time-row">
      <text>接单时间</text><text>{{ formatDeltaTime(item.claimTime) }}</text>
    </view>
    <slot name="action" />
  </view>
</template>

<script setup>
  import { formatDeltaAmount, formatDeltaTime } from '@/sheep/helper/delta';

  defineProps({
    item: {
      type: Object,
      default: () => ({}),
    },
  });
  defineEmits(['tap']);
</script>

<style lang="scss" scoped>
  .market-card {
    margin-bottom: 20rpx;
    padding: 26rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }
  .card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  .card-title {
    color: #17191f;
    font-size: 30rpx;
    font-weight: 800;
  }
  .listing-no {
    margin-top: 6rpx;
    color: #9a9fa8;
    font-size: 22rpx;
  }
  .status {
    padding: 6rpx 14rpx;
    border-radius: 999rpx;
    color: #e60012;
    background: #fff0f1;
    font-size: 22rpx;
  }
  .amount {
    margin-top: 20rpx;
    color: #e60012;
    font-size: 34rpx;
    font-weight: 800;
  }
  .summary {
    margin: 16rpx 0;
    padding: 18rpx;
    border-radius: 12rpx;
    color: #50555f;
    background: #f6f7f9;
    font-size: 25rpx;
    line-height: 38rpx;
  }
  .time-row {
    display: flex;
    justify-content: space-between;
    margin-top: 10rpx;
    color: #8c929d;
    font-size: 23rpx;
    line-height: 34rpx;
  }
</style>
