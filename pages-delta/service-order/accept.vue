<template>
  <s-layout title="验收服务" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <view class="notice">
        验收通过后，服务订单将进入完成状态，并继续后续结算流程。请先核对履约进度和服务凭证。
      </view>

      <view class="card">
        <view class="label">验收备注（选填）</view>
        <textarea
          v-model="remark"
          class="textarea"
          maxlength="500"
          placeholder="请输入验收备注"
        />
        <view class="count">{{ remark.length }}/500</view>
      </view>

      <button
        class="ss-reset-button submit"
        :disabled="submitting || !getServiceOrderId()"
        @tap="confirmSubmit"
      >
        {{ submitting ? '提交中' : '确认验收通过' }}
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
  const remark = ref('');
  const submitting = ref(false);

  function getServiceOrderId() {
    return normalizeLongId(id.value);
  }

  function normalizeLongId(value) {
    const text = String(value ?? '').trim();
    return /^[1-9]\d*$/.test(text) ? text : '';
  }

  function confirmSubmit() {
    const serviceOrderId = getServiceOrderId();
    if (!serviceOrderId) {
      sheep.$helper.toast('服务单 ID 不存在');
      return;
    }
    if (submitting.value) return;

    uni.showModal({
      title: '确认验收',
      content: '验收后订单将完成，确认继续？',
      success: ({ confirm }) => {
        if (confirm) submit(serviceOrderId);
      },
    });
  }

  async function submit(serviceOrderId) {
    if (submitting.value) return;

    submitting.value = true;
    try {
      const res = await ServiceOrderApi.accept({
        serviceOrderId,
        remark: remark.value.trim(),
      });
      if (res?.code !== 0) {
        sheep.$helper.toast(res?.msg || '验收失败，请稍后重试');
        return;
      }
      sheep.$router.back();
    } catch (error) {
      sheep.$helper.toast(error?.msg || error?.message || '验收失败，请稍后重试');
    } finally {
      submitting.value = false;
    }
  }

  onLoad((options = {}) => {
    id.value = normalizeLongId(options.id);
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
    color: #075d38;
    background: #eaf8f1;
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
    color: #ffffff;
    background: #e60012;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }

  .submit[disabled] {
    opacity: 0.5;
  }
</style>
