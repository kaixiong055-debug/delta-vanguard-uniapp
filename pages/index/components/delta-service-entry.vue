<template>
  <view class="service-center">
    <view class="header">
      <view>
        <view class="title">服务中心</view>
        <view class="desc">履约、验收、售后与 Delta 消息</view>
      </view>
    </view>

    <view class="grid">
      <view v-for="item in entries" :key="item.key" class="entry" @tap="go(item)">
        <view class="icon-wrap">
          <view class="icon">{{ item.icon }}</view>
          <view v-if="item.badge" class="entry-badge">
            {{ item.badge > 99 ? '99+' : item.badge }}
          </view>
        </view>
        <text>{{ item.title }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
  import { computed, reactive } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import NotificationApi from '@/sheep/api/delta/notification';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import { DeltaRoute, ServiceOrderStatus } from '@/sheep/helper/delta';

  const summary = reactive({
    pendingAcceptance: 0,
    unreadNotifications: 0,
  });

  const entries = computed(() => [
    {
      key: 'orders',
      title: '服务订单',
      icon: '单',
      url: DeltaRoute.DELTA_SERVICE_ORDERS,
      badge: 0,
    },
    {
      key: 'acceptance',
      title: '待验收',
      icon: '验',
      url: DeltaRoute.DELTA_SERVICE_ORDERS,
      params: { status: ServiceOrderStatus.WORKER_SUBMITTED },
      badge: summary.pendingAcceptance,
    },
    {
      key: 'cancel',
      title: '取消申请',
      icon: '取',
      url: DeltaRoute.DELTA_CANCELS,
      badge: 0,
    },
    {
      key: 'after-sale',
      title: '售后',
      icon: '售',
      url: DeltaRoute.DELTA_AFTER_SALES,
      badge: 0,
    },
    {
      key: 'refund',
      title: '退款',
      icon: '退',
      url: DeltaRoute.DELTA_REFUNDS,
      badge: 0,
    },
    {
      key: 'notification',
      title: '消息',
      icon: '信',
      url: DeltaRoute.DELTA_NOTIFICATIONS,
      badge: summary.unreadNotifications,
    },
  ]);

  function go(item) {
    if (!sheep.$store('user').isLogin) {
      sheep.$helper.toast('请先登录');
      return;
    }
    sheep.$router.go(item.url, item.params || {});
  }

  async function loadSummary() {
    if (!sheep.$store('user').isLogin) {
      summary.pendingAcceptance = 0;
      summary.unreadNotifications = 0;
      return;
    }

    const [orderRes, notificationRes] = await Promise.all([
      ServiceOrderApi.getPage(
        {
          pageNo: 1,
          pageSize: 1,
          status: ServiceOrderStatus.WORKER_SUBMITTED,
        },
        { showError: false, showLoading: false },
      ).catch(() => null),
      NotificationApi.getUnreadCount({
        showError: false,
        showLoading: false,
      }).catch(() => null),
    ]);

    summary.pendingAcceptance =
      orderRes?.code === 0 ? Number(orderRes.data?.total || 0) : 0;
    summary.unreadNotifications =
      notificationRes?.code === 0 ? Number(notificationRes.data || 0) : 0;
  }

  onShow(loadSummary);
</script>

<style lang="scss" scoped>
  .service-center {
    margin: 20rpx 24rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: #ffffff;
    box-shadow: 0 8rpx 24rpx rgba(17, 17, 17, 0.04);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 24rpx;
    margin-top: 22rpx;
  }

  .entry {
    color: #3c4048;
    font-size: 22rpx;
    text-align: center;
  }

  .icon-wrap {
    position: relative;
    width: 58rpx;
    height: 58rpx;
    margin: 0 auto 8rpx;
  }

  .icon {
    width: 58rpx;
    height: 58rpx;
    border-radius: 16rpx;
    color: #e60012;
    background: #fff0f1;
    line-height: 58rpx;
    font-weight: 800;
  }

  .entry-badge {
    position: absolute;
    top: -12rpx;
    right: -20rpx;
    min-width: 32rpx;
    height: 32rpx;
    padding: 0 7rpx;
    border: 3rpx solid #ffffff;
    border-radius: 999rpx;
    color: #ffffff;
    background: #e60012;
    box-sizing: border-box;
    font-size: 18rpx;
    line-height: 26rpx;
    text-align: center;
  }
</style>
