<template>
  <s-layout title="登记凭证" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view class="form-card">
        <view class="label">凭证类型</view>
        <picker :range="types" range-key="label" @change="changeType">
          <view class="field">{{ evidenceTypeMap[form.evidenceType] }}</view>
        </picker>
        <view class="label">上传文件</view>
        <s-uploader
          v-model:url="files"
          :fileMediatype="form.evidenceType === 2 ? 'video' : 'image'"
          :limit="1"
          mode="grid"
        />
        <view class="label">凭证描述</view>
        <textarea
          v-model="form.description"
          class="textarea"
          maxlength="500"
          placeholder="请输入凭证说明"
        />
      </view>
      <button class="ss-reset-button submit-btn" :disabled="submitting" @tap="submit">{{
        submitting ? '提交中' : '登记凭证'
      }}</button>
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerOrderApi from '@/sheep/api/delta/workerOrder';
  import { evidenceTypeMap } from '@/sheep/helper/delta';

  const serviceOrderId = ref('');
  const files = ref([]);
  const submitting = ref(false);
  const deltaStore = sheep.$store('delta');
  const types = Object.entries(evidenceTypeMap).map(([value, label]) => ({
    value: Number(value),
    label,
  }));
  const form = reactive({ evidenceType: 1, description: '' });

  function changeType(e) {
    form.evidenceType = types[Number(e.detail.value)].value;
    files.value = [];
  }
  async function submit() {
    if (submitting.value) return;
    const fileUrl = Array.isArray(files.value) ? files.value[0] : files.value;
    if (!fileUrl) {
      uni.showToast({ title: '请先上传凭证文件', icon: 'none' });
      return;
    }
    submitting.value = true;
    const res = await WorkerOrderApi.createEvidence({
      serviceOrderId: Number(serviceOrderId.value),
      evidenceType: form.evidenceType,
      fileUrl,
      description: form.description.trim(),
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
    margin: 18rpx 0 12rpx;
    color: #252932;
    font-size: 26rpx;
    font-weight: 800;
  }
  .field,
  .textarea {
    width: 100%;
    padding: 18rpx 20rpx;
    border-radius: 14rpx;
    background: #f6f7f9;
    box-sizing: border-box;
    font-size: 26rpx;
  }
  .textarea {
    min-height: 200rpx;
  }
  .submit-btn {
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
