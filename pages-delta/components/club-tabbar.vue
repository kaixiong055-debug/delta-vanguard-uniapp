<template>
  <view class="club-tabbar-shell">
    <view class="club-tabbar">
      <view
        v-for="item in items"
        :key="item.url"
        class="tabbar-item"
        :class="{ active: item.url === active }"
        @tap="switchPage(item)"
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
    { text: '俱乐部', icon: '俱', url: DeltaRoute.CLUB_HOME },
    { text: '市场', icon: '市', url: DeltaRoute.CLUB_MARKET, requireServiceScope: true },
    { text: '已接', icon: '接', url: DeltaRoute.CLUB_CLAIMED, requireServiceScope: false },
    { text: '消息', icon: '信', url: DeltaRoute.DELTA_NOTIFICATIONS },
    { text: '商城', icon: '商', url: DeltaRoute.SHOP_USER },
  ];

  async function switchPage(item) {
    if (item.url === props.active) return;
    const deltaStore = sheep.$store('delta');
    if (item.url === DeltaRoute.SHOP_USER) {
      deltaStore.exitClubMode(DeltaRoute.SHOP_USER);
      return;
    }
    if (item.url === DeltaRoute.CLUB_MARKET || item.url === DeltaRoute.CLUB_CLAIMED) {
      const allowed = await deltaStore.guardClubMarketPage({
        requireServiceScope: item.requireServiceScope,
      });
      if (!allowed) return;
    }
    sheep.$router.redirect(item.url);
  }
</script>

<style lang="scss" scoped>
  .club-tabbar-shell {
    height: calc(112rpx + constant(safe-area-inset-bottom));
    height: calc(112rpx + env(safe-area-inset-bottom));
  }
  .club-tabbar {
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
