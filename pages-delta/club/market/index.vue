<template>
  <s-layout title="可抢挂牌" :bgStyle="{ color: '#f4f6f8' }">
    <view class="list-page">
      <view v-if="state.error" class="error-card">
        <text>{{ state.error }}</text>
        <text class="retry" @tap="initialize">重试</text>
      </view>
      <view v-if="state.pageReady && !state.error">
        <market-card v-for="item in state.list" :key="item.id" :item="item" @tap="goDetail(item)">
          <template #action>
            <view class="card-action">查看详情</view>
          </template>
        </market-card>
        <s-empty
          v-if="
            state.pageReady &&
            !state.initializing &&
            !state.loading &&
            !state.error &&
            state.list.length === 0
          "
          text="暂无可抢挂牌"
        />
        <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
      </view>
    </view>
    <club-tabbar v-if="state.pageReady && !state.initializing" :active="DeltaRoute.CLUB_MARKET" />
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
    pageNo: 0,
    pageSize: 10,
    initializing: false,
    loading: false,
    pageReady: false,
    loadStatus: 'more',
    error: '',
  });

  function normalizeTotal(value) {
    const total = Number(value);
    return Number.isSafeInteger(total) && total >= 0 ? total : 0;
  }

  async function loadPage(pageNo, reset = false) {
    if (state.loading) return false;

    const requestedPage = pageNo;
    state.loading = true;
    state.error = '';

    try {
      const res = await OrderMarketApi.getAvailablePage(
        { pageNo: requestedPage, pageSize: state.pageSize },
        { showError: false },
      );

      if (res?.code !== 0 || !res.data || typeof res.data !== 'object' || Array.isArray(res.data)) {
        if (requestedPage === 1) {
          state.list = [];
          state.total = 0;
          state.pageNo = 0;
          state.pageReady = false;
          state.loadStatus = 'more';
          state.error = res?.msg || '加载失败，请重试';
        } else {
          state.loadStatus = 'more';
          sheep.$helper.toast(res?.msg || '加载更多失败，请重试');
        }
        return false;
      }

      const rawList = Array.isArray(res.data.list) ? res.data.list : [];
      const list = rawList.filter(
        (item) => item !== null && typeof item === 'object' && !Array.isArray(item),
      );
      state.total = normalizeTotal(res.data.total);

      if (reset) {
        state.list = list;
      } else {
        state.list = state.list.concat(list);
      }
      state.pageNo = requestedPage;

      if (requestedPage === 1) {
        state.pageReady = true;
        state.error = '';
      }

      if (list.length === 0) {
        state.loadStatus = 'noMore';
      } else {
        const listLen = Array.isArray(state.list) ? state.list.length : 0;
        state.loadStatus = listLen < state.total ? 'more' : 'noMore';
      }
      return true;
    } catch (pageError) {
      if (requestedPage === 1) {
        state.list = [];
        state.total = 0;
        state.pageNo = 0;
        state.pageReady = false;
        state.loadStatus = 'more';
        state.error = pageError?.msg || pageError?.message || '加载失败，请重试';
      } else {
        state.loadStatus = 'more';
        sheep.$helper.toast(pageError?.msg || pageError?.message || '加载更多失败，请重试');
      }
      return false;
    } finally {
      state.loading = false;
    }
  }

  function loadMore() {
    if (!state.pageReady || state.initializing || state.loading || state.loadStatus !== 'more')
      return;
    loadPage(state.pageNo + 1);
  }

  function goDetail(item) {
    if (!state.pageReady || state.initializing || state.loading) return;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      sheep.$helper.toast('挂牌信息不存在');
      return;
    }
    const idStr = String(item.id ?? '');
    if (!/^\d+$/.test(idStr) || idStr === '0' || idStr === '') {
      sheep.$helper.toast('挂牌信息不存在');
      return;
    }
    sheep.$router.go(DeltaRoute.CLUB_MARKET_DETAIL, { id: idStr });
  }

  async function initialize() {
    if (state.initializing || state.loading) return;

    state.initializing = true;
    state.pageReady = false;
    state.error = '';
    state.list = [];
    state.total = 0;
    state.pageNo = 0;
    state.loadStatus = 'more';

    try {
      const allowed = await deltaStore.guardClubMarketPage({
        requireServiceScope: true,
      });

      if (!allowed) return;

      await loadPage(1, true);
    } catch (initError) {
      state.error = initError?.msg || initError?.message || '初始化失败，请重试';
    } finally {
      state.initializing = false;
      uni.stopPullDownRefresh();
    }
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
