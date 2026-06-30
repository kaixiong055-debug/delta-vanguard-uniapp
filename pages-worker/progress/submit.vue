<template>
  <s-layout title="提交进度" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view class="form-card">
        <view class="label">进度说明</view>
        <textarea
          v-model="form.content"
          class="textarea"
          placeholder="请输入本次服务进度或完成说明"
        />
      </view>
      <button class="ss-reset-button submit-btn" @tap="submit">提交</button>
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerOrderApi from '@/sheep/api/delta/workerOrder';

  const id = ref('');
  const form = reactive({
    content: '',
  });

  async function submit() {
    const res = await WorkerOrderApi.submitProgress({
      orderId: id.value,
      content: form.content,
    });
    if (res?.code === 0) {
      sheep.$router.back();
    }
  }

  onLoad((options = {}) => {
    id.value = options.id || '';
  });
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
