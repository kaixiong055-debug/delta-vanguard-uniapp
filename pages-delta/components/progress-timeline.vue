<template>
  <view class="timeline">
    <view v-for="item in list" :key="item.id || item.createTime" class="timeline-item">
      <view class="dot" />
      <view class="timeline-content">
        <view class="timeline-title">{{ item.title || item.statusName || '进度更新' }}</view>
        <view class="timeline-time">{{ item.createTime || item.time || '' }}</view>
        <view class="timeline-desc" v-if="item.content || item.remark">
          {{ item.content || item.remark }}
        </view>
      </view>
    </view>
    <view v-if="!list.length" class="timeline-empty">暂无进度</view>
  </view>
</template>

<script setup>
  defineProps({
    list: {
      type: Array,
      default: () => [],
    },
  });
</script>

<style lang="scss" scoped>
  .timeline {
    padding: 6rpx 0;
  }

  .timeline-item {
    display: flex;
    align-items: flex-start;
    padding-bottom: 26rpx;
  }

  .dot {
    width: 18rpx;
    height: 18rpx;
    margin-top: 10rpx;
    border-radius: 50%;
    background: #e60012;
    box-shadow: 0 0 0 8rpx #fff0f1;
    flex-shrink: 0;
  }

  .timeline-content {
    flex: 1;
    min-width: 0;
    margin-left: 22rpx;
  }

  .timeline-title {
    color: #17191f;
    font-size: 27rpx;
    line-height: 38rpx;
    font-weight: 800;
  }

  .timeline-time,
  .timeline-desc,
  .timeline-empty {
    color: #8d939e;
    font-size: 24rpx;
    line-height: 36rpx;
  }

  .timeline-desc {
    margin-top: 8rpx;
    color: #4a4f58;
  }

  .timeline-empty {
    padding: 28rpx 0;
    text-align: center;
  }
</style>
