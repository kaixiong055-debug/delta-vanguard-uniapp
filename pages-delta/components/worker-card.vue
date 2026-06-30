<template>
  <view class="worker-card" @tap="emits('select', worker)">
    <view class="avatar">
      <image v-if="worker.avatar" class="avatar-img" :src="worker.avatar" mode="aspectFill" />
      <text v-else>{{ firstName }}</text>
    </view>
    <view class="worker-info">
      <view class="worker-name">{{ worker.nickname || worker.name || '未命名打手' }}</view>
      <view class="worker-meta">
        {{ worker.levelName || worker.roleName || '打手' }}
      </view>
    </view>
    <view class="worker-status">{{ worker.online ? '在线' : '离线' }}</view>
  </view>
</template>

<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    worker: {
      type: Object,
      default: () => ({}),
    },
  });

  const emits = defineEmits(['select']);
  const firstName = computed(() =>
    (props.worker.nickname || props.worker.name || '打').slice(0, 1),
  );
</script>

<style lang="scss" scoped>
  .worker-card {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    padding: 22rpx;
    border-radius: 16rpx;
    background: #ffffff;
  }

  .avatar {
    width: 76rpx;
    height: 76rpx;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: #f3f4f6;
    color: #e60012;
    font-size: 30rpx;
    line-height: 76rpx;
    text-align: center;
    font-weight: 800;
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .worker-info {
    flex: 1;
    min-width: 0;
    margin-left: 18rpx;
  }

  .worker-name {
    color: #17191f;
    font-size: 28rpx;
    line-height: 40rpx;
    font-weight: 800;
  }

  .worker-meta {
    margin-top: 4rpx;
    color: #8e949f;
    font-size: 23rpx;
    line-height: 34rpx;
  }

  .worker-status {
    padding: 6rpx 14rpx;
    border-radius: 999rpx;
    color: #159947;
    background: #eefaf1;
    font-size: 22rpx;
    line-height: 30rpx;
  }
</style>
