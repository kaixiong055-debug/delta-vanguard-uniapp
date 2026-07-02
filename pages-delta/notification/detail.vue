<template>
  <s-layout title="通知详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <view v-if="detail.id" class="card">
        <view class="title">{{ detail.title || '站内通知' }}</view>
        <view class="meta">
          {{ getDeltaNotificationTypeText(detail.notificationType) }} ·
          {{ formatDeltaTime(detail.createTime) }}
        </view>
        <view class="content">{{ detail.content || '-' }}</view>
        <view v-if="detail.bizType" class="biz">
          <text>关联业务</text>
          <text>{{ detail.bizType }}{{ detail.bizId ? ' #' + detail.bizId : '' }}</text>
        </view>
        <button
          v-if="businessTarget"
          class="ss-reset-button business-btn"
          :disabled="openingBusiness"
          @tap="openBusiness"
        >
          {{ openingBusiness ? '正在打开' : businessTarget.actionText }}
        </button>
      </view>

      <view v-if="error" class="error-card">
        <text>{{ error }}</text>
        <text class="retry" @tap="load">重试</text>
      </view>

      <s-empty v-if="!loading && !error && !detail.id" text="暂无通知详情" />
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import NotificationApi from '@/sheep/api/delta/notification';
  import { formatDeltaTime } from '@/sheep/helper/delta';
  import {
    getDeltaNotificationTypeText,
    resolveDeltaNotificationTarget,
  } from '@/sheep/helper/deltaNotification';

  const deltaStore = sheep.$store('delta');
  const id = ref('');
  const detail = ref({});
  const loading = ref(false);
  const openingBusiness = ref(false);
  const error = ref('');

  const businessTarget = computed(() =>
    resolveDeltaNotificationTarget(detail.value, deltaStore.currentMode),
  );

  async function markReadQuietly(notification) {
    if (!notification?.id || notification.readStatus === true) return;
    try {
      const res = await NotificationApi.markRead(notification.id, {
        showError: false,
        showLoading: false,
      });
      if (res?.code === 0) notification.readStatus = true;
    } catch {
      // 通知详情仍可正常查看，返回列表时会重新同步已读状态。
    }
  }

  async function load() {
    if (!id.value || loading.value) return;
    loading.value = true;
    error.value = '';

    try {
      const res = await NotificationApi.getDetail(id.value, {
        showError: false,
        showLoading: false,
      });
      if (res?.code !== 0) throw new Error(res?.msg || '通知详情加载失败');
      detail.value = res.data || {};
      await markReadQuietly(detail.value);
    } catch (loadError) {
      error.value = loadError?.msg || loadError?.message || '通知详情加载失败';
    } finally {
      loading.value = false;
    }
  }

  async function guardTarget(target) {
    if (target.guard === 'worker') return deltaStore.guardWorkerPage();
    if (target.guard === 'club') {
      return deltaStore.guardClubMarketPage({ requireServiceScope: false });
    }
    return true;
  }

  async function openBusiness() {
    const target = businessTarget.value;
    if (!target || openingBusiness.value) return;
    openingBusiness.value = true;

    try {
      const allowed = await guardTarget(target);
      if (!allowed) return;
      sheep.$router.go(target.url, target.params || {});
    } catch (openError) {
      sheep.$helper.toast(openError?.msg || openError?.message || '相关业务暂时无法打开');
    } finally {
      openingBusiness.value = false;
    }
  }

  onLoad((options = {}) => {
    id.value = options.id || '';
    if (!id.value) error.value = '通知 ID 不存在';
  });

  onShow(() => {
    if (id.value) load();
  });
</script>

<style lang="scss" scoped>
  .page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .card,
  .error-card {
    padding: 28rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }

  .title {
    color: #252932;
    font-size: 32rpx;
    font-weight: 800;
  }

  .meta {
    margin-top: 10rpx;
    color: #999999;
    font-size: 22rpx;
  }

  .content {
    margin-top: 24rpx;
    color: #333840;
    font-size: 26rpx;
    line-height: 42rpx;
    white-space: pre-wrap;
  }

  .biz {
    display: flex;
    justify-content: space-between;
    margin-top: 28rpx;
    padding-top: 18rpx;
    border-top: 1rpx solid #eeeeee;
    color: #999999;
    font-size: 22rpx;
  }

  .business-btn {
    width: 100%;
    height: 76rpx;
    margin-top: 28rpx;
    border-radius: 999rpx;
    color: #ffffff;
    background: #e60012;
    line-height: 76rpx;
  }

  .business-btn[disabled] {
    opacity: 0.65;
  }

  .error-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #777d87;
    font-size: 24rpx;
  }

  .retry {
    color: #e60012;
  }
</style>
