<template>
  <s-layout title="俱乐部入驻" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view v-if="loadError" class="notice-card">
        <view class="notice-title">身份查询失败</view>
        <view class="notice-desc">{{ loadError }}</view>
        <button class="ss-reset-button retry-btn" @tap="loadContext">重试</button>
      </view>

      <view v-else class="form-card">
        <view class="field">
          <view class="label">俱乐部名称 <text class="required">*</text></view>
          <input v-model="form.clubName" class="input" maxlength="100" placeholder="请输入名称" />
        </view>
        <view class="field">
          <view class="label">联系人姓名 <text class="required">*</text></view>
          <input
            v-model="form.contactName"
            class="input"
            maxlength="50"
            placeholder="请输入联系人姓名"
          />
        </view>
        <view class="field">
          <view class="label">联系人手机号 <text class="required">*</text></view>
          <input
            v-model="form.contactMobile"
            class="input"
            maxlength="20"
            placeholder="请输入联系人手机号"
          />
        </view>
        <view class="field">
          <view class="label">联系人微信</view>
          <input
            v-model="form.contactWechat"
            class="input"
            maxlength="50"
            placeholder="选填，最多 50 字"
          />
        </view>
        <view class="field">
          <view class="label">俱乐部描述</view>
          <textarea
            v-model="form.description"
            class="textarea"
            maxlength="2000"
            placeholder="介绍服务特色、团队情况等"
          />
        </view>
        <view class="field">
          <view class="label">俱乐部 Logo</view>
          <s-uploader
            v-model:url="logoImages"
            fileMediatype="image"
            limit="1"
            mode="grid"
            :imageStyles="{ width: '150rpx', height: '150rpx' }"
          />
        </view>
        <view class="field">
          <view class="label">资质凭证</view>
          <s-uploader
            v-model:url="qualificationImages"
            fileMediatype="image"
            limit="10"
            mode="grid"
            :imageStyles="{ width: '150rpx', height: '150rpx' }"
          />
        </view>
      </view>

      <button
        v-if="!loadError"
        class="ss-reset-button submit-btn"
        :disabled="submitting"
        @tap="confirmSubmit"
      >
        {{ submitting ? '提交中' : '提交申请' }}
      </button>
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { DeltaClubApplicationStatus, DeltaRoute } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const submitting = ref(false);
  const loadError = ref('');
  const logoImages = ref([]);
  const qualificationImages = ref([]);
  const form = reactive({
    clubName: '',
    contactName: '',
    contactMobile: '',
    contactWechat: '',
    description: '',
  });

  function parseImageUrls(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (error) {
      return [];
    }
  }

  function fillApplication(data = {}) {
    form.clubName = data.clubName || '';
    form.contactName = data.contactName || '';
    form.contactMobile = data.contactMobile || '';
    form.contactWechat = data.contactWechat || '';
    form.description = data.description || '';
    logoImages.value = data.logoUrl ? [data.logoUrl] : [];
    qualificationImages.value = parseImageUrls(data.qualificationUrls);
  }

  function validateForm() {
    const rules = [
      ['clubName', 100, '请输入俱乐部名称', '俱乐部名称不能超过 100 字'],
      ['contactName', 50, '请输入联系人姓名', '联系人姓名不能超过 50 字'],
      ['contactMobile', 20, '请输入联系人手机号', '联系人手机号不能超过 20 字'],
    ];
    for (const [key, max, emptyText, longText] of rules) {
      const value = String(form[key] || '').trim();
      if (!value) {
        sheep.$helper.toast(emptyText);
        return false;
      }
      if (value.length > max) {
        sheep.$helper.toast(longText);
        return false;
      }
    }
    if (form.contactWechat.length > 50 || form.description.length > 2000) {
      sheep.$helper.toast('填写内容超过长度限制');
      return false;
    }
    const logoUrl = logoImages.value[0] || '';
    const qualificationUrls = JSON.stringify(qualificationImages.value || []);
    if (logoUrl.length > 500 || qualificationUrls.length > 3000) {
      sheep.$helper.toast('上传内容超过长度限制');
      return false;
    }
    return true;
  }

  function askConfirm() {
    return new Promise((resolve) => {
      uni.showModal({
        title: '确认提交',
        content: '提交后将进入平台审核，确认提交当前资料吗？',
        success: ({ confirm }) => resolve(confirm),
        fail: () => resolve(false),
      });
    });
  }

  async function confirmSubmit() {
    if (submitting.value || !validateForm() || !(await askConfirm())) return;
    submitting.value = true;
    try {
      const res = await deltaStore.submitClubApplication({
        clubName: form.clubName.trim(),
        contactName: form.contactName.trim(),
        contactMobile: form.contactMobile.trim(),
        contactWechat: form.contactWechat.trim(),
        description: form.description.trim(),
        logoUrl: logoImages.value[0] || '',
        qualificationUrls: JSON.stringify(qualificationImages.value || []),
      });
      sheep.$helper.toast(res?.msg || (res?.code === 0 ? '提交成功' : '提交失败'));
      if (res?.code === 0) sheep.$router.redirect(DeltaRoute.CLUB_APPLY_STATUS);
    } catch (error) {
      sheep.$helper.toast(error?.msg || error?.message || '提交失败，请稍后重试');
    } finally {
      submitting.value = false;
    }
  }

  async function loadContext() {
    loadError.value = '';
    const identityRes = await deltaStore.fetchClubIdentity({ force: true, showError: false });
    if (identityRes?.code !== 0) {
      loadError.value = deltaStore.clubIdentityError || identityRes?.msg || '请稍后重试';
      return;
    }
    const identity = deltaStore.clubIdentity || {};
    if (identity.isClubOwner === true) {
      sheep.$router.redirect(DeltaRoute.CLUB_HOME);
      return;
    }
    const status = Number(identity.applicationStatus);
    if (
      identity.hasApplication === true &&
      (status === DeltaClubApplicationStatus.PENDING ||
        status === DeltaClubApplicationStatus.APPROVED)
    ) {
      sheep.$router.redirect(DeltaRoute.CLUB_APPLY_STATUS);
      return;
    }
    if (identity.hasApplication === true) {
      const applicationRes = await deltaStore.fetchClubApplication({ showError: false });
      if (applicationRes?.code === 0) fillApplication(applicationRes.data);
    }
  }

  onShow(loadContext);
</script>

<style lang="scss" scoped>
  .form-page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }
  .form-card,
  .notice-card {
    padding: 24rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }
  .notice-title {
    color: #17191f;
    font-size: 34rpx;
    font-weight: 800;
  }
  .notice-desc {
    margin-top: 12rpx;
    color: #7f8590;
    font-size: 26rpx;
    line-height: 40rpx;
  }
  .field {
    margin-bottom: 24rpx;
  }
  .label {
    margin-bottom: 12rpx;
    color: #252932;
    font-size: 26rpx;
    font-weight: 800;
  }
  .required {
    color: #e60012;
  }
  .input,
  .textarea {
    width: 100%;
    border-radius: 14rpx;
    background: #f6f7f9;
    color: #17191f;
    font-size: 26rpx;
    box-sizing: border-box;
  }
  .input {
    height: 78rpx;
    padding: 0 20rpx;
    line-height: 78rpx;
  }
  .textarea {
    min-height: 180rpx;
    padding: 18rpx 20rpx;
    line-height: 38rpx;
  }
  .submit-btn,
  .retry-btn {
    width: 100%;
    height: 82rpx;
    margin-top: 28rpx;
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
