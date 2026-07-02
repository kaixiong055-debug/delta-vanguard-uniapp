<template>
  <s-layout title="提交完成" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view v-if="error" class="error-card">{{ error }}</view>
      <view class="form-card">
        <view class="label">完成总结</view>
        <textarea
          v-model="summary"
          class="textarea"
          maxlength="500"
          placeholder="请填写本次服务完成情况"
        />
      </view>
      <button
        class="ss-reset-button submit-btn"
        :disabled="submitting || confirming"
        @tap="confirmSubmit"
      >
        {{ submitting ? '提交中' : '提交完成' }}
      </button>
    </view>
  </s-layout>
</template>

<script setup>
  import { ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerOrderApi from '@/sheep/api/delta/workerOrder';

  const serviceOrderId = ref('');
  const error = ref('');
  const summary = ref('');
  const submitting = ref(false);
  const confirming = ref(false);
  const deltaStore = sheep.$store('delta');

  function normalizeLongId(value) {
    const text = String(value ?? '').trim();
    return /^[1-9]\d*$/.test(text) ? text : '';
  }

  async function guardPage() {
    try {
      const allowed = await deltaStore.guardWorkerPage();
      if (!allowed) return false;

      if (!normalizeLongId(serviceOrderId.value)) {
        error.value = '服务单 ID 不存在';
        return false;
      }

      error.value = '';
      return true;
    } catch (guardError) {
      error.value = guardError?.msg || guardError?.message || '打手身份校验失败';
      return false;
    }
  }

  async function confirmSubmit() {
    if (submitting.value || confirming.value) return;

    const allowed = await guardPage();
    if (!allowed) {
      if (error.value) {
        sheep.$helper.toast(error.value);
      }
      return;
    }

    const normalizedId = normalizeLongId(serviceOrderId.value);
    const normalizedSummary = String(summary.value ?? '').trim();

    if (!normalizedId) {
      sheep.$helper.toast('服务单 ID 不存在');
      return;
    }

    if (!normalizedSummary) {
      sheep.$helper.toast('请填写完成总结');
      return;
    }

    confirming.value = true;

    uni.showModal({
      title: '提交服务完成',
      content: '提交后将等待老板验收，确认继续？',
      success: ({ confirm }) => {
        if (confirm) submit(normalizedId, normalizedSummary);
      },
      complete: () => {
        confirming.value = false;
      },
    });
  }

  async function submit(normalizedId, normalizedSummary) {
    if (submitting.value) return;

    if (!normalizeLongId(normalizedId)) {
      sheep.$helper.toast('服务单 ID 不存在');
      return;
    }

    if (!String(normalizedSummary ?? '').trim()) {
      sheep.$helper.toast('请填写完成总结');
      return;
    }

    submitting.value = true;

    try {
      const res = await WorkerOrderApi.submitCompletion({
        serviceOrderId: normalizedId,
        summary: normalizedSummary,
      });

      if (res?.code !== 0) {
        sheep.$helper.toast(res?.msg || '提交完成失败，请重试');
        return;
      }

      sheep.$router.back();
    } catch (submitError) {
      sheep.$helper.toast(submitError?.msg || submitError?.message || '提交完成失败，请重试');
    } finally {
      submitting.value = false;
    }
  }

  onLoad((options = {}) => {
    serviceOrderId.value = normalizeLongId(options.id);
  });
  onShow(() => {
    guardPage();
  });
</script>

<style lang="scss" scoped>
  .form-page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .error-card {
    margin-bottom: 20rpx;
    padding: 18rpx 24rpx;
    border-radius: 14rpx;
    background: #fff2f2;
    color: #cd1f1f;
    font-size: 26rpx;
    line-height: 38rpx;
  }

  .form-card {
    padding: 24rpx;
    border-radius: 18rpx;
    background: #fff;
  }
  .label {
    margin-bottom: 14rpx;
    color: #252932;
    font-size: 26rpx;
    font-weight: 800;
  }
  .textarea {
    width: 100%;
    min-height: 260rpx;
    padding: 18rpx 20rpx;
    border-radius: 14rpx;
    background: #f6f7f9;
    box-sizing: border-box;
    font-size: 26rpx;
  }
  .submit-btn {
    margin-top: 28rpx;
    height: 82rpx;
    border-radius: 999rpx;
    color: #fff;
    background: #17191f;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }
</style>
