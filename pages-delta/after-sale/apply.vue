<template>
  <s-layout title="申请售后" :bgStyle="{ color: '#f4f6f8' }"
    ><view class="page"
      ><view class="card"
        ><view class="label">售后类型</view
        ><picker
          :range="types"
          range-key="label"
          @change="form.afterSaleType = types[$event.detail.value].value"
          ><view class="field">{{
            types.find((i) => i.value === form.afterSaleType)?.label
          }}</view></picker
        ><view class="label">原因类型编号（选填）</view
        ><input
          v-model.number="form.reasonType"
          class="field"
          type="number"
          placeholder="后端当前未提供原因类型枚举" /><view class="label">申请原因</view
        ><textarea
          v-model="form.reason"
          class="textarea"
          maxlength="500"
          placeholder="请填写售后原因" /><view class="label">问题描述</view
        ><textarea
          v-model="form.description"
          class="textarea"
          maxlength="1000"
          placeholder="请详细描述问题" /><view class="label">请求退款金额（元）</view
        ><input
          v-model="refundYuan"
          class="field"
          type="digit"
          placeholder="不填写表示由平台判定" /><view class="label">凭证图片</view
        ><s-uploader
          v-model:url="evidenceUrls"
          fileMediatype="image"
          :limit="9"
          mode="grid" /></view
      ><button class="ss-reset-button submit" :disabled="submitting" @tap="confirmSubmit">{{
        submitting ? '提交中' : '提交售后申请'
      }}</button></view
    ></s-layout
  >
</template>
<script setup>
  import { reactive, ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  const id = ref('');
  const refundYuan = ref('');
  const evidenceUrls = ref([]);
  const submitting = ref(false);
  const types = [
    { label: '服务质量问题', value: 1 },
    { label: '服务与描述不符', value: 2 },
    { label: '打手未履约', value: 3 },
    { label: '其他', value: 4 },
  ];
  const form = reactive({ afterSaleType: 1, reasonType: undefined, reason: '', description: '' });
  function confirmSubmit() {
    if (!form.reason.trim()) {
      uni.showToast({ title: '请填写售后原因', icon: 'none' });
      return;
    }
    const amount = refundYuan.value === '' ? undefined : Math.round(Number(refundYuan.value) * 100);
    if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
      uni.showToast({ title: '退款金额格式不正确', icon: 'none' });
      return;
    }
    uni.showModal({
      title: '提交售后',
      content: '确认提交售后申请？',
      success: ({ confirm }) => {
        if (confirm) submit(amount);
      },
    });
  }
  async function submit(amount) {
    if (submitting.value) return;
    submitting.value = true;
    const res = await ServiceOrderApi.applyAfterSale({
      serviceOrderId: Number(id.value),
      afterSaleType: form.afterSaleType,
      reasonType: form.reasonType === '' ? undefined : Number(form.reasonType),
      reason: form.reason.trim(),
      description: form.description.trim(),
      requestedRefundAmount: amount,
      evidenceUrls: JSON.stringify(evidenceUrls.value || []),
    });
    submitting.value = false;
    if (res?.code === 0) sheep.$router.redirect('/pages-delta/after-sale/index');
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
    margin: 20rpx 0 12rpx;
    font-size: 26rpx;
    font-weight: 800;
  }
  .field,
  .textarea {
    width: 100%;
    padding: 18rpx;
    border-radius: 14rpx;
    background: #f6f7f9;
    box-sizing: border-box;
    font-size: 25rpx;
  }
  .textarea {
    min-height: 150rpx;
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
