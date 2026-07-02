<template>
  <s-layout title="提交进度" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view v-if="error" class="error-card">{{ error }}</view>
      <view class="form-card">
        <view class="label">进度类型</view>
        <picker :range="progressTypes" range-key="label" @change="changeProgressType">
          <view class="picker-value">{{ progressTypeMap[form.progressType] }}</view>
        </picker>
        <view class="label section-label">进度百分比</view>
        <slider
          :value="form.progressPercent"
          min="0"
          max="100"
          show-value
          activeColor="#e60012"
          @change="changeProgressPercent"
        />
        <view class="label">进度说明</view>
        <textarea
          v-model="form.content"
          class="textarea"
          placeholder="请输入本次服务进度或完成说明"
        />
      </view>
      <button class="ss-reset-button submit-btn" :disabled="submitting" @tap="submit">
        {{ submitting ? '提交中' : '提交' }}
      </button>
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerOrderApi from '@/sheep/api/delta/workerOrder';
  import { progressTypeMap } from '@/sheep/helper/delta';

  const serviceOrderId = ref('');
  const error = ref('');
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

  function normalizeLongId(value) {
    const text = String(value ?? '').trim();
    return /^[1-9]\d*$/.test(text) ? text : '';
  }

  function normalizeProgressPercent(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return Math.min(100, Math.max(0, Math.round(number)));
  }

  function changeProgressType(event) {
    const index = Number(event?.detail?.value);

    if (!Number.isInteger(index) || index < 0 || index >= progressTypes.length) {
      return;
    }

    form.progressType = progressTypes[index].value;
  }

  function changeProgressPercent(event) {
    form.progressPercent = normalizeProgressPercent(event?.detail?.value);
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

  async function submit() {
    if (submitting.value) return;

    const allowed = await guardPage();
    if (!allowed) {
      if (error.value) {
        sheep.$helper.toast(error.value);
      }
      return;
    }

    const normalizedId = normalizeLongId(serviceOrderId.value);
    const content = String(form.content ?? '').trim();
    const progressPercent = normalizeProgressPercent(form.progressPercent);

    if (!normalizedId) {
      sheep.$helper.toast('服务单 ID 不存在');
      return;
    }

    if (!content) {
      sheep.$helper.toast('请输入进度说明');
      return;
    }

    submitting.value = true;

    try {
      const res = await WorkerOrderApi.submitProgress({
        serviceOrderId: normalizedId,
        progressType: form.progressType,
        progressPercent,
        content,
      });

      if (res?.code !== 0) {
        sheep.$helper.toast(res?.msg || '进度提交失败，请重试');
        return;
      }

      sheep.$router.back();
    } catch (submitError) {
      sheep.$helper.toast(submitError?.msg || submitError?.message || '进度提交失败，请重试');
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
