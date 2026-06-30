<template>
  <s-layout title="打手中心" :bgStyle="{ color: '#f4f6f8' }">
    <view class="worker-page">
      <view class="profile-card">
        <view class="avatar">
          <image v-if="profile.avatar" class="avatar-img" :src="profile.avatar" mode="aspectFill" />
          <text v-else>{{ avatarText }}</text>
        </view>
        <view class="profile-info">
          <view class="name">{{ profile.displayName || identity.displayName || '打手中心' }}</view>
          <view class="meta">{{ deltaStore.statusInfo.title }}</view>
        </view>
      </view>

      <view class="menu-list">
        <view class="menu-item" @tap="sheep.$router.go(DeltaRoute.WORKER_PROFILE_EDIT)">
          <text>编辑资料</text>
          <text class="arrow">></text>
        </view>
        <view class="menu-item" @tap="sheep.$router.go(DeltaRoute.WORKER_APPLY_STATUS)">
          <text>认证状态</text>
          <text class="arrow">></text>
        </view>
        <view class="menu-item" @tap="exitToShop">
          <text>返回商城模式</text>
          <text class="arrow">></text>
        </view>
      </view>
    </view>
    <worker-tabbar :active="DeltaRoute.WORKER_PROFILE" />
  </s-layout>
</template>

<script setup>
  import { computed } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerTabbar from '../components/worker-tabbar.vue';
  import { DeltaAuditStatus, DeltaRoute } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const identity = computed(() => deltaStore.identity || {});
  const profile = computed(() => deltaStore.profile || {});
  const avatarText = computed(() =>
    (profile.value.displayName || identity.value.displayName || '打').slice(0, 1),
  );

  function exitToShop() {
    deltaStore.exitWorkerMode(DeltaRoute.SHOP_USER);
  }

  async function guardProfilePage() {
    const res = await deltaStore.fetchWorkerIdentity({ force: true, showError: false });
    if (res?.code !== 0) {
      return;
    }
    const status = Number(
      deltaStore.identity?.auditStatus ?? deltaStore.identity?.applicationStatus,
    );
    if (status === DeltaAuditStatus.DISABLED || status === DeltaAuditStatus.BLACKLISTED) {
      deltaStore.exitWorkerMode(DeltaRoute.SHOP_USER);
      return;
    }
    if (!deltaStore.canEnterWorker) {
      sheep.$router.redirect(deltaStore.resolveWorkerRoute());
      return;
    }
    await deltaStore.fetchWorkerProfile({ showError: false });
  }

  onShow(guardProfilePage);
</script>

<style lang="scss" scoped>
  .worker-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 0;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .profile-card {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }

  .avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    overflow: hidden;
    background: #e60012;
    color: #ffffff;
    font-size: 36rpx;
    line-height: 96rpx;
    text-align: center;
    font-weight: 800;
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .profile-info {
    flex: 1;
    min-width: 0;
    margin-left: 22rpx;
  }

  .name {
    color: #17191f;
    font-size: 34rpx;
    line-height: 46rpx;
    font-weight: 800;
  }

  .meta {
    margin-top: 8rpx;
    color: #8b919d;
    font-size: 24rpx;
    line-height: 34rpx;
  }

  .menu-list {
    margin-top: 22rpx;
    overflow: hidden;
    border-radius: 18rpx;
    background: #ffffff;
  }

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 96rpx;
    padding: 0 26rpx;
    border-bottom: 1rpx solid #f0f1f3;
    color: #2b2f38;
    font-size: 28rpx;
  }

  .menu-item:last-child {
    border-bottom: 0;
  }

  .arrow {
    color: #a5abb5;
  }
</style>
