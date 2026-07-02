<template>
  <s-layout title="编辑资料" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view v-if="error" class="error-card">
        <text>{{ error }}</text>
        <text class="retry" @tap="loadProfilePage">重试</text>
      </view>

      <template v-if="initialized">
        <view class="form-card">
          <view class="field">
            <view class="label">头像</view>
            <s-uploader
              v-model:url="form.avatar"
              fileMediatype="image"
              limit="1"
              mode="grid"
              :imageStyles="{ width: '150rpx', height: '150rpx' }"
            />
          </view>
          <view class="field">
            <view class="label">展示名称</view>
            <input
              v-model="form.displayName"
              class="input"
              maxlength="50"
              placeholder="请输入展示名称"
            />
          </view>
          <view class="field">
            <view class="label">手机号</view>
            <input
              v-model="form.phone"
              class="input"
              maxlength="11"
              type="number"
              placeholder="请输入 11 位手机号"
            />
          </view>
        </view>
        <button
          class="ss-reset-button submit-btn"
          :disabled="loading || checking || submitting"
          @tap="submit"
        >
          {{ submitting ? '保存中' : '保存' }}
        </button>
      </template>
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import test from '@/sheep/helper/test';

  const deltaStore = sheep.$store('delta');

  const loading = ref(false);
  const error = ref('');
  const initialized = ref(false);
  const checking = ref(false);
  const submitting = ref(false);

  const form = reactive({
    displayName: '',
    avatar: '',
    phone: '',
  });

  function normalizeText(value) {
    return String(value ?? '').trim();
  }

  function normalizeImageUrl(value) {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return normalizeImageUrl(value[0]);
    }

    if (value && typeof value === 'object') {
      return String(value.url ?? '').trim();
    }

    return '';
  }

  function fillProfile(data = {}) {
    form.displayName = normalizeText(data.displayName);
    form.avatar = normalizeImageUrl(data.avatar);
    form.phone = normalizeText(data.phone);
  }

  async function loadProfilePage() {
    if (loading.value) return;
    if (checking.value || submitting.value) return;

    loading.value = true;
    error.value = '';

    try {
      const allowed = await deltaStore.guardWorkerPage();

      if (!allowed) {
        return;
      }

      if (!initialized.value) {
        const data = deltaStore.profile;

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          error.value = '打手资料加载失败';
          return;
        }

        fillProfile(data);
        initialized.value = true;
      }
    } catch (loadError) {
      error.value = loadError?.msg || loadError?.message || '打手资料加载失败';
    } finally {
      loading.value = false;
    }
  }

  function buildSubmitData() {
    const displayName = normalizeText(form.displayName);
    const avatar = normalizeImageUrl(form.avatar);
    const phone = normalizeText(form.phone);

    if (displayName.length > 50) {
      sheep.$helper.toast('展示名称不能超过 50 个字符');
      return null;
    }

    if (phone && !test.mobile(phone)) {
      sheep.$helper.toast('请输入正确的手机号');
      return null;
    }

    return {
      displayName,
      avatar,
      phone,
    };
  }

  async function submit() {
    if (loading.value || checking.value || submitting.value) {
      return;
    }

    const data = buildSubmitData();
    if (!data) return;

    checking.value = true;

    try {
      const allowed = await deltaStore.guardWorkerPage();

      if (!allowed) return;

      submitting.value = true;

      const res = await deltaStore.updateWorkerProfile(data);

      if (res?.code !== 0) {
        sheep.$helper.toast(res?.msg || '资料保存失败，请重试');
        return;
      }

      sheep.$router.back();
    } catch (submitError) {
      sheep.$helper.toast(submitError?.msg || submitError?.message || '资料保存失败，请重试');
    } finally {
      checking.value = false;
      submitting.value = false;
    }
  }

  onShow(loadProfilePage);
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

  .field {
    margin-bottom: 24rpx;
  }

  .field:last-child {
    margin-bottom: 0;
  }

  .label {
    margin-bottom: 12rpx;
    color: #252932;
    font-size: 26rpx;
    line-height: 36rpx;
    font-weight: 800;
  }

  .input {
    width: 100%;
    height: 78rpx;
    padding: 0 20rpx;
    border-radius: 14rpx;
    background: #f6f7f9;
    color: #17191f;
    font-size: 26rpx;
    line-height: 78rpx;
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

  .submit-btn[disabled] {
    opacity: 0.6;
  }

  .error-card {
    padding: 44rpx 30rpx;
    border-radius: 18rpx;
    background: #ffffff;
    text-align: center;
    color: #8c929d;
    font-size: 26rpx;
    line-height: 40rpx;
  }

  .retry {
    display: inline-block;
    margin-top: 18rpx;
    color: #e60012;
    font-weight: 800;
  }
</style>
