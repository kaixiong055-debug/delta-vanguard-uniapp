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
        ><view class="label">申请原因</view
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
      ><button class="ss-reset-button submit" :disabled="submitting || !getServiceOrderId()" @tap="confirmSubmit">{{
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
  import { DeltaAfterSaleType } from '@/sheep/helper/delta';

  const id = ref('');
  const refundYuan = ref('');
  const evidenceUrls = ref([]);
  const submitting = ref(false);

  const types = [
    {
      label: '服务质量问题',
      value: DeltaAfterSaleType.QUALITY_ISSUE,
    },
    {
      label: '服务与描述不符',
      value: DeltaAfterSaleType.NOT_AS_DESCRIBED,
    },
    {
      label: '打手未履约',
      value: DeltaAfterSaleType.WORKER_NO_SHOW,
    },
    {
      label: '其他',
      value: DeltaAfterSaleType.OTHER,
    },
  ];

  const form = reactive({
    afterSaleType: DeltaAfterSaleType.QUALITY_ISSUE,
    reason: '',
    description: '',
  });

  function getServiceOrderId() {
    return normalizeLongId(id.value);
  }

  function normalizeLongId(value) {
    const text = String(value ?? '').trim();
    return /^[1-9]\d*$/.test(text) ? text : '';
  }

  function parseRefundAmount(value) {
    const text = String(value ?? '').trim();
    if (!text) return { valid: true, amount: undefined };

    if (!/^(?:\d+|\d*\.\d{1,2})$/.test(text)) {
      return { valid: false, amount: undefined };
    }

    const yuan = Number(text);
    if (!Number.isFinite(yuan) || yuan < 0) {
      return { valid: false, amount: undefined };
    }

    const amount = Math.round(yuan * 100);
    if (!Number.isSafeInteger(amount)) {
      return { valid: false, amount: undefined };
    }

    return { valid: true, amount };
  }

  function confirmSubmit() {
    if (!form.reason.trim()) {
      uni.showToast({ title: '请填写售后原因', icon: 'none' });
      return;
    }

    const result = parseRefundAmount(refundYuan.value);
    if (!result.valid) {
      uni.showToast({ title: '退款金额格式不正确', icon: 'none' });
      return;
    }

    if (submitting.value) return;

    const serviceOrderId = getServiceOrderId();
    if (!serviceOrderId) {
      sheep.$helper.toast('服务单 ID 不存在');
      return;
    }

    uni.showModal({
      title: '提交售后',
      content: '确认提交售后申请？',
      success: ({ confirm }) => {
        if (confirm) submit(serviceOrderId, result.amount);
      },
    });
  }

  async function submit(serviceOrderId, amount) {
    if (submitting.value) return;
    submitting.value = true;

    try {
      const urls = Array.isArray(evidenceUrls.value) ? evidenceUrls.value : [];

      const res = await ServiceOrderApi.applyAfterSale({
        serviceOrderId,
        afterSaleType: form.afterSaleType,
        reason: form.reason.trim(),
        description: form.description.trim(),
        requestedRefundAmount: amount,
        evidenceUrls: JSON.stringify(urls),
      });

      if (res?.code !== 0) {
        sheep.$helper.toast(res?.msg || '售后申请提交失败');
        return;
      }

      sheep.$router.redirect('/pages-delta/after-sale/index');
    } catch (error) {
      sheep.$helper.toast(error?.msg || error?.message || '售后申请提交失败');
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
