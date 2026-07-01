<template>
  <s-layout title="可抢挂牌" :bgStyle="{ color: '#f4f6f8' }">
    <view class="list-page">
      <view v-if="state.error" class="error-card">
        <text>{{ state.error }}</text>
        <text class="retry" @tap="loadPage(true)">重试</text>
      </view>
      <market-card v-for="item in state.list" :key="item.id" :item="item" @tap="goDetail">
        <template #action>
          <view class="card-action">查看详情</view>
        </template>
      </market-card>
      <s-empty
        v-if="!state.loading && !state.error && state.list.length === 0"
        text="暂无可抢挂牌"
      />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>
    <club-tabbar :active="DeltaRoute.CLUB_MARKET" />
  </s-layout>
</template>

<script setup>
  import { reactive } from 'vue';
  import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import OrderMarketApi from '@/sheep/api/delta/orderMarket';
  import ClubTabbar from '../../components/club-tabbar.vue';
  import MarketCard from '../components/market-card.vue';
  import { DeltaRoute } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const state = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    loading: false,
    loadStatus: 'more',
    error: '',
  });

  async function loadPage(reset = false) {
    if (state.loading) return;
    if (reset) {
      state.pageNo = 1;
      state.list = [];
      state.total = 0;
      state.loadStatus = 'more';
    }
    const requestedPage = state.pageNo;
    state.loading = true;
    state.error = '';
    state.loadStatus = 'loading';
    try {
      const res = await OrderMarketApi.getAvailablePage(
        { pageNo: requestedPage, pageSize: state.pageSize },
        { showError: false },
      );
      if (res?.code === 0) {
        const list = Array.isArray(res.data?.list) ? res.data.list : [];
        state.total = Number(res.data?.total || 0);
        state.list = reset ? list : state.list.concat(list);
        state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
      } else {
        state.error = res?.msg || '加载失败，请重试';
        if (requestedPage > 1) state.pageNo = requestedPage - 1;
        state.loadStatus = state.list.length ? 'more' : 'noMore';
      }
    } catch (error) {
      state.error = error?.msg || error?.message || '加载失败，请重试';
      if (requestedPage > 1) state.pageNo = requestedPage - 1;
      state.loadStatus = state.list.length ? 'more' : 'noMore';
    } finally {
      state.loading = false;
      uni.stopPullDownRefresh();
    }
  }

  function loadMore() {
    if (state.loading || state.loadStatus !== 'more') return;
    state.pageNo += 1;
    loadPage();
  }

  function goDetail(item) {
    sheep.$router.go(DeltaRoute.CLUB_MARKET_DETAIL, { id: item.id });
  }

  async function initialize() {
    const allowed = await deltaStore.guardClubMarketPage({ requireServiceScope: true });
    if (allowed) await loadPage(true);
    else uni.stopPullDownRefresh();
  }

  onShow(initialize);
  onPullDownRefresh(initialize);
  onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
  .list-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 0;
    box-sizing: border-box;
    background: #f4f6f8;
  }
  .error-card {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20rpx;
    padding: 22rpx;
    border-radius: 14rpx;
    color: #7f8590;
    background: #ffffff;
    font-size: 24rpx;
  }
  .retry,
  .card-action {
    color: #e60012;
  }
  .card-action {
    margin-top: 18rpx;
    padding-top: 18rpx;
    border-top: 1rpx solid #f0f1f3;
    font-size: 25rpx;
    text-align: right;
    font-weight: 800;
  }
</style>
