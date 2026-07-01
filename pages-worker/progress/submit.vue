<template>
  <s-layout title="提交进度" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view class="form-card">
        <view class="label">进度类型</view>
        <picker
          :range="progressTypes"
          range-key="label"
          @change="form.progressType = progressTypes[$event.detail.value].value"
        >
          <view class="picker-value">{{ progressTypeMap[form.progressType] }}</view>
        </picker>
        <view class="label section-label">进度百分比</view>
        <slider
          :value="form.progressPercent"
          min="0"
          max="100"
          show-value
          activeColor="#e60012"
          @change="form.progressPercent = Number($event.detail.value)"
        />
        <view class="label">进度说明</view>
        <textarea
          v-model="form.content"
          class="textarea"
          placeholder="请输入本次服务进度或完成说明"
        />
      </view>
      <button class="ss-reset-button submit-btn" :disabled="submitting" @tap="submit">{{
        submitting ? '提交中' : '提交'
      }}</button>
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerOrderApi from '@/sheep/api/delta/workerOrder';
  import { progressTypeMap } from '@/sheep/helper/delta';

  const id = ref('');
  const form = reactive({
    progressType: 2,
    progressPercent: 0,
    content: '',
  });
  const submitting = ref(false);
  const deltaStore = sheep.$store('delta');
  const progressTypes = [
    { label: '进度更新', value: 2 },
    { label: '异常报告', value: 3 },
  ];

  async function submit() {
    if (submitting.value) return;
    if (!form.content.trim()) {
      uni.showToast({ title: '请输入进度说明', icon: 'none' });
      return;
    }
    submitting.value = true;
    const res = await WorkerOrderApi.submitProgress({
      serviceOrderId: Number(id.value),
      progressType: form.progressType,
      progressPercent: form.progressPercent,
      content: form.content.trim(),
    });
    submitting.value = false;
    if (res?.code === 0) {
      sheep.$router.back();
    }
  }

  onLoad((options = {}) => {
    id.value = options.id || '';
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
    background: #ffffff;
  }

  .label {
    margin-bottom: 14rpx;
    color: #252932;
    font-size: 26rpx;
    line-height: 36rpx;
    font-weight: 800;
  }

  .textarea {
    width: 100%;
    min-height: 240rpx;
    padding: 18rpx 20rpx;
    border-radius: 14rpx;
    background: #f6f7f9;
    color: #17191f;
    font-size: 26rpx;
    line-height: 38rpx;
    box-sizing: border-box;
  }
  .picker-value {
    height: 72rpx;
    padding: 0 20rpx;
    border-radius: 14rpx;
    background: #f6f7f9;
    font-size: 26rpx;
    line-height: 72rpx;
  }
  .section-label {
    margin-top: 24rpx;
  }

  .submit-btn {
    margin-top: 30rpx;
    height: 82rpx;
    border-radius: 999rpx;
    background: #e60012;
    color: #ffffff;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }
</style>
