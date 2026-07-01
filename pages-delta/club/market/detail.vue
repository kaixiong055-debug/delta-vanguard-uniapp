<template>
  <s-layout title="挂牌详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="detail-page">
      <view v-if="loadError" class="error-card">
        <view>{{ loadError }}</view>
        <button class="ss-reset-button retry-btn" @tap="loadDetail">重试</button>
      </view>
      <market-card v-else-if="listing" :item="listing">
        <template #action>
          <button class="ss-reset-button claim-btn" :disabled="claiming" @tap.stop="confirmClaim">
            {{ claiming ? '提交中' : '确认抢单' }}
          </button>
        </template>
      </market-card>
    </view>
  </s-layout>
</template>

<script setup>
  import { ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import OrderMarketApi from '@/sheep/api/delta/orderMarket';
  import MarketCard from '../components/market-card.vue';
  import { DeltaRoute } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const listingId = ref(null);
  const listing = ref(null);
  const loadError = ref('');
  const claiming = ref(false);

  onLoad((options) => {
    const id = Number(options?.id);
    if (Number.isInteger(id) && id > 0) listingId.value = id;
    else loadError.value = '挂牌参数无效';
  });

  function askClaim() {
    return new Promise((resolve) => {
      uni.showModal({
        title: '确认抢单',
        content: '抢单成功后可在“我的已接挂牌”中查看，是否继续？',
        success: ({ confirm }) => resolve(confirm),
        fail: () => resolve(false),
      });
    });
  }

  async function loadDetail() {
    if (!listingId.value) {
      loadError.value = '挂牌参数无效';
      return;
    }
    loadError.value = '';
    const allowed = await deltaStore.guardClubMarketPage({ requireServiceScope: true });
    if (!allowed) return;
    try {
      const res = await OrderMarketApi.getAvailableDetail(listingId.value, { showError: false });
      if (res?.code === 0) listing.value = res.data || null;
      else loadError.value = res?.msg || '挂牌详情加载失败';
    } catch (error) {
      loadError.value = error?.msg || error?.message || '挂牌详情加载失败';
    }
  }

  async function confirmClaim() {
    if (claiming.value) return;
    const allowed = await deltaStore.guardClubMarketPage({ requireServiceScope: true });
    if (!allowed || !(await askClaim())) return;
    claiming.value = true;
    try {
      const res = await OrderMarketApi.claim(listingId.value, { showError: false });
      sheep.$helper.toast(res?.msg || (res?.code === 0 ? '抢单成功' : '抢单失败'));
      if (res?.code === 0) sheep.$router.redirect(DeltaRoute.CLUB_CLAIMED);
    } catch (error) {
      sheep.$helper.toast(error?.msg || error?.message || '抢单失败');
    } finally {
      claiming.value = false;
    }
  }

  onShow(loadDetail);
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
</style>
