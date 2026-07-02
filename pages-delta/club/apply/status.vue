<template>
  <s-layout title="申请状态" :bgStyle="{ color: '#f4f6f8' }">
    <view class="status-page">
      <view v-if="error" class="error-card">
        <text>{{ error }}</text>
        <text class="retry" @tap="loadStatus">重试</text>
      </view>

      <view v-else-if="pageReady && !hasApplication" class="empty-card">
        <view class="empty-title">尚未提交入驻申请</view>
        <view class="empty-desc">提交资料后，可在这里查看平台审核进度。</view>
        <button
          class="ss-reset-button primary-btn"
          :disabled="loading || actionLoading"
          @tap="goApply"
        >
          去申请
        </button>
      </view>

      <template v-if="pageReady && hasApplication">
        <view class="card status-card">
          <view class="status-name">{{ statusTitle }}</view>
          <view v-if="approvedWithoutProfile" class="approved-tip">
            审核已通过，俱乐部资料正在生成，请稍后刷新
          </view>
          <view v-if="isRejected && rejectReason" class="reason">
            审核原因：{{ rejectReason }}
          </view>
          <view v-if="applicationData.remark" class="reason">
            备注：{{ applicationData.remark }}
          </view>
        </view>

        <view class="card detail-card">
          <view class="row"
            ><text>申请编号</text><text>{{ applicationData.applicationNo || '-' }}</text></view
          >
          <view class="row"
            ><text>俱乐部名称</text><text>{{ applicationData.clubName || '-' }}</text></view
          >
          <view class="row"
            ><text>联系人</text><text>{{ applicationData.contactName || '-' }}</text></view
          >
          <view class="row"
            ><text>联系电话</text><text>{{ applicationData.contactMobile || '-' }}</text></view
          >
          <view class="row"
            ><text>联系人微信</text><text>{{ applicationData.contactWechat || '-' }}</text></view
          >
          <view class="row"
            ><text>提交时间</text
            ><text>{{ formatDeltaTime(applicationData.createTime) }}</text></view
          >
          <view class="row"
            ><text>审核时间</text
            ><text>{{ formatDeltaTime(applicationData.auditTime) }}</text></view
          >
          <view v-if="applicationData.description" class="description">{{
            applicationData.description
          }}</view>
          <image
            v-if="safeLogoUrl"
            class="logo"
            :src="safeLogoUrl"
            mode="aspectFill"
            @tap="preview(safeLogoUrl, [safeLogoUrl])"
          />
          <view v-if="qualificationImages.length" class="images">
            <image
              v-for="url in qualificationImages"
              :key="url"
              class="image"
              :src="url"
              mode="aspectFill"
              @tap="preview(url, qualificationImages)"
            />
          </view>
        </view>

        <button
          v-if="canCancel"
          class="ss-reset-button danger-btn"
          :disabled="loading || actionLoading || canceling"
          @tap="confirmCancel"
        >
          {{ canceling ? '撤销中' : '撤销申请' }}
        </button>
        <button
          v-else-if="canReapply"
          class="ss-reset-button primary-btn"
          :disabled="loading || actionLoading"
          @tap="goApply"
        >
          重新申请
        </button>
        <button
          v-else-if="canEnter"
          class="ss-reset-button primary-btn"
          :disabled="loading || actionLoading"
          @tap="enterClub"
        >
          进入俱乐部
        </button>
        <button
          v-else-if="approvedWithoutProfile"
          class="ss-reset-button primary-btn"
          :disabled="loading || actionLoading"
          @tap="loadStatus"
        >
          刷新状态
        </button>
        <button
          class="ss-reset-button ghost-btn"
          :disabled="loading || actionLoading"
          @tap="loadStatus"
        >
          刷新状态
        </button>
      </template>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import {
    DeltaClubApplicationStatus,
    DeltaRoute,
    formatDeltaTime,
    getClubApplicationStatusInfo,
  } from '@/sheep/helper/delta';

  const STATUS_ANOMALY = -2;

  const deltaStore = sheep.$store('delta');

  const loading = ref(false);
  const error = ref('');
  const pageReady = ref(false);
  const actionLoading = ref(false);
  const canceling = ref(false);

  const identityData = ref({});
  const applicationData = ref({});

  const validApplicationStatuses = Object.values(DeltaClubApplicationStatus);

  // ---- derived ----

  const hasApplication = computed(() => identityData.value.hasApplication === true);
  const appStatus = computed(() => Number(applicationData.value.applicationStatus));
  const statusInfo = computed(() => getClubApplicationStatusInfo(identityData.value));
  const statusTitle = computed(() => {
    const info = getClubApplicationStatusInfo(identityData.value);
    return info.title;
  });

  const rejectReason = computed(() => String(applicationData.value.rejectReason || '').trim());
  const isRejected = computed(() => appStatus.value === DeltaClubApplicationStatus.REJECTED);
  const canCancel = computed(() => appStatus.value === DeltaClubApplicationStatus.PENDING);
  const canReapply = computed(
    () =>
      appStatus.value === DeltaClubApplicationStatus.REJECTED ||
      appStatus.value === DeltaClubApplicationStatus.CANCELED,
  );
  const canEnter = computed(
    () =>
      appStatus.value === DeltaClubApplicationStatus.APPROVED &&
      identityData.value.isClubOwner === true,
  );
  const approvedWithoutProfile = computed(
    () =>
      appStatus.value === DeltaClubApplicationStatus.APPROVED &&
      identityData.value.isClubOwner !== true,
  );

  // ---- image safety ----

  function safeString(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  const safeLogoUrl = computed(() => safeString(applicationData.value.logoUrl));

  function parseImageUrls(value) {
    if (Array.isArray(value)) return value.filter((v) => typeof v === 'string' && v).slice(0, 10);
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((v) => typeof v === 'string' && v).slice(0, 10)
        : [];
    } catch {
      return [];
    }
  }

  const qualificationImages = computed(() =>
    parseImageUrls(applicationData.value.qualificationUrls),
  );

  function preview(current, urls) {
    if (!current || typeof current !== 'string') return;
    const safeUrls = Array.isArray(urls) ? urls.filter((v) => typeof v === 'string') : [];
    if (!safeUrls.length) return;
    uni.previewImage({ current, urls: safeUrls });
  }

  // ---- actions ----

  function askCancel() {
    return new Promise((resolve) => {
      uni.showModal({
        title: '确认撤销',
        content: '撤销后如需入驻，需要重新提交申请。',
        success: ({ confirm }) => resolve(confirm),
        fail: () => resolve(false),
      });
    });
  }

  async function loadStatus() {
    if (loading.value) return false;

    loading.value = true;
    error.value = '';
    pageReady.value = false;
    identityData.value = {};
    applicationData.value = {};

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
        error.value =
          identityRes?.msg || deltaStore.clubIdentityError || '身份查询失败，请稍后重试';
        return false;
      }

      identityData.value = identityRes.data;

      if (!hasApplication.value) {
        pageReady.value = true;
        return true;
      }

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
        error.value = applicationRes?.msg || '申请详情加载失败，请重试';
        return false;
      }

      applicationData.value = applicationRes.data;

      // validate applicationStatus
      const rawStatus = applicationData.value.applicationStatus;
      const status = Number(rawStatus);

      if (
        rawStatus === undefined ||
        rawStatus === null ||
        rawStatus === '' ||
        !validApplicationStatuses.includes(status)
      ) {
        error.value = '申请状态异常，请刷新重试';
        return false;
      }

      pageReady.value = true;
      return true;
    } catch (loadError) {
      error.value = loadError?.msg || loadError?.message || '申请状态查询失败，请重试';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function confirmCancel() {
    if (loading.value || actionLoading.value || canceling.value) return;

    if (!(await askCancel())) return;

    canceling.value = true;

    try {
      // re-check latest status before cancel
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
        sheep.$helper.toast(identityRes?.msg || '身份查询失败，请稍后重试');
        return;
      }

      identityData.value = identityRes.data;

      if (!hasApplication.value || appStatus.value !== DeltaClubApplicationStatus.PENDING) {
        sheep.$helper.toast('当前状态不能撤销申请');
        await loadStatus();
        return;
      }

      const res = await deltaStore.cancelClubApplication();

      if (res?.code === 0) {
        sheep.$helper.toast('撤销成功');
        await loadStatus();
        return;
      }

      sheep.$helper.toast(res?.msg || '撤销失败，请重试');
    } catch (cancelError) {
      sheep.$helper.toast(cancelError?.msg || cancelError?.message || '撤销失败，请稍后重试');
    } finally {
      canceling.value = false;
    }
  }

  async function goApply() {
    if (loading.value || actionLoading.value) return;

    actionLoading.value = true;

    try {
      const refreshed = await loadStatus();
      if (!refreshed) return;

      // navigate to apply page only if status allows
      if (!hasApplication.value || canReapply.value) {
        sheep.$router.go(DeltaRoute.CLUB_APPLY);
        return;
      }

      // if status changed to PENDING/APPROVED, stay on status page with latest data
      if (
        appStatus.value === DeltaClubApplicationStatus.PENDING ||
        appStatus.value === DeltaClubApplicationStatus.APPROVED
      ) {
        return;
      }

      // if became club owner
      if (identityData.value.isClubOwner === true) {
        deltaStore.enterClubMode();
        return;
      }

      // fallback
      sheep.$router.go(DeltaRoute.CLUB_APPLY);
    } finally {
      actionLoading.value = false;
    }
  }

  async function enterClub() {
    if (loading.value || actionLoading.value) return;

    actionLoading.value = true;

    try {
      await deltaStore.enterClubMode();
    } catch (enterError) {
      sheep.$helper.toast(enterError?.msg || enterError?.message || '进入俱乐部失败，请重试');
    } finally {
      actionLoading.value = false;
    }
  }

  onShow(loadStatus);
</script>

<style lang="scss" scoped>
  .status-page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }
  .card,
  .empty-card {
    margin-bottom: 20rpx;
    padding: 26rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }
  .status-name,
  .empty-title {
    color: #17191f;
    font-size: 34rpx;
    font-weight: 800;
  }
  .empty-desc {
    margin-top: 12rpx;
    color: #7f8590;
    font-size: 25rpx;
    line-height: 40rpx;
  }
  .reason,
  .approved-tip {
    margin-top: 12rpx;
    color: #7f8590;
    font-size: 25rpx;
    line-height: 40rpx;
  }
  .approved-tip {
    color: #e60012;
  }
  .row {
    display: flex;
    justify-content: space-between;
    padding: 18rpx 0;
    border-bottom: 1rpx solid #f0f1f3;
    color: #252932;
    font-size: 25rpx;
  }
  .row text:first-child {
    color: #8c929d;
  }
  .description {
    margin-top: 20rpx;
    color: #50555f;
    font-size: 25rpx;
    line-height: 40rpx;
  }
  .logo,
  .image {
    width: 150rpx;
    height: 150rpx;
    margin: 20rpx 16rpx 0 0;
    border-radius: 14rpx;
  }
  .images {
    display: flex;
    flex-wrap: wrap;
  }
  .primary-btn,
  .danger-btn,
  .ghost-btn {
    width: 100%;
    height: 82rpx;
    margin-top: 24rpx;
    border-radius: 999rpx;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }
  .primary-btn {
    color: #ffffff;
    background: #e60012;
  }
  .danger-btn {
    color: #e60012;
    background: #fff0f1;
  }
  .ghost-btn {
    color: #343842;
    background: #ffffff;
  }
  .primary-btn[disabled],
  .danger-btn[disabled],
  .ghost-btn[disabled] {
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
