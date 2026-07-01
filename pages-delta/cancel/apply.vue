<template>
  <s-layout title="申请取消" :bgStyle="{ color: '#f4f6f8' }"
    ><view class="page"
      ><view class="card"
        ><view class="label">取消原因</view
        ><textarea
          v-model="reason"
          class="textarea"
          maxlength="255"
          placeholder="请填写取消原因"
        /><view class="label top">备注（选填）</view
        ><textarea
          v-model="remark"
          class="textarea small"
          maxlength="500"
          placeholder="补充说明"
        /></view
      ><button class="ss-reset-button submit" :disabled="submitting" @tap="confirmSubmit">{{
        submitting ? '提交中' : '提交取消申请'
      }}</button></view
    ></s-layout
  >
</template>
<script setup>
  import { ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  const id = ref('');
  const reason = ref('');
  const remark = ref('');
  const submitting = ref(false);
  function confirmSubmit() {
    if (!reason.value.trim()) {
      uni.showToast({ title: '请填写取消原因', icon: 'none' });
      return;
    }
    uni.showModal({
      title: '申请取消',
      content: '取消申请需平台审核，确认提交？',
      success: ({ confirm }) => {
        if (confirm) submit();
      },
    });
  }
  async function submit() {
    if (submitting.value) return;
    submitting.value = true;
    const res = await ServiceOrderApi.applyCancel({
      serviceOrderId: Number(id.value),
      reason: reason.value.trim(),
      remark: remark.value.trim(),
    });
    submitting.value = false;
    if (res?.code === 0) sheep.$router.redirect('/pages-delta/cancel/index');
  }
  onLoad((o = {}) => {
    id.value = o.id || '';
  });
</script>
<style lang="scss" scoped>
  .page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }
  .card {
    padding: 24rpx;
    border-radius: 18rpx;
    background: #fff;
  }
  .label {
    margin-bottom: 12rpx;
    font-size: 26rpx;
    font-weight: 800;
  }
  .top {
    margin-top: 22rpx;
  }
  .textarea {
    width: 100%;
    min-height: 200rpx;
    padding: 18rpx;
    border-radius: 14rpx;
    background: #f6f7f9;
    box-sizing: border-box;
  }
  .small {
    min-height: 140rpx;
  }
  .submit {
    margin-top: 28rpx;
    height: 82rpx;
    border-radius: 999rpx;
    color: #fff;
    background: #e60012;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }
</style>
