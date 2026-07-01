<template>
  <s-layout title="提交完成" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view class="form-card">
        <view class="label">完成总结</view>
        <textarea
          v-model="summary"
          class="textarea"
          maxlength="500"
          placeholder="请填写本次服务完成情况"
        />
      </view>
      <button class="ss-reset-button submit-btn" :disabled="submitting" @tap="confirmSubmit">{{
        submitting ? '提交中' : '提交完成'
      }}</button>
    </view>
  </s-layout>
</template>

<script setup>
  import { ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerOrderApi from '@/sheep/api/delta/workerOrder';

  const serviceOrderId = ref('');
  const summary = ref('');
  const submitting = ref(false);
  const deltaStore = sheep.$store('delta');
  function confirmSubmit() {
    if (!summary.value.trim()) {
      uni.showToast({ title: '请填写完成总结', icon: 'none' });
      return;
    }
    uni.showModal({
      title: '提交服务完成',
      content: '提交后将等待老板验收，确认继续？',
      success: ({ confirm }) => {
        if (confirm) submit();
      },
    });
  }
  async function submit() {
    if (submitting.value) return;
    submitting.value = true;
    const res = await WorkerOrderApi.submitCompletion({
      serviceOrderId: Number(serviceOrderId.value),
      summary: summary.value.trim(),
    });
    submitting.value = false;
    if (res?.code === 0) sheep.$router.back();
  }
  onLoad((options = {}) => {
    serviceOrderId.value = options.id || '';
  });
  onShow(() => deltaStore.guardWorkerPage());
</script>

<style lang="scss" scoped>
  .form-page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
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
