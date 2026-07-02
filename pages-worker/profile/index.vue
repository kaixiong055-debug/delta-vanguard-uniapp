<template>
  <s-layout title="打手中心" :bgStyle="{ color: '#f4f6f8' }">
    <view class="worker-page">
      <view v-if="error" class="error-card">
        <text>{{ error }}</text>
        <text class="retry" @tap="loadProfilePage">重试</text>
      </view>

      <block v-if="pageReady">
        <view class="profile-card">
          <view class="avatar">
            <image v-if="avatarUrl" class="avatar-img" :src="avatarUrl" mode="aspectFill" />
            <text v-else>{{ avatarText }}</text>
          </view>
          <view class="profile-info">
            <view class="name">{{ displayName }}</view>
            <view class="meta">{{ deltaStore.statusInfo.title }}</view>
          </view>
        </view>

        <view class="menu-list">
          <view
            class="menu-item"
            @tap="loading ? undefined : sheep.$router.go(DeltaRoute.WORKER_PROFILE_EDIT)"
          >
            <text>编辑资料</text>
            <text class="arrow">></text>
          </view>
          <view
            class="menu-item"
            @tap="loading ? undefined : sheep.$router.go(DeltaRoute.WORKER_APPLY_STATUS)"
          >
            <text>认证状态</text>
            <text class="arrow">></text>
          </view>
          <view class="menu-item" @tap="exitToShop">
            <text>返回商城模式</text>
            <text class="arrow">></text>
          </view>
        </view>
      </block>
    </view>
    <worker-tabbar :active="DeltaRoute.WORKER_PROFILE" />
  </s-layout>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerTabbar from '../components/worker-tabbar.vue';
  import { DeltaRoute } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');

  const loading = ref(false);
  const error = ref('');
  const pageReady = ref(false);
  const exiting = ref(false);

  const identity = computed(() => deltaStore.identity || {});
  const profile = computed(() => deltaStore.profile || {});

  function normalizeImageUrl(value) {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return normalizeImageUrl(value[0]);
    }

    if (value && typeof value === 'object') {
      return String(value.url ?? '').trim();
    }

    return '';
  }

  const avatarUrl = computed(() => normalizeImageUrl(profile.value.avatar));

  const displayName = computed(() => {
    const value = profile.value.displayName || identity.value.displayName || '';

    return String(value).trim() || '打手中心';
  });

  const avatarText = computed(() => displayName.value.slice(0, 1) || '打');

  function exitToShop() {
    if (exiting.value) return;
    exiting.value = true;
    deltaStore.exitWorkerMode(DeltaRoute.SHOP_USER);
  }

  async function loadProfilePage() {
    if (loading.value) return;

    loading.value = true;
    error.value = '';
    pageReady.value = false;
    exiting.value = false;

    try {
      const allowed = await deltaStore.guardWorkerPage();

      if (!allowed) {
        return;
      }

      if (!deltaStore.profile || typeof deltaStore.profile !== 'object') {
        error.value = '打手资料加载失败';
        return;
      }

      pageReady.value = true;
    } catch (loadError) {
      error.value = loadError?.msg || loadError?.message || '打手资料加载失败';
    } finally {
      loading.value = false;
    }
  }

  onShow(loadProfilePage);
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

  .error-card {
    padding: 44rpx 30rpx;
    border-radius: 18rpx;
    background: #ffffff;
    text-align: center;
    color: #8c929d;
    font-size: 26rpx;
    line-height: 40rpx;
  }

  .retry {
    display: inline-block;
    margin-top: 18rpx;
    color: #e60012;
    font-weight: 800;
  }
</style>
