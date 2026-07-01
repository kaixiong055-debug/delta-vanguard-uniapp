<template>
  <s-layout title="申请状态" :bgStyle="{ color: '#f4f6f8' }">
    <view class="status-page">
      <view v-if="loadError" class="card">
        <view class="title">加载失败</view>
        <view class="muted">{{ loadError }}</view>
        <button class="ss-reset-button primary-btn" @tap="loadStatus">重试</button>
      </view>

      <view v-else-if="loaded && !hasApplication" class="card empty-card">
        <view class="title">尚未提交入驻申请</view>
        <view class="muted">提交资料后，可在这里查看平台审核进度。</view>
        <button class="ss-reset-button primary-btn" @tap="goApply">去申请</button>
      </view>

      <block v-else-if="loaded">
        <view class="card status-card">
          <view class="status-name">{{
            application.applicationStatusName || statusInfo.title
          }}</view>
          <view v-if="approvedWithoutProfile" class="approved-tip">
            审核已通过，俱乐部资料正在生成，请稍后刷新
          </view>
          <view v-if="application.rejectReason" class="reason">
            审核原因：{{ application.rejectReason }}
          </view>
          <view v-if="application.remark" class="reason">备注：{{ application.remark }}</view>
        </view>

        <view class="card detail-card">
          <view class="row"
            ><text>申请编号</text><text>{{ application.applicationNo || '-' }}</text></view
          >
          <view class="row"
            ><text>俱乐部名称</text><text>{{ application.clubName || '-' }}</text></view
          >
          <view class="row"
            ><text>联系人</text><text>{{ application.contactName || '-' }}</text></view
          >
          <view class="row"
            ><text>联系电话</text><text>{{ application.contactMobile || '-' }}</text></view
          >
          <view class="row"
            ><text>联系人微信</text><text>{{ application.contactWechat || '-' }}</text></view
          >
          <view class="row"
            ><text>提交时间</text><text>{{ formatDeltaTime(application.createTime) }}</text></view
          >
          <view class="row"
            ><text>审核时间</text><text>{{ formatDeltaTime(application.auditTime) }}</text></view
          >
          <view v-if="application.description" class="description">{{
            application.description
          }}</view>
          <image
            v-if="application.logoUrl"
            class="logo"
            :src="application.logoUrl"
            mode="aspectFill"
            @tap="preview(application.logoUrl, [application.logoUrl])"
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
          :disabled="canceling"
          @tap="confirmCancel"
        >
          {{ canceling ? '撤销中' : '撤销申请' }}
        </button>
        <button v-else-if="canReapply" class="ss-reset-button primary-btn" @tap="goApply">
          重新申请
        </button>
        <button v-else-if="canEnter" class="ss-reset-button primary-btn" @tap="enterClub">
          进入俱乐部
        </button>
        <button
          v-else-if="approvedWithoutProfile"
          class="ss-reset-button primary-btn"
          @tap="loadStatus"
        >
          刷新状态
        </button>
      </block>
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

  const deltaStore = sheep.$store('delta');
  const loaded = ref(false);
  const loadError = ref('');
  const canceling = ref(false);
  const application = computed(() => deltaStore.clubApplication || {});
  const identity = computed(() => deltaStore.clubIdentity || {});
  const hasApplication = computed(() => identity.value.hasApplication === true);
  const status = computed(() => Number(application.value.applicationStatus));
  const statusInfo = computed(() => getClubApplicationStatusInfo(identity.value));
  const qualificationImages = computed(() => parseImageUrls(application.value.qualificationUrls));
  const canCancel = computed(() => status.value === DeltaClubApplicationStatus.PENDING);
  const canReapply = computed(
    () =>
      status.value === DeltaClubApplicationStatus.REJECTED ||
      status.value === DeltaClubApplicationStatus.CANCELED,
  );
  const canEnter = computed(
    () =>
      status.value === DeltaClubApplicationStatus.APPROVED && identity.value.isClubOwner === true,
  );
  const approvedWithoutProfile = computed(
    () =>
      status.value === DeltaClubApplicationStatus.APPROVED && identity.value.isClubOwner !== true,
  );

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

  function preview(current, urls) {
    uni.previewImage({ current, urls });
  }

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

  async function confirmCancel() {
    if (canceling.value || !(await askCancel())) return;
    canceling.value = true;
    try {
      const res = await deltaStore.cancelClubApplication();
      sheep.$helper.toast(res?.msg || (res?.code === 0 ? '撤销成功' : '撤销失败'));
      if (res?.code === 0) await loadStatus();
    } catch (error) {
      sheep.$helper.toast(error?.msg || error?.message || '撤销失败，请稍后重试');
    } finally {
      canceling.value = false;
    }
  }

  async function loadStatus() {
    loaded.value = false;
    loadError.value = '';
    const identityRes = await deltaStore.fetchClubIdentity({ force: true, showError: false });
    if (identityRes?.code !== 0) {
      loadError.value = deltaStore.clubIdentityError || identityRes?.msg || '请稍后重试';
      loaded.value = true;
      return;
    }
    if (deltaStore.clubIdentity?.hasApplication === true) {
      const applicationRes = await deltaStore.fetchClubApplication({ showError: false });
      if (applicationRes?.code !== 0) {
        loadError.value = applicationRes?.msg || '申请详情加载失败';
      }
    } else {
      deltaStore.clubApplication = null;
    }
    loaded.value = true;
  }

  function goApply() {
    sheep.$router.redirect(DeltaRoute.CLUB_APPLY);
  }
  function enterClub() {
    deltaStore.enterClubMode();
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
  .card {
    margin-bottom: 20rpx;
    padding: 26rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }
  .title,
  .status-name {
    color: #17191f;
    font-size: 34rpx;
    font-weight: 800;
  }
  .muted,
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
  .danger-btn {
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
</style>
