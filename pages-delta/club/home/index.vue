<template>
  <s-layout title="俱乐部中心" :bgStyle="{ color: '#f4f6f8' }">
    <view class="club-page">
      <view v-if="guardError" class="card notice-card">
        <view class="title">身份校验失败</view>
        <view class="muted">{{ guardError }}</view>
        <button class="ss-reset-button primary-btn" @tap="loadHome">重试</button>
      </view>

      <block v-else-if="ready">
        <view class="card hero">
          <image v-if="identity.logoUrl" class="logo" :src="identity.logoUrl" mode="aspectFill" />
          <view v-else class="logo fallback">俱</view>
          <view class="hero-info">
            <view class="title">{{ identity.clubName || '俱乐部' }}</view>
            <view class="muted">{{ identity.clubCode || '-' }}</view>
          </view>
          <view class="status">{{ identity.businessStatusName || businessStatusText }}</view>
        </view>

        <view v-if="!deltaStore.clubBusinessEnabled" class="warning">
          当前俱乐部已停用，暂不能进入订单市场
        </view>
        <view v-if="!deltaStore.hasEnabledClubServiceScope" class="warning">
          当前未配置可经营服务范围，请联系平台管理员
        </view>

        <view class="card detail-card">
          <view v-if="identity.description" class="description">{{ identity.description }}</view>
          <view class="row"
            ><text>平台抽成</text><text>{{ commissionRate }}</text></view
          >
          <view class="row"
            ><text>最大并发订单</text><text>{{ identity.maxConcurrentOrders ?? '-' }}</text></view
          >
        </view>

        <view class="card scope-card">
          <view class="section-title">服务范围</view>
          <view v-if="serviceScopes.length">
            <view v-for="scope in serviceScopes" :key="scope.serviceType" class="scope-row">
              <text>{{ scope.serviceTypeName || '未知服务' }}</text>
              <text :class="{ enabled: isScopeEnabled(scope) }">
                {{ isScopeEnabled(scope) ? '启用' : '停用' }}
              </text>
            </view>
          </view>
          <view v-else class="muted">暂无服务范围</view>
        </view>

        <view class="entry-grid">
          <view class="entry-card" @tap="goMarket(true)">
            <view class="entry-icon">市</view><view class="entry-title">可抢挂牌</view>
          </view>
          <view class="entry-card" @tap="goMarket(false)">
            <view class="entry-icon">接</view><view class="entry-title">我的已接挂牌</view>
          </view>
          <view class="entry-card" @tap="goNotification">
            <view class="entry-icon-wrap">
              <view class="entry-icon">信</view>
              <view v-if="notificationBadgeText" class="entry-badge">
                {{ notificationBadgeText }}
              </view>
            </view>
            <view class="entry-title">消息通知</view>
          </view>
          <view class="entry-card" @tap="exitToShop">
            <view class="entry-icon">商</view><view class="entry-title">返回商城模式</view>
          </view>
        </view>
      </block>
    </view>
    <club-tabbar :active="DeltaRoute.CLUB_HOME" />
  </s-layout>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import NotificationApi from '@/sheep/api/delta/notification';
  import ClubTabbar from '../../components/club-tabbar.vue';
  import {
    DeltaRoute,
    formatCommissionRate,
    getClubBusinessStatusText,
  } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const ready = ref(false);
  const guardError = ref('');
  const notificationUnreadCount = ref(0);
  const identity = computed(() => deltaStore.clubIdentity || {});
  const serviceScopes = computed(() =>
    Array.isArray(identity.value.serviceScopes) ? identity.value.serviceScopes : [],
  );
  const commissionRate = computed(() =>
    formatCommissionRate(identity.value.platformCommissionRate),
  );
  const businessStatusText = computed(() =>
    getClubBusinessStatusText(identity.value.businessStatus),
  );
  const notificationBadgeText = computed(() => {
    const count = Number(notificationUnreadCount.value || 0);
    if (count <= 0) return '';
    return count > 99 ? '99+' : String(count);
  });

  function isScopeEnabled(scope) {
    return scope.enabled === true || Number(scope.enabled) === 1;
  }

  async function loadNotificationUnreadCount() {
    try {
      const res = await NotificationApi.getUnreadCount({
        showError: false,
        showLoading: false,
      });
      notificationUnreadCount.value = res?.code === 0 ? Number(res.data || 0) : 0;
    } catch {
      notificationUnreadCount.value = 0;
    }
  }

  async function loadHome() {
    ready.value = false;
    guardError.value = '';
    const allowed = await deltaStore.guardClubOwnerPage();
    if (!allowed) {
      guardError.value = deltaStore.clubIdentityError;
      uni.stopPullDownRefresh();
      return;
    }
    ready.value = true;
    await loadNotificationUnreadCount();
    uni.stopPullDownRefresh();
  }

  async function goMarket(requireServiceScope) {
    const allowed = await deltaStore.guardClubMarketPage({ requireServiceScope });
    if (!allowed) return;
    sheep.$router.go(requireServiceScope ? DeltaRoute.CLUB_MARKET : DeltaRoute.CLUB_CLAIMED);
  }
  function goNotification() {
    sheep.$router.go(DeltaRoute.DELTA_NOTIFICATIONS);
  }
  function exitToShop() {
    deltaStore.exitClubMode(DeltaRoute.SHOP_USER);
  }

  onShow(loadHome);
  onPullDownRefresh(loadHome);
</script>

<style lang="scss" scoped>
  .club-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 0;
    box-sizing: border-box;
    background: #f4f6f8;
  }
  .card,
  .entry-card {
    border-radius: 18rpx;
    background: #ffffff;
  }
  .card {
    margin-bottom: 20rpx;
    padding: 26rpx;
  }
  .hero {
    display: flex;
    align-items: center;
  }
  .logo {
    width: 92rpx;
    height: 92rpx;
    flex-shrink: 0;
    border-radius: 20rpx;
  }
  .fallback {
    color: #ffffff;
    background: #e60012;
    font-size: 34rpx;
    line-height: 92rpx;
    text-align: center;
    font-weight: 800;
  }
  .hero-info {
    flex: 1;
    min-width: 0;
    margin-left: 20rpx;
  }
  .title,
  .section-title {
    color: #17191f;
    font-size: 32rpx;
    font-weight: 800;
  }
  .muted {
    margin-top: 8rpx;
    color: #8c929d;
    font-size: 24rpx;
    line-height: 36rpx;
  }
  .status {
    padding: 7rpx 16rpx;
    border-radius: 999rpx;
    color: #e60012;
    background: #fff0f1;
    font-size: 23rpx;
  }
  .warning {
    margin-bottom: 20rpx;
    padding: 20rpx 24rpx;
    border-radius: 14rpx;
    color: #e60012;
    background: #fff0f1;
    font-size: 24rpx;
    line-height: 36rpx;
  }
  .description {
    margin-bottom: 14rpx;
    color: #50555f;
    font-size: 25rpx;
    line-height: 40rpx;
  }
  .row,
  .scope-row {
    display: flex;
    justify-content: space-between;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f0f1f3;
    color: #50555f;
    font-size: 25rpx;
  }
  .row text:first-child,
  .scope-row text:last-child {
    color: #8c929d;
  }
  .scope-row .enabled {
    color: #23a55a;
  }
  .section-title {
    margin-bottom: 8rpx;
    font-size: 28rpx;
  }
  .entry-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18rpx;
  }
  .entry-card {
    padding: 26rpx;
  }
  .entry-icon-wrap {
    position: relative;
    width: 58rpx;
    height: 58rpx;
  }
  .entry-icon {
    width: 58rpx;
    height: 58rpx;
    border-radius: 16rpx;
    color: #ffffff;
    background: #e60012;
    font-size: 24rpx;
    line-height: 58rpx;
    text-align: center;
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
  .entry-title {
    margin-top: 16rpx;
    color: #17191f;
    font-size: 27rpx;
    font-weight: 800;
  }
  .primary-btn {
    width: 100%;
    height: 76rpx;
    margin-top: 22rpx;
    border-radius: 999rpx;
    color: #ffffff;
    background: #e60012;
    line-height: 76rpx;
  }
</style>
