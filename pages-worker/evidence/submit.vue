<template>
  <s-layout title="登记凭证" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view v-if="error" class="error-card">{{ error }}</view>
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
      <button class="ss-reset-button submit-btn" :disabled="submitting" @tap="submit">
        {{ submitting ? '提交中' : '登记凭证' }}
      </button>
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
  const error = ref('');
  const files = ref([]);
  const submitting = ref(false);
  const deltaStore = sheep.$store('delta');
  const types = Object.entries(evidenceTypeMap).map(([value, label]) => ({
    value: Number(value),
    label,
  }));
  const form = reactive({ evidenceType: 1, description: '' });

  function normalizeLongId(value) {
    const text = String(value ?? '').trim();
    return /^[1-9]\d*$/.test(text) ? text : '';
  }

  function normalizeFileUrl(value) {
    const first = Array.isArray(value) ? value[0] : value;

    if (typeof first === 'string') {
      return first.trim();
    }

    if (first && typeof first === 'object') {
      return String(first.url ?? '').trim();
    }

    return '';
  }

  function changeType(event) {
    const index = Number(event?.detail?.value);

    if (!Number.isInteger(index) || index < 0 || index >= types.length) {
      return;
    }

    const nextType = types[index].value;

    if (nextType === form.evidenceType) {
      return;
    }

    form.evidenceType = nextType;
    files.value = [];
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
    const fileUrl = normalizeFileUrl(files.value);
    const description = String(form.description ?? '').trim();

    if (!normalizedId) {
      sheep.$helper.toast('服务单 ID 不存在');
      return;
    }

    const allowedEvidenceTypes = types.map((item) => item.value);
    if (!allowedEvidenceTypes.includes(form.evidenceType)) {
      sheep.$helper.toast('请选择有效的凭证类型');
      return;
    }

    if (!fileUrl) {
      sheep.$helper.toast('请先上传凭证文件');
      return;
    }

    submitting.value = true;

    try {
      const res = await WorkerOrderApi.createEvidence({
        serviceOrderId: normalizedId,
        evidenceType: form.evidenceType,
        fileUrl,
        description,
      });

      if (res?.code !== 0) {
        sheep.$helper.toast(res?.msg || '凭证登记失败，请重试');
        return;
      }

      sheep.$router.back();
    } catch (submitError) {
      sheep.$helper.toast(submitError?.msg || submitError?.message || '凭证登记失败，请重试');
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
