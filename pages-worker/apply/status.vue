<template>
  <s-layout title="申请状态" :bgStyle="{ color: '#f4f6f8' }">
    <view class="status-page">
      <view v-if="error" class="error-card">
        <text>{{ error }}</text>
        <text class="retry" @tap="refresh">重试</text>
      </view>

      <template v-if="pageReady">
        <view class="status-card">
          <view class="status-badge">{{ statusTitle }}</view>
          <view class="status-title">{{ mainTitle }}</view>
          <view class="status-desc">{{ statusDesc }}</view>
          <view v-if="rejectReason" class="reason-box">
            <view class="reason-label">驳回原因</view>
            <view class="reason-text">{{ rejectReason }}</view>
          </view>
        </view>

        <view class="action-list">
          <button
            v-if="showApplyButton"
            class="ss-reset-button submit-btn"
            :disabled="loading || actionLoading"
            @tap="goApply"
          >
            {{ isRejected ? '重新提交申请' : '提交申请' }}
          </button>
          <button
            v-if="showEnterButton"
            class="ss-reset-button submit-btn"
            :disabled="loading || actionLoading"
            @tap="enterWorker"
          >
            进入打手工作台
          </button>
          <button
            class="ss-reset-button ghost-btn"
            :disabled="loading || actionLoading"
            @tap="refresh"
          >
            刷新状态
          </button>
        </view>
      </template>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { DeltaAuditStatus, DeltaRoute, getWorkerStatusInfo } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');

  const loading = ref(false);
  const actionLoading = ref(false);
  const error = ref('');
  const pageReady = ref(false);

  const validAuditStatuses = Object.values(DeltaAuditStatus);

  function normalizeAuditStatus(value) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const status = Number(value);

    return validAuditStatuses.includes(status) ? status : null;
  }

  const identityStatus = computed(() => Number(deltaStore.identity?.auditStatus));
  const applicationStatus = computed(() =>
    Number(
      deltaStore.application?.applicationStatus ?? deltaStore.identity?.applicationStatus ?? 0,
    ),
  );
  const normalizedStatus = computed(() => {
    const identityVal = normalizeAuditStatus(deltaStore.identity?.auditStatus);

    if (
      identityVal === DeltaAuditStatus.APPROVED ||
      identityVal === DeltaAuditStatus.DISABLED ||
      identityVal === DeltaAuditStatus.BLACKLISTED
    ) {
      return identityVal;
    }

    return (
      normalizeAuditStatus(
        deltaStore.application?.applicationStatus ?? deltaStore.identity?.applicationStatus,
      ) ?? DeltaAuditStatus.NOT_APPLIED
    );
  });

  const statusInfo = computed(() => getWorkerStatusInfo({ auditStatus: normalizedStatus.value }));
  const statusTitle = computed(() => statusInfo.value.title);
  const rejectReason = computed(() =>
    String(deltaStore.application?.rejectReason || deltaStore.identity?.rejectReason || '').trim(),
  );
  const isRejected = computed(() => normalizedStatus.value === DeltaAuditStatus.REJECTED);
  const showApplyButton = computed(() =>
    [DeltaAuditStatus.NOT_APPLIED, DeltaAuditStatus.REJECTED].includes(normalizedStatus.value),
  );
  const showEnterButton = computed(() => normalizedStatus.value === DeltaAuditStatus.APPROVED);

  const mainTitle = computed(() => {
    if (normalizedStatus.value === DeltaAuditStatus.PENDING) {
      return '申请已提交';
    }
    return statusInfo.value.title;
  });

  const statusDesc = computed(() => {
    if (normalizedStatus.value === DeltaAuditStatus.PENDING) {
      return '平台正在审核，请耐心等待。';
    }
    if (normalizedStatus.value === DeltaAuditStatus.APPROVED) {
      return '审核已通过，进入前会再次校验打手身份。';
    }
    if (
      normalizedStatus.value === DeltaAuditStatus.DISABLED ||
      normalizedStatus.value === DeltaAuditStatus.BLACKLISTED
    ) {
      return rejectReason.value || statusInfo.value.desc;
    }
    return statusInfo.value.desc;
  });

  async function refresh() {
    if (loading.value) return false;

    loading.value = true;
    error.value = '';
    pageReady.value = false;

    try {
      const identityRes = await deltaStore.fetchWorkerIdentity({
        force: true,
        showError: false,
      });

      if (identityRes?.code !== 0) {
        error.value = identityRes?.msg || deltaStore.identityError || '身份查询失败，请稍后重试';
        return false;
      }

      const identityStatusVal = normalizeAuditStatus(identityRes?.data?.auditStatus);

      const identityAuthoritative = [
        DeltaAuditStatus.APPROVED,
        DeltaAuditStatus.DISABLED,
        DeltaAuditStatus.BLACKLISTED,
      ].includes(identityStatusVal);

      if (!identityAuthoritative) {
        const applicationRes = await deltaStore.fetchWorkerApplication({
          showError: false,
          showLoading: false,
        });

        if (applicationRes?.code !== 0) {
          error.value = applicationRes?.msg || '申请状态查询失败，请重试';
          return false;
        }
      }

      const status = normalizedStatus.value;

      if (!validAuditStatuses.includes(status)) {
        error.value = '申请状态异常，请刷新重试';
        return false;
      }

      pageReady.value = true;
      return true;
    } catch (loadError) {
      error.value = loadError?.msg || loadError?.message || '申请状态查询失败，请重试';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function goApply() {
    if (loading.value || actionLoading.value) {
      return;
    }

    actionLoading.value = true;

    try {
      const refreshed = await refresh();

      if (!refreshed) return;

      if (
        [DeltaAuditStatus.NOT_APPLIED, DeltaAuditStatus.REJECTED].includes(normalizedStatus.value)
      ) {
        sheep.$router.go(DeltaRoute.WORKER_APPLY);
        return;
      }

      sheep.$helper.toast('当前状态不能提交申请');
    } finally {
      actionLoading.value = false;
    }
  }

  async function enterWorker() {
    if (loading.value || actionLoading.value) {
      return;
    }

    actionLoading.value = true;

    try {
      const route = await deltaStore.enterWorkerMode();

      if (!route) {
        return;
      }
    } catch (enterError) {
      sheep.$helper.toast(enterError?.msg || enterError?.message || '进入打手工作台失败，请重试');
    } finally {
      actionLoading.value = false;
    }
  }

  onShow(refresh);
</script>

<style lang="scss" scoped>
  .status-page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .status-card {
    padding: 34rpx 28rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }

  .status-badge {
    display: inline-flex;
    padding: 8rpx 18rpx;
    border-radius: 999rpx;
    color: #e60012;
    background: #fff0f1;
    font-size: 23rpx;
    line-height: 32rpx;
  }

  .status-title {
    margin-top: 24rpx;
    color: #17191f;
    font-size: 38rpx;
    line-height: 52rpx;
    font-weight: 800;
  }

  .status-desc,
  .reason-text {
    margin-top: 14rpx;
    color: #7f8590;
    font-size: 26rpx;
    line-height: 40rpx;
  }

  .reason-box {
    margin-top: 24rpx;
    padding: 20rpx;
    border-radius: 14rpx;
    background: #f6f7f9;
  }

  .reason-label {
    color: #252932;
    font-size: 25rpx;
    line-height: 36rpx;
    font-weight: 800;
  }

  .action-list {
    margin-top: 30rpx;
  }

  .submit-btn,
  .ghost-btn {
    height: 82rpx;
    margin-bottom: 18rpx;
    border-radius: 999rpx;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }

  .submit-btn {
    background: #e60012;
    color: #ffffff;
  }

  .ghost-btn {
    background: #ffffff;
    color: #343842;
  }

  .submit-btn[disabled],
  .ghost-btn[disabled] {
    opacity: 0.6;
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
