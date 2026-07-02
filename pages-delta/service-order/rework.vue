<template>
  <s-layout title="要求返工" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <view class="notice">
        提交返工后，订单将退回服务进行中。请清楚说明需要补充或修正的内容，方便打手继续处理。
      </view>

      <view class="card">
        <view class="label">返工原因</view>
        <textarea
          v-model="reason"
          class="textarea"
          maxlength="500"
          placeholder="请说明需要返工的内容"
        />
        <view class="count">{{ reason.length }}/500</view>
      </view>

      <button
        class="ss-reset-button submit"
        :disabled="submitting || !id"
        @tap="confirmSubmit"
      >
        {{ submitting ? '提交中' : '提交返工要求' }}
      </button>
    </view>
  </s-layout>
</template>

<script setup>
  import { ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';

  const id = ref('');
  const reason = ref('');
  const submitting = ref(false);

  function confirmSubmit() {
    if (!id.value) {
      sheep.$helper.toast('服务单 ID 不存在');
      return;
    }
    if (submitting.value) return;
    if (!reason.value.trim()) {
      sheep.$helper.toast('请填写返工原因');
      return;
    }

    uni.showModal({
      title: '要求返工',
      content: '确认将订单退回服务进行中？',
      success: ({ confirm }) => {
        if (confirm) submit();
      },
    });
  }

  async function submit() {
    submitting.value = true;
    try {
      const res = await ServiceOrderApi.requestRework({
        serviceOrderId: Number(id.value),
        reason: reason.value.trim(),
      });
      if (res?.code === 0) {
        setTimeout(() => sheep.$router.back(), 300);
      }
    } catch (error) {
      sheep.$helper.toast(error?.msg || error?.message || '返工提交失败，请稍后重试');
    } finally {
      submitting.value = false;
    }
  }

  onLoad((options = {}) => {
    id.value = options.id || '';
  });
</script>

<style lang="scss" scoped>
  .page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .notice,
  .card {
    padding: 24rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }

  .notice {
    margin-bottom: 20rpx;
    color: #8a4d00;
    background: #fff6e6;
    font-size: 24rpx;
    line-height: 38rpx;
  }

  .label {
    margin-bottom: 14rpx;
    font-size: 26rpx;
    font-weight: 800;
  }

  .textarea {
    width: 100%;
    min-height: 240rpx;
    padding: 18rpx;
    border-radius: 14rpx;
    background: #f6f7f9;
    box-sizing: border-box;
  }

  .count {
    margin-top: 8rpx;
    color: #999999;
    font-size: 22rpx;
    text-align: right;
  }

  .submit {
    width: 100%;
    height: 82rpx;
    margin-top: 28rpx;
    border-radius: 999rpx;
    color: #e60012;
    background: #fff0f1;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }

  .submit[disabled] {
    opacity: 0.5;
  }
</style>
