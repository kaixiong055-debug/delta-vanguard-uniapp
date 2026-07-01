<template>
  <view class="delta-entry" @tap="handleTap">
    <view class="entry-main">
      <view class="entry-icon">俱</view>
      <view class="entry-text">
        <view class="entry-title">俱乐部中心</view>
        <view class="entry-desc">{{ entryDesc }}</view>
      </view>
    </view>
    <view class="entry-action">{{ entryAction }}</view>
  </view>
</template>

<script setup>
  import { computed, ref, watch } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import { showAuthModal } from '@/sheep/hooks/useModal';

  const userStore = sheep.$store('user');
  const deltaStore = sheep.$store('delta');
  const waitLoginThenEnter = ref(false);

  const isLogin = computed(() => userStore.isLogin);
  const entryAction = computed(() => {
    if (!isLogin.value) return '去登录';
    if (deltaStore.clubIdentityError) return '重试';
    return deltaStore.clubStatusInfo.entryText;
  });
  const entryDesc = computed(() => {
    if (!isLogin.value) return '登录后可申请入驻俱乐部';
    if (deltaStore.clubIdentityError) return '身份查询失败，点击重试';
    return deltaStore.clubStatusInfo.desc;
  });

  async function refreshIdentity() {
    if (isLogin.value) await deltaStore.fetchClubIdentity({ showError: false });
  }

  async function handleTap() {
    if (!isLogin.value) {
      waitLoginThenEnter.value = true;
      showAuthModal();
      return;
    }
    await deltaStore.enterClubMode();
  }

  watch(isLogin, (value) => {
    if (value && waitLoginThenEnter.value) {
      waitLoginThenEnter.value = false;
      handleTap();
    }
  });

  onShow(refreshIdentity);
</script>

<style lang="scss" scoped>
  .delta-entry {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 20rpx 24rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: #ffffff;
    box-shadow: 0 8rpx 24rpx rgba(17, 17, 17, 0.04);
  }

  .entry-main {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  .entry-icon {
    width: 72rpx;
    height: 72rpx;
    flex-shrink: 0;
    border-radius: 18rpx;
    color: #ffffff;
    background: #e60012;
    font-size: 30rpx;
    line-height: 72rpx;
    text-align: center;
    font-weight: 800;
  }

  .entry-text {
    flex: 1;
    min-width: 0;
    margin-left: 18rpx;
  }

  .entry-title {
    color: #1d2129;
    font-size: 30rpx;
    line-height: 42rpx;
    font-weight: 800;
  }

  .entry-desc {
    margin-top: 4rpx;
    color: #8a9099;
    font-size: 24rpx;
    line-height: 34rpx;
  }

  .entry-action {
    margin-left: 18rpx;
    padding: 9rpx 18rpx;
    border-radius: 999rpx;
    color: #e60012;
    background: #fff0f1;
    font-size: 23rpx;
    line-height: 32rpx;
    white-space: nowrap;
  }
</style>
