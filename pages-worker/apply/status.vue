<template>
  <s-layout title="申请状态" :bgStyle="{ color: '#f4f6f8' }">
    <view class="status-page">
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
        <button v-if="showApplyButton" class="ss-reset-button submit-btn" @tap="goApply">
          {{ isRejected ? '重新提交申请' : '提交申请' }}
        </button>
        <button v-if="showEnterButton" class="ss-reset-button submit-btn" @tap="enterWorker">
          进入打手工作台
        </button>
        <button class="ss-reset-button ghost-btn" @tap="refresh">刷新状态</button>
      </view>
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

  const identityStatus = computed(() => Number(deltaStore.identity?.auditStatus));
  const applicationStatus = computed(() =>
    Number(
      deltaStore.application?.applicationStatus ?? deltaStore.identity?.applicationStatus ?? 0,
    ),
  );
  const normalizedStatus = computed(() => {
    if (
      identityStatus.value === DeltaAuditStatus.APPROVED ||
      identityStatus.value === DeltaAuditStatus.DISABLED ||
      identityStatus.value === DeltaAuditStatus.BLACKLISTED
    ) {
      return identityStatus.value;
    }
    return applicationStatus.value;
  });
  const statusInfo = computed(() => getWorkerStatusInfo({ auditStatus: normalizedStatus.value }));
  const statusTitle = computed(() => statusInfo.value.title);
  const rejectReason = computed(
    () => deltaStore.application?.rejectReason || deltaStore.identity?.rejectReason || '',
  );
  const isRejected = computed(() => normalizedStatus.value === DeltaAuditStatus.REJECTED);
  const showApplyButton = computed(
    () =>
      !deltaStore.identityError &&
      (normalizedStatus.value === DeltaAuditStatus.NOT_APPLIED ||
        normalizedStatus.value === DeltaAuditStatus.REJECTED),
  );
  const showEnterButton = computed(
    () => !deltaStore.identityError && normalizedStatus.value === DeltaAuditStatus.APPROVED,
  );

  const mainTitle = computed(() => {
    if (deltaStore.identityError) {
      return '身份查询失败';
    }
    if (normalizedStatus.value === DeltaAuditStatus.PENDING) {
      return '申请已提交';
    }
    return statusInfo.value.title;
  });

  const statusDesc = computed(() => {
    if (deltaStore.identityError) {
      return deltaStore.identityError;
    }
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
    if (loading.value) {
      return;
    }
    loading.value = true;
    const identityRes = await deltaStore.fetchWorkerIdentity({ force: true, showError: false });
    if (identityRes?.code === 0) {
      await deltaStore.fetchWorkerApplication({ showError: false });
    }
    loading.value = false;
  }

  function goApply() {
    sheep.$router.go(DeltaRoute.WORKER_APPLY);
  }

  async function enterWorker() {
    await deltaStore.enterWorkerMode();
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
</style>
