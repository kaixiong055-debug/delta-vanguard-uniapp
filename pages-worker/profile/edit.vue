<template>
  <s-layout title="编辑资料" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
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
      <button class="ss-reset-button submit-btn" :disabled="submitting" @tap="submit">
        {{ submitting ? '保存中' : '保存' }}
      </button>
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import test from '@/sheep/helper/test';
  import { DeltaRoute } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const submitting = ref(false);
  const form = reactive({
    displayName: '',
    avatar: '',
    phone: '',
  });

  function fillProfile(data = {}) {
    form.displayName = data.displayName || '';
    form.avatar = data.avatar || '';
    form.phone = data.phone || '';
  }

  async function loadProfile() {
    const identityRes = await deltaStore.fetchWorkerIdentity({ force: true, showError: false });
    if (identityRes?.code !== 0) {
      sheep.$helper.toast(deltaStore.identityError || '身份查询失败，请稍后重试');
      return;
    }
    if (!deltaStore.canEnterWorker) {
      sheep.$router.redirect(deltaStore.resolveWorkerRoute() || DeltaRoute.WORKER_APPLY_STATUS);
      return;
    }
    const res = await deltaStore.fetchWorkerProfile({ showError: false });
    if (res?.code === 0) {
      fillProfile(res.data);
    }
  }

  function validateForm() {
    if (form.phone && !test.mobile(form.phone)) {
      sheep.$helper.toast('请输入正确的手机号');
      return false;
    }
    return true;
  }

  async function submit() {
    if (submitting.value || !validateForm()) {
      return;
    }
    submitting.value = true;
    const res = await deltaStore.updateWorkerProfile({
      displayName: form.displayName,
      avatar: form.avatar,
      phone: form.phone,
    });
    submitting.value = false;
    if (res?.code === 0) {
      sheep.$router.back();
    }
  }

  onShow(loadProfile);
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
</style>
