<template>
  <view class="service-status">{{ text }}</view>
</template>

<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    status: {
      type: [String, Number],
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
  });

  const text = computed(() => props.text || String(props.status || '待处理'));
</script>

<style lang="scss" scoped>
  .service-status {
    display: inline-flex;
    align-items: center;
    min-height: 44rpx;
    padding: 0 16rpx;
    border-radius: 999rpx;
    color: #e60012;
    background: #fff0f1;
    font-size: 22rpx;
    line-height: 32rpx;
  }
</style>
