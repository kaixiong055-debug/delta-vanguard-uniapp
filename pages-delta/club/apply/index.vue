<template>
  <s-layout title="俱乐部入驻" :bgStyle="{ color: '#f4f6f8' }">
    <view class="form-page">
      <view v-if="contextError" class="error-card">
        <text>{{ contextError }}</text>
        <text class="retry" @tap="loadContext">重试</text>
      </view>

      <view v-if="pageReady && canSubmitApplication" class="form-card">
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
            type="number"
            maxlength="11"
            placeholder="请输入 11 位手机号"
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
  import { reactive, ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import test from '@/sheep/helper/test';
  import { DeltaClubApplicationStatus, DeltaRoute } from '@/sheep/helper/delta';

  const STATUS_ANOMALY = -2;

  const deltaStore = sheep.$store('delta');

  const loading = ref(false);
  const checking = ref(false);
  const submitting = ref(false);
  const pageReady = ref(false);
  const contextError = ref('');
  const initialized = ref(false);

  const logoImages = ref([]);
  const qualificationImages = ref([]);

  const form = reactive({
    clubName: '',
    contactName: '',
    contactMobile: '',
    contactWechat: '',
    description: '',
  });

  const validApplicationStatuses = Object.values(DeltaClubApplicationStatus);

  // ---- normalization helpers ----

  function normalizeText(value) {
    return String(value ?? '').trim();
  }

  function normalizeImageUrl(value) {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) return normalizeImageUrl(value[0]);
    if (value && typeof value === 'object') return String(value.url ?? '').trim();
    return '';
  }

  function normalizeImageUrls(value, limit = 10) {
    const source = Array.isArray(value) ? value : [value];
    return [...new Set(source.map(normalizeImageUrl).filter(Boolean))].slice(0, limit);
  }

  function parseQualificationUrls(value) {
    if (Array.isArray(value)) return value.filter((v) => typeof v === 'string').filter(Boolean);
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((v) => typeof v === 'string').filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  // ---- status computed ----

  const canSubmitApplication = ref(false);

  // ---- form population ----

  function fillApplication(data = {}) {
    form.clubName = normalizeText(data.clubName);
    form.contactName = normalizeText(data.contactName);
    form.contactMobile = normalizeText(data.contactMobile);
    form.contactWechat = normalizeText(data.contactWechat);
    form.description = normalizeText(data.description);
    logoImages.value = data.logoUrl ? [normalizeImageUrl(data.logoUrl)] : [];
    qualificationImages.value = normalizeImageUrls(
      parseQualificationUrls(data.qualificationUrls),
      10,
    );
  }

  // ---- context loading ----

  async function loadContext() {
    if (loading.value || checking.value || submitting.value) {
      return;
    }

    loading.value = true;
    contextError.value = '';
    pageReady.value = false;
    canSubmitApplication.value = false;

    try {
      const identityRes = await deltaStore.fetchClubIdentity({
        force: true,
        showError: false,
      });

      if (
        identityRes?.code !== 0 ||
        !identityRes?.data ||
        typeof identityRes.data !== 'object' ||
        Array.isArray(identityRes.data)
      ) {
        contextError.value =
          identityRes?.msg || deltaStore.clubIdentityError || '俱乐部身份查询失败，请稍后重试';
        return;
      }

      const identity = identityRes.data;

      // already club owner
      if (identity.isClubOwner === true) {
        sheep.$router.redirect(DeltaRoute.CLUB_HOME);
        return;
      }

      // no application
      if (identity.hasApplication !== true) {
        pageReady.value = true;
        canSubmitApplication.value = true;
        return;
      }

      // has application — check status
      const rawStatus = identity.applicationStatus;
      const appStatus = Number(rawStatus);

      // anomaly: hasApplication but applicationStatus is not a valid value
      if (
        rawStatus === undefined ||
        rawStatus === null ||
        rawStatus === '' ||
        !validApplicationStatuses.includes(appStatus)
      ) {
        contextError.value = '申请状态异常，请刷新重试';
        return;
      }

      // PENDING or APPROVED → redirect to status
      if (
        appStatus === DeltaClubApplicationStatus.PENDING ||
        appStatus === DeltaClubApplicationStatus.APPROVED
      ) {
        sheep.$router.redirect(DeltaRoute.CLUB_APPLY_STATUS);
        return;
      }

      // REJECTED or CANCELED → allow re-apply, load application data
      if (
        appStatus === DeltaClubApplicationStatus.REJECTED ||
        appStatus === DeltaClubApplicationStatus.CANCELED
      ) {
        const applicationRes = await deltaStore.fetchClubApplication({
          showError: false,
          showLoading: false,
        });

        if (
          applicationRes?.code !== 0 ||
          !applicationRes?.data ||
          typeof applicationRes.data !== 'object' ||
          Array.isArray(applicationRes.data)
        ) {
          contextError.value = applicationRes?.msg || '申请资料加载失败，请重试';
          return;
        }

        if (!initialized.value) {
          fillApplication(applicationRes.data);
          initialized.value = true;
        }

        pageReady.value = true;
        canSubmitApplication.value = true;
        return;
      }

      // unknown status (should not reach here due to anomaly check above)
      contextError.value = '申请状态异常，请刷新重试';
    } catch (loadError) {
      contextError.value = loadError?.msg || loadError?.message || '申请资料加载失败，请重试';
    } finally {
      loading.value = false;
    }
  }

  // ---- validation ----

  function buildSubmitData() {
    const clubName = normalizeText(form.clubName);
    const contactName = normalizeText(form.contactName);
    const contactMobile = normalizeText(form.contactMobile);
    const contactWechat = normalizeText(form.contactWechat);
    const description = normalizeText(form.description);

    if (!clubName) {
      sheep.$helper.toast('请输入俱乐部名称');
      return null;
    }
    if (clubName.length > 100) {
      sheep.$helper.toast('俱乐部名称不能超过 100 字');
      return null;
    }

    if (!contactName) {
      sheep.$helper.toast('请输入联系人姓名');
      return null;
    }
    if (contactName.length > 50) {
      sheep.$helper.toast('联系人姓名不能超过 50 字');
      return null;
    }

    if (!test.mobile(contactMobile)) {
      sheep.$helper.toast('请输入正确的手机号');
      return null;
    }

    if (contactWechat.length > 50) {
      sheep.$helper.toast('联系人微信不能超过 50 字');
      return null;
    }

    if (description.length > 2000) {
      sheep.$helper.toast('俱乐部描述不能超过 2000 字');
      return null;
    }

    const logoUrl = normalizeImageUrl(logoImages.value[0]);

    if (logoUrl.length > 500) {
      sheep.$helper.toast('照片地址超过长度限制');
      return null;
    }

    const normalizedQualificationUrls = normalizeImageUrls(qualificationImages.value, 10);

    if (normalizedQualificationUrls.length > 10) {
      sheep.$helper.toast('资质凭证最多 10 张');
      return null;
    }

    const qualificationUrls = JSON.stringify(normalizedQualificationUrls);

    if (qualificationUrls.length > 3000) {
      sheep.$helper.toast('资质凭证信息超过长度限制');
      return null;
    }

    return {
      clubName,
      contactName,
      contactMobile,
      contactWechat,
      description,
      logoUrl,
      qualificationUrls,
    };
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

  async function submit() {
    if (loading.value || checking.value || submitting.value) {
      return;
    }

    const data = buildSubmitData();
    if (!data) return;

    if (!(await askConfirm())) return;

    checking.value = true;

    try {
      // re-fetch latest identity
      const identityRes = await deltaStore.fetchClubIdentity({
        force: true,
        showError: false,
      });

      if (
        identityRes?.code !== 0 ||
        !identityRes?.data ||
        typeof identityRes.data !== 'object' ||
        Array.isArray(identityRes.data)
      ) {
        sheep.$helper.toast(
          identityRes?.msg || deltaStore.clubIdentityError || '身份查询失败，请稍后重试',
        );
        return;
      }

      const identity = identityRes.data;

      // already club owner
      if (identity.isClubOwner === true) {
        sheep.$router.redirect(DeltaRoute.CLUB_HOME);
        return;
      }

      // check latest application status
      if (identity.hasApplication === true) {
        const rawStatus = identity.applicationStatus;
        const appStatus = Number(rawStatus);

        if (
          rawStatus === undefined ||
          rawStatus === null ||
          rawStatus === '' ||
          !validApplicationStatuses.includes(appStatus)
        ) {
          sheep.$helper.toast('申请状态异常，请刷新重试');
          return;
        }

        if (
          appStatus === DeltaClubApplicationStatus.PENDING ||
          appStatus === DeltaClubApplicationStatus.APPROVED
        ) {
          sheep.$router.redirect(DeltaRoute.CLUB_APPLY_STATUS);
          return;
        }

        if (
          appStatus !== DeltaClubApplicationStatus.REJECTED &&
          appStatus !== DeltaClubApplicationStatus.CANCELED
        ) {
          sheep.$helper.toast('申请状态异常，请刷新重试');
          return;
        }
      }

      submitting.value = true;

      const res = await deltaStore.submitClubApplication(data);

      if (res?.code === 0) {
        sheep.$helper.toast('提交成功');
        sheep.$router.redirect(DeltaRoute.CLUB_APPLY_STATUS);
        return;
      }

      sheep.$helper.toast(res?.msg || '提交失败，请重试');
    } catch (submitError) {
      sheep.$helper.toast(submitError?.msg || submitError?.message || '提交失败，请稍后重试');
    } finally {
      checking.value = false;
      submitting.value = false;
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
  .submit-btn {
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
