<template>
  <s-layout title="验收服务" :bgStyle="{ color: '#f4f6f8' }"
    ><view class="page"
      ><view class="card"
        ><view class="label">验收备注（选填）</view
        ><textarea
          v-model="remark"
          class="textarea"
          maxlength="500"
          placeholder="请输入验收备注"
        /></view
      ><button class="ss-reset-button submit" :disabled="submitting" @tap="confirmSubmit">{{
        submitting ? '提交中' : '确认验收通过'
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
  const remark = ref('');
  const submitting = ref(false);
  function confirmSubmit() {
    uni.showModal({
      title: '确认验收',
      content: '验收后订单将完成，确认继续？',
      success: ({ confirm }) => {
        if (confirm) submit();
      },
    });
  }
  async function submit() {
    if (submitting.value) return;
    submitting.value = true;
    const res = await ServiceOrderApi.accept({
      serviceOrderId: Number(id.value),
      remark: remark.value.trim(),
    });
    submitting.value = false;
    if (res?.code === 0) sheep.$router.back();
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
