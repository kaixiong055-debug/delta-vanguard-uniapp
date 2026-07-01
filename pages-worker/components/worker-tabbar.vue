<template>
  <view class="worker-tabbar-shell">
    <view class="worker-tabbar">
      <view
        v-for="item in items"
        :key="item.url"
        class="tabbar-item"
        :class="{ active: item.url === active }"
        @tap="switchPage(item.url)"
      >
        <view class="tabbar-icon">{{ item.icon }}</view>
        <view class="tabbar-text">{{ item.text }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import sheep from '@/sheep';
  import { DeltaRoute } from '@/sheep/helper/delta';

  const props = defineProps({
    active: {
      type: String,
      default: '',
    },
  });

  const items = [
    { text: '工作台', icon: '台', url: DeltaRoute.WORKER_HOME },
    { text: '大厅', icon: '抢', url: DeltaRoute.WORKER_POOL },
    { text: '任务', icon: '单', url: DeltaRoute.WORKER_ORDERS },
    { text: '收入', icon: '收', url: DeltaRoute.WORKER_INCOME },
    { text: '我的', icon: '我', url: DeltaRoute.WORKER_PROFILE },
  ];

  function switchPage(url) {
    if (url === props.active) {
      return;
    }
    if (url === DeltaRoute.SHOP_USER) {
      sheep.$store('delta').exitWorkerMode(url);
      return;
    }
    sheep.$router.redirect(url);
  }
</script>

<style lang="scss" scoped>
  .worker-tabbar-shell {
    height: calc(112rpx + constant(safe-area-inset-bottom));
    height: calc(112rpx + env(safe-area-inset-bottom));
  }

  .worker-tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    display: flex;
    min-height: 112rpx;
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
    background: #ffffff;
    border-top: 1rpx solid #eceef2;
    box-shadow: 0 -8rpx 24rpx rgba(15, 23, 42, 0.06);
  }

  .tabbar-item {
    flex: 1;
    min-width: 0;
    height: 112rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #7b8190;
  }

  .tabbar-item.active {
    color: #e60012;
  }

  .tabbar-icon {
    width: 42rpx;
    height: 42rpx;
    border-radius: 12rpx;
    background: #f2f3f5;
    font-size: 22rpx;
    line-height: 42rpx;
    text-align: center;
    font-weight: 800;
  }

  .tabbar-item.active .tabbar-icon {
    color: #ffffff;
    background: #e60012;
  }

  .tabbar-text {
    margin-top: 8rpx;
    font-size: 22rpx;
    line-height: 30rpx;
  }
</style>
