<template>
  <s-layout title="我的已接挂牌" :bgStyle="{ color: '#f4f6f8' }">
    <view class="list-page">
      <view v-if="state.error" class="error-card">
        <text>{{ state.error }}</text>
        <text class="retry" @tap="loadPage(true)">重试</text>
      </view>

      <view
        v-for="item in state.list"
        :key="item.listingId"
        class="order-card"
        @tap="goDetail(item)"
      >
        <view class="card-head">
          <view>
            <view class="card-title">{{ item.serviceTypeName || '俱乐部履约订单' }}</view>
            <view class="order-no">{{ item.serviceOrderNo || item.listingNo || '-' }}</view>
          </view>
          <view class="status">{{ item.orderStatusName || getServiceOrderStatusText(item.orderStatus) }}</view>
        </view>

        <view class="amount">{{ formatDeltaAmount(item.serviceAmount) }}</view>

        <view class="summary">{{ item.requirementSummary || '暂无需求摘要' }}</view>

        <view class="info-row">
          <text>设备</text>
          <text>{{ item.deviceTypeName || getDeviceTypeText(item.deviceType) }}</text>
        </view>
        <view class="info-row">
          <text>当前打手</text>
          <text :class="{ pending: !item.assignedWorkerId }">
            {{ item.assignedWorkerDisplayName || '待分派' }}
          </text>
        </view>
        <view class="info-row">
          <text>接单时间</text>
          <text>{{ formatDeltaTime(item.claimTime) }}</text>
        </view>

        <view class="card-action">
          <text>{{ item.assignedWorkerId ? '查看履约详情' : '去分派打手' }}</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <s-empty
        v-if="!state.loading && !state.error && state.list.length === 0"
        text="暂无已接挂牌"
      />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>

    <club-tabbar :active="DeltaRoute.CLUB_CLAIMED" />
  </s-layout>
</template>

<script setup>
  import { reactive } from 'vue';
  import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ClubOrderApi from '@/sheep/api/delta/clubOrder';
  import ClubTabbar from '../../components/club-tabbar.vue';
  import {
    DeltaRoute,
    formatDeltaAmount,
    formatDeltaTime,
    getDeviceTypeText,
    getServiceOrderStatusText,
  } from '@/sheep/helper/delta';

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
      const res = await ClubOrderApi.getPage(
        { pageNo: requestedPage, pageSize: state.pageSize },
        { showError: false },
      );

      if (res?.code === 0) {
        const list = Array.isArray(res.data?.list) ? res.data.list : [];
        state.total = Number(res.data?.total || 0);
        state.list = reset ? list : state.list.concat(list);
        state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
      } else {
        state.error = res?.msg || '俱乐部订单加载失败';
        if (requestedPage > 1) state.pageNo = requestedPage - 1;
        state.loadStatus = state.list.length ? 'more' : 'noMore';
      }
    } catch (error) {
      state.error = error?.msg || error?.message || '俱乐部订单加载失败';
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
    if (!item?.listingId) {
      sheep.$helper.toast('挂牌信息不存在');
      return;
    }
    sheep.$router.go(DeltaRoute.CLUB_ORDER_DETAIL, { listingId: item.listingId });
  }

  async function initialize() {
    const allowed = await deltaStore.guardClubMarketPage({ requireServiceScope: false });
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
    padding: 24rpx 24rpx 150rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .order-card,
  .error-card {
    margin-bottom: 20rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }

  .order-card {
    padding: 26rpx;
  }

  .card-head,
  .info-row,
  .card-action,
  .error-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-head {
    align-items: flex-start;
  }

  .card-title {
    color: #17191f;
    font-size: 30rpx;
    font-weight: 800;
  }

  .order-no {
    margin-top: 6rpx;
    color: #9a9fa8;
    font-size: 22rpx;
  }

  .status {
    max-width: 220rpx;
    padding: 6rpx 14rpx;
    border-radius: 999rpx;
    color: #e60012;
    background: #fff0f1;
    font-size: 22rpx;
    text-align: center;
  }

  .amount {
    margin-top: 20rpx;
    color: #e60012;
    font-size: 34rpx;
    font-weight: 800;
  }

  .summary {
    margin: 16rpx 0;
    padding: 18rpx;
    border-radius: 12rpx;
    color: #50555f;
    background: #f6f7f9;
    font-size: 25rpx;
    line-height: 38rpx;
  }

  .info-row {
    margin-top: 12rpx;
    color: #8c929d;
    font-size: 23rpx;
  }

  .info-row text:last-child {
    max-width: 420rpx;
    color: #454a54;
    text-align: right;
  }

  .info-row .pending {
    color: #e60012;
    font-weight: 700;
  }

  .card-action {
    margin-top: 22rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f1f3;
    color: #e60012;
    font-size: 25rpx;
    font-weight: 700;
  }

  .arrow {
    font-size: 38rpx;
    line-height: 30rpx;
  }

  .error-card {
    padding: 22rpx;
    color: #7f8590;
    font-size: 24rpx;
  }

  .retry {
    color: #e60012;
  }
</style>
