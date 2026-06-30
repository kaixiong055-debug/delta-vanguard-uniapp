<template>
  <s-layout title="打手申请" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view v-if="identityError" class="notice-card">
        <view class="notice-title">身份查询失败</view>
        <view class="notice-desc">{{ identityError }}</view>
        <button class="ss-reset-button retry-btn" @tap="loadApplyContext">重试</button>
      </view>

      <view v-else-if="blocked" class="notice-card">
        <view class="notice-title">{{ deltaStore.statusInfo.title }}</view>
        <view class="notice-desc">{{ blockReason }}</view>
      </view>

      <view v-else class="form-card">
        <view class="field">
          <view class="label">真实姓名 <text class="required">*</text></view>
          <input
            v-model="form.realName"
            class="input"
            maxlength="50"
            placeholder="请输入真实姓名"
          />
        </view>
        <view class="field">
          <view class="label">手机号 <text class="required">*</text></view>
          <input
            v-model="form.phone"
            class="input"
            maxlength="11"
            type="number"
            placeholder="请输入 11 位手机号"
          />
        </view>
        <view class="field">
          <view class="label">游戏 UID <text class="required">*</text></view>
          <input
            v-model="form.gameUid"
            class="input"
            maxlength="100"
            placeholder="请输入游戏账号 UID"
          />
        </view>
        <view class="field">
          <view class="label">设备类型 <text class="required">*</text></view>
          <radio-group class="radio-group" @change="onDeviceTypeChange">
            <label class="radio-item" v-for="item in deviceTypeOptions" :key="item.value">
              <radio
                color="#e60012"
                :value="String(item.value)"
                :checked="form.deviceType === item.value"
              />
              <text>{{ item.label }}</text>
            </label>
          </radio-group>
        </view>
        <view class="field">
          <view class="label">个人介绍</view>
          <textarea
            v-model="form.introduction"
            class="textarea"
            maxlength="500"
            placeholder="介绍擅长内容、服务习惯或可服务时间"
          />
        </view>
        <view class="field">
          <view class="label">经验描述</view>
          <textarea
            v-model="form.experience"
            class="textarea"
            maxlength="500"
            placeholder="说明游戏经验或历史服务经验"
          />
        </view>
        <view class="field">
          <view class="label">证明材料</view>
          <s-uploader
            v-model:url="form.evidenceUrls"
            fileMediatype="image"
            limit="10"
            mode="grid"
            :imageStyles="{ width: '150rpx', height: '150rpx' }"
          />
        </view>
        <view class="field">
          <view class="label">审核凭证</view>
          <s-uploader
            v-model:url="checkEvidenceUrls"
            fileMediatype="image"
            limit="1"
            mode="grid"
            :imageStyles="{ width: '150rpx', height: '150rpx' }"
          />
        </view>
      </view>

      <button
        v-if="!blocked && !identityError"
        class="ss-reset-button submit-btn"
        :disabled="submitting"
        @tap="submit"
      >
        {{ submitting ? '提交中' : '提交申请' }}
      </button>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, reactive, ref, watch } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import test from '@/sheep/helper/test';
  import { DeltaAuditStatus } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const submitting = ref(false);
  const checkEvidenceUrls = ref([]);
  const identityError = computed(() => deltaStore.identityError);

  const deviceTypeOptions = [
    { label: '手机', value: 1 },
    { label: '平板', value: 2 },
    { label: 'PC', value: 3 },
  ];

  const form = reactive({
    realName: '',
    phone: '',
    gameUid: '',
    deviceType: 1,
    introduction: '',
    experience: '',
    evidenceUrls: [],
    checkEvidenceUrl: '',
  });

  const blocked = computed(() => {
    const status = Number(
      deltaStore.identity?.auditStatus ?? deltaStore.application?.applicationStatus,
    );
    return (
      status === DeltaAuditStatus.APPROVED ||
      status === DeltaAuditStatus.DISABLED ||
      status === DeltaAuditStatus.BLACKLISTED
    );
  });

  const blockReason = computed(() => {
    if (Number(deltaStore.identity?.auditStatus) === DeltaAuditStatus.APPROVED) {
      return '你已通过审核，无需重复提交申请。';
    }
    return deltaStore.identity?.rejectReason || deltaStore.statusInfo.desc;
  });

  watch(
    checkEvidenceUrls,
    (value) => {
      form.checkEvidenceUrl = Array.isArray(value) ? value[0] || '' : value || '';
    },
    { deep: true },
  );

  function onDeviceTypeChange(event) {
    form.deviceType = Number(event.detail.value);
  }

  function fillApplication(data = {}) {
    form.realName = data.realName || '';
    form.phone = data.phone || '';
    form.gameUid = data.gameUid || '';
    form.deviceType = data.deviceType || 1;
    form.introduction = data.introduction || '';
    form.experience = data.experience || '';
  }

  function validateForm() {
    if (!form.realName) {
      sheep.$helper.toast('请输入真实姓名');
      return false;
    }
    if (!test.mobile(form.phone)) {
      sheep.$helper.toast('请输入正确的手机号');
      return false;
    }
    if (!form.gameUid) {
      sheep.$helper.toast('请输入游戏 UID');
      return false;
    }
    if (!form.deviceType) {
      sheep.$helper.toast('请选择设备类型');
      return false;
    }
    return true;
  }

  async function submit() {
    if (submitting.value || !validateForm()) {
      return;
    }
    submitting.value = true;
    const res = await deltaStore.submitWorkerApply({ ...form });
    submitting.value = false;
    if (res?.code === 0) {
      sheep.$router.redirect('/pages-worker/apply/status');
    }
  }

  async function loadApplyContext() {
    const identityRes = await deltaStore.fetchWorkerIdentity({ force: true, showError: false });
    if (identityRes?.code !== 0) {
      return;
    }
    const res = await deltaStore.fetchWorkerApplication({ showError: false });
    if (res?.code === 0) {
      fillApplication(res.data);
    }
  }

  onShow(loadApplyContext);
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
    line-height: 48rpx;
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

  .radio-group {
    display: flex;
    flex-wrap: wrap;
  }

  .radio-item {
    display: flex;
    align-items: center;
    margin-right: 28rpx;
    color: #343842;
    font-size: 26rpx;
    line-height: 40rpx;
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

  .retry-btn {
    width: 100%;
    height: 72rpx;
    margin-top: 24rpx;
    border-radius: 999rpx;
    background: #e60012;
    color: #ffffff;
    font-size: 26rpx;
    line-height: 72rpx;
    font-weight: 800;
  }
</style>
