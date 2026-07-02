<template>
  <s-layout title="挂牌详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="detail-page">
      <view v-if="loadError" class="error-card">
        <view>{{ loadError }}</view>
        <button
          class="ss-reset-button retry-btn"
          :disabled="loading || claiming"
          @tap="loadDetail()"
        >
          {{ loading ? '加载中' : '重试' }}
        </button>
      </view>
      <view v-else-if="listing">
        <view v-if="notClaimableReason" class="warning-card">
          {{ notClaimableReason }}
        </view>
        <market-card :item="listing">
          <template #action>
            <button
              v-if="canClaim"
              class="ss-reset-button claim-btn"
              :disabled="loading || claiming || !canClaim"
              @tap.stop="confirmClaim"
            >
              {{ claiming ? '提交中' : '确认抢单' }}
            </button>
          </template>
        </market-card>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import OrderMarketApi from '@/sheep/api/delta/orderMarket';
  import MarketCard from '../components/market-card.vue';
  import { DeltaRoute } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const listingId = ref('');
  const listing = ref(null);
  const loading = ref(false);
  const pageReady = ref(false);
  const loadError = ref('');
  const claiming = ref(false);
  const notClaimableReason = ref('');

  const canClaim = computed(
    () => pageReady.value && listing.value && Number(listing.value.listingStatus) === 0,
  );

  function normalizeListingId(value) {
    const id = String(value ?? '').trim();
    return /^\d+$/.test(id) && id !== '0' ? id : '';
  }

  onLoad((options) => {
    listingId.value = normalizeListingId(options?.id);
  });

  function askClaim() {
    return new Promise((resolve) => {
      uni.showModal({
        title: '确认抢单',
        content: '抢单成功后可在"我的已接挂牌"中查看，是否继续？',
        success: ({ confirm }) => resolve(confirm),
        fail: () => resolve(false),
      });
    });
  }

  async function loadDetail({ skipClaimingLock = false } = {}) {
    if (!listingId.value) {
      loadError.value = '挂牌参数无效';
      pageReady.value = false;
      listing.value = null;
      notClaimableReason.value = '';
      return false;
    }

    if (loading.value || (!skipClaimingLock && claiming.value)) return false;

    loading.value = true;
    pageReady.value = false;
    loadError.value = '';
    listing.value = null;
    notClaimableReason.value = '';

    try {
      const allowed = await deltaStore.guardClubMarketPage({
        requireServiceScope: true,
      });

      if (!allowed) return false;

      const res = await OrderMarketApi.getAvailableDetail(listingId.value, {
        showError: false,
      });

      if (res?.code !== 0 || !res.data || typeof res.data !== 'object' || Array.isArray(res.data)) {
        loadError.value = res?.msg || '挂牌详情加载失败，请重试';
        listing.value = null;
        pageReady.value = false;
        notClaimableReason.value = '';
        return false;
      }

      const detail = res.data;
      const status = Number(detail.listingStatus);

      if (status === 0) {
        listing.value = detail;
        pageReady.value = true;
        loadError.value = '';
        notClaimableReason.value = '';
        return true;
      }

      if ([1, 2, 3, 4].includes(status)) {
        listing.value = detail;
        pageReady.value = true;
        loadError.value = '';
        notClaimableReason.value = '当前挂牌已不可抢，请返回列表刷新';
        return true;
      }

      loadError.value = '挂牌状态异常，请刷新重试';
      listing.value = null;
      pageReady.value = false;
      notClaimableReason.value = '';
      return false;
    } catch (loadErr) {
      loadError.value = loadErr?.msg || loadErr?.message || '挂牌详情加载失败，请重试';
      listing.value = null;
      pageReady.value = false;
      notClaimableReason.value = '';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function confirmClaim() {
    if (loading.value || claiming.value || !pageReady.value || !canClaim.value) return;

    claiming.value = true;

    try {
      const allowed = await deltaStore.guardClubMarketPage({
        requireServiceScope: true,
      });

      if (!allowed) return;

      const detailRes = await OrderMarketApi.getAvailableDetail(listingId.value, {
        showError: false,
      });

      if (
        detailRes?.code !== 0 ||
        !detailRes.data ||
        typeof detailRes.data !== 'object' ||
        Array.isArray(detailRes.data)
      ) {
        sheep.$helper.toast(detailRes?.msg || '挂牌状态查询失败，请重试');
        await loadDetail({ skipClaimingLock: true });
        return;
      }

      const latestStatus = Number(detailRes.data.listingStatus);
      if (latestStatus !== 0) {
        listing.value = detailRes.data;
        pageReady.value = true;
        loadError.value = '';
        notClaimableReason.value = '当前挂牌已不可抢，请返回列表刷新';
        return;
      }

      listing.value = detailRes.data;
      pageReady.value = true;
      loadError.value = '';
      notClaimableReason.value = '';

      if (!(await askClaim())) return;

      const res = await OrderMarketApi.claim(listingId.value, {
        showError: false,
      });

      if (res?.code === 0) {
        sheep.$helper.toast('抢单成功');
        sheep.$router.redirect(DeltaRoute.CLUB_CLAIMED);
        return;
      }

      sheep.$helper.toast(res?.msg || '抢单失败，请重试');
      await loadDetail({ skipClaimingLock: true });
    } catch (claimError) {
      sheep.$helper.toast(claimError?.msg || claimError?.message || '抢单失败，请稍后重试');
      await loadDetail({ skipClaimingLock: true });
    } finally {
      claiming.value = false;
    }
  }

  onShow(() => loadDetail());
</script>

<style lang="scss" scoped>
  .detail-page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }
  .error-card {
    padding: 26rpx;
    border-radius: 18rpx;
    color: #7f8590;
    background: #ffffff;
    font-size: 25rpx;
    line-height: 38rpx;
  }
  .claim-btn,
  .retry-btn {
    width: 100%;
    height: 78rpx;
    margin-top: 24rpx;
    border-radius: 999rpx;
    color: #ffffff;
    background: #e60012;
    font-size: 27rpx;
    line-height: 78rpx;
    font-weight: 800;
  }
  .claim-btn[disabled] {
    opacity: 0.6;
  }
  .warning-card {
    margin-bottom: 20rpx;
    padding: 22rpx;
    border-radius: 14rpx;
    color: #856404;
    background: #fff3cd;
    font-size: 24rpx;
    line-height: 36rpx;
  }
</style>
