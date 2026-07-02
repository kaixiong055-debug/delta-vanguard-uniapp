<template>
  <s-layout title="打手申请" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view v-if="contextError" class="error-card">
        <text>{{ contextError }}</text>
        <text class="retry" @tap="loadApplyContext">重试</text>
      </view>

      <view v-else-if="isPending" class="notice-card">
        <view class="notice-title">申请审核中</view>
        <view class="notice-desc">平台正在审核你的打手申请，请勿重复提交。</view>
        <button
          class="ss-reset-button retry-btn"
          @tap="sheep.$router.go('/pages-worker/apply/status')"
        >
          查看申请状态
        </button>
      </view>

      <view v-else-if="isBlocked" class="notice-card">
        <view class="notice-title">{{ blockTitle }}</view>
        <view class="notice-desc">{{ blockReason }}</view>
      </view>

      <view v-if="pageReady && canSubmitApplication" class="form-card">
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
        v-if="pageReady && canSubmitApplication && !contextError"
        class="ss-reset-button submit-btn"
        :disabled="loading || checking || submitting"
        @tap="submit"
      >
        {{ submitting ? '提交中' : '提交申请' }}
      </button>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, reactive, ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import test from '@/sheep/helper/test';
  import { DeltaAuditStatus } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');

  const loading = ref(false);
  const contextError = ref('');
  const pageReady = ref(false);
  const initialized = ref(false);
  const checking = ref(false);
  const submitting = ref(false);

  const checkEvidenceUrls = ref([]);

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
  });

  const STATUS_ANOMALY = -1;

  const validAuditStatuses = Object.values(DeltaAuditStatus);

  function normalizeAuditStatus(value) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const status = Number(value);

    return validAuditStatuses.includes(status) ? status : STATUS_ANOMALY;
  }

  const currentAuditStatus = computed(() => {
    const identityStatus = normalizeAuditStatus(deltaStore.identity?.auditStatus);

    if (identityStatus === STATUS_ANOMALY) return STATUS_ANOMALY;

    if (
      identityStatus === DeltaAuditStatus.APPROVED ||
      identityStatus === DeltaAuditStatus.DISABLED ||
      identityStatus === DeltaAuditStatus.BLACKLISTED
    ) {
      return identityStatus;
    }

    const appStatus = normalizeAuditStatus(
      deltaStore.application?.applicationStatus ?? deltaStore.identity?.applicationStatus,
    );

    if (appStatus === STATUS_ANOMALY) return STATUS_ANOMALY;

    return appStatus ?? DeltaAuditStatus.NOT_APPLIED;
  });

  const isPending = computed(() => currentAuditStatus.value === DeltaAuditStatus.PENDING);

  const isBlocked = computed(() =>
    [DeltaAuditStatus.APPROVED, DeltaAuditStatus.DISABLED, DeltaAuditStatus.BLACKLISTED].includes(
      currentAuditStatus.value,
    ),
  );

  const canSubmitApplication = computed(() =>
    [DeltaAuditStatus.NOT_APPLIED, DeltaAuditStatus.REJECTED].includes(currentAuditStatus.value),
  );

  const blockTitle = computed(() => {
    if (currentAuditStatus.value === DeltaAuditStatus.APPROVED) {
      return '你已通过审核，无需重复提交申请。';
    }
    return deltaStore.statusInfo.title;
  });

  const blockReason = computed(() => {
    if (currentAuditStatus.value === DeltaAuditStatus.APPROVED) {
      return '';
    }
    return deltaStore.identity?.rejectReason || deltaStore.statusInfo.desc;
  });

  const validDeviceTypes = [1, 2, 3];

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

  function normalizeImageUrls(value, limit = 10) {
    const source = Array.isArray(value) ? value : [value];

    return [...new Set(source.map(normalizeImageUrl).filter(Boolean))].slice(0, limit);
  }

  function normalizeDeviceType(value) {
    const deviceType = Number(value);

    return validDeviceTypes.includes(deviceType) ? deviceType : 1;
  }

  function onDeviceTypeChange(event) {
    form.deviceType = normalizeDeviceType(event.detail.value);
  }

  function fillApplication(data = {}) {
    form.realName = normalizeText(data.realName);
    form.phone = normalizeText(data.phone);
    form.gameUid = normalizeText(data.gameUid);
    form.deviceType = normalizeDeviceType(data.deviceType);
    form.introduction = normalizeText(data.introduction);
    form.experience = normalizeText(data.experience);
    form.evidenceUrls = normalizeImageUrls(data.evidenceUrls, 10);
    checkEvidenceUrls.value = normalizeImageUrls(data.checkEvidenceUrl, 1);
  }

  async function loadApplyContext() {
    if (loading.value || checking.value || submitting.value) {
      return;
    }

    loading.value = true;
    contextError.value = '';
    pageReady.value = false;

    try {
      const identityRes = await deltaStore.fetchWorkerIdentity({
        force: true,
        showError: false,
      });

      if (identityRes?.code !== 0) {
        contextError.value =
          identityRes?.msg || deltaStore.identityError || '身份查询失败，请稍后重试';
        return;
      }

      const applicationRes = await deltaStore.fetchWorkerApplication({
        showError: false,
        showLoading: false,
      });

      if (applicationRes?.code !== 0) {
        contextError.value = applicationRes?.msg || '申请资料加载失败，请重试';
        return;
      }

      const status = currentAuditStatus.value;

      if (status === STATUS_ANOMALY) {
        contextError.value = '申请状态异常，请刷新重试';
        return;
      }

      if (
        status === DeltaAuditStatus.PENDING ||
        status === DeltaAuditStatus.APPROVED ||
        status === DeltaAuditStatus.DISABLED ||
        status === DeltaAuditStatus.BLACKLISTED
      ) {
        pageReady.value = true;
        return;
      }

      if (!initialized.value) {
        const application = applicationRes?.data;

        if (application && typeof application === 'object' && !Array.isArray(application)) {
          fillApplication(application);
        }

        initialized.value = true;
      }

      pageReady.value = true;
    } catch (loadError) {
      contextError.value = loadError?.msg || loadError?.message || '申请资料加载失败，请重试';
    } finally {
      loading.value = false;
    }
  }

  function buildSubmitData() {
    const realName = normalizeText(form.realName);
    const phone = normalizeText(form.phone);
    const gameUid = normalizeText(form.gameUid);
    const deviceType = Number(form.deviceType);
    const introduction = normalizeText(form.introduction);
    const experience = normalizeText(form.experience);
    const evidenceUrls = normalizeImageUrls(form.evidenceUrls, 10);
    const checkEvidenceUrl = normalizeImageUrls(checkEvidenceUrls.value, 1)[0] || '';

    if (!realName) {
      sheep.$helper.toast('真实姓名不能为空');
      return null;
    }

    if (realName.length > 50) {
      sheep.$helper.toast('真实姓名不能超过 50 个字符');
      return null;
    }

    if (!test.mobile(phone)) {
      sheep.$helper.toast('请输入正确的手机号');
      return null;
    }

    if (!gameUid) {
      sheep.$helper.toast('游戏 UID 不能为空');
      return null;
    }

    if (gameUid.length > 100) {
      sheep.$helper.toast('游戏 UID 不能超过 100 个字符');
      return null;
    }

    if (!validDeviceTypes.includes(deviceType)) {
      sheep.$helper.toast('设备类型只能是 1、2、3');
      return null;
    }

    if (introduction.length > 500) {
      sheep.$helper.toast('个人介绍不能超过 500 个字符');
      return null;
    }

    if (experience.length > 500) {
      sheep.$helper.toast('经验描述不能超过 500 个字符');
      return null;
    }

    if (evidenceUrls.length > 10) {
      sheep.$helper.toast('证明材料最多 10 张');
      return null;
    }

    return {
      realName,
      phone,
      gameUid,
      deviceType,
      introduction,
      experience,
      evidenceUrls,
      checkEvidenceUrl,
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
      const identityRes = await deltaStore.fetchWorkerIdentity({
        force: true,
        showError: false,
      });

      if (identityRes?.code !== 0) {
        sheep.$helper.toast(
          identityRes?.msg || deltaStore.identityError || '身份查询失败，请稍后重试',
        );
        return;
      }

      const applicationRes = await deltaStore.fetchWorkerApplication({
        showError: false,
        showLoading: false,
      });

      if (applicationRes?.code !== 0) {
        sheep.$helper.toast(applicationRes?.msg || '申请状态查询失败，请重试');
        return;
      }

      const status = currentAuditStatus.value;

      if (status === STATUS_ANOMALY) {
        sheep.$helper.toast('申请状态异常，请刷新重试');
        return;
      }

      if (![DeltaAuditStatus.NOT_APPLIED, DeltaAuditStatus.REJECTED].includes(status)) {
        sheep.$helper.toast('当前状态不能重复提交申请');
        sheep.$router.redirect('/pages-worker/apply/status');
        return;
      }

      submitting.value = true;

      const res = await deltaStore.submitWorkerApply(data);

      if (res?.code !== 0) {
        sheep.$helper.toast(res?.msg || '申请提交失败，请重试');
        return;
      }

      sheep.$router.redirect('/pages-worker/apply/status');
    } catch (submitError) {
      sheep.$helper.toast(submitError?.msg || submitError?.message || '申请提交失败，请重试');
    } finally {
      checking.value = false;
      submitting.value = false;
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
