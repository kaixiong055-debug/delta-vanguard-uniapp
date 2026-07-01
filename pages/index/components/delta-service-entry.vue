<template>
  <view class="service-center">
    <view class="header"
      ><view
        ><view class="title">服务中心</view><view class="desc">履约、售后与 Delta 消息</view></view
      ><view v-if="unreadCount" class="badge">{{
        unreadCount > 99 ? '99+' : unreadCount
      }}</view></view
    >
    <view class="grid"
      ><view v-for="item in entries" :key="item.url" class="entry" @tap="go(item.url)"
        ><view class="icon">{{ item.icon }}</view
        ><text>{{ item.title }}</text></view
      ></view
    >
  </view>
</template>
<script setup>
  import { ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import NotificationApi from '@/sheep/api/delta/notification';
  import { DeltaRoute } from '@/sheep/helper/delta';
  const unreadCount = ref(0);
  const entries = [
    { title: '服务订单', icon: '单', url: DeltaRoute.DELTA_SERVICE_ORDERS },
    { title: '取消申请', icon: '取', url: DeltaRoute.DELTA_CANCELS },
    { title: '售后', icon: '售', url: DeltaRoute.DELTA_AFTER_SALES },
    { title: '退款', icon: '退', url: DeltaRoute.DELTA_REFUNDS },
    { title: '消息', icon: '信', url: DeltaRoute.DELTA_NOTIFICATIONS },
  ];
  function go(url) {
    if (!sheep.$store('user').isLogin) {
      sheep.$helper.toast('请先登录');
      return;
    }
    sheep.$router.go(url);
  }
  async function loadUnread() {
    if (!sheep.$store('user').isLogin) {
      unreadCount.value = 0;
      return;
    }
    const res = await NotificationApi.getUnreadCount({ showError: false });
    if (res?.code === 0) unreadCount.value = Number(res.data || 0);
  }
  onShow(loadUnread);
</script>
<style lang="scss" scoped>
  .service-center {
    margin: 20rpx 24rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: #fff;
    box-shadow: 0 8rpx 24rpx rgba(17, 17, 17, 0.04);
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .title {
    color: #1d2129;
    font-size: 30rpx;
    font-weight: 800;
  }
  .desc {
    margin-top: 4rpx;
    color: #8a9099;
    font-size: 23rpx;
  }
  .badge {
    min-width: 38rpx;
    height: 38rpx;
    padding: 0 10rpx;
    border-radius: 999rpx;
    color: #fff;
    background: #e60012;
    font-size: 20rpx;
    line-height: 38rpx;
    text-align: center;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    margin-top: 22rpx;
  }
  .entry {
    text-align: center;
    color: #3c4048;
    font-size: 22rpx;
  }
  .icon {
    width: 58rpx;
    height: 58rpx;
    margin: 0 auto 8rpx;
    border-radius: 16rpx;
    color: #e60012;
    background: #fff0f1;
    line-height: 58rpx;
    font-weight: 800;
  }
</style>
