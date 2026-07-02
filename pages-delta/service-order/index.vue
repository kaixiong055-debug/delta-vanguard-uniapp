<template>
  <s-layout title="服务订单" :bgStyle="{ color: '#f4f6f8' }">
    <view class="delta-page">
      <scroll-view scroll-x class="tabs" :show-scrollbar="false">
        <view class="tab-row">
          <view
            v-for="item in statusOptions"
            :key="String(item.value)"
            class="tab"
            :class="{ active: state.status === item.value }"
            @tap="changeStatus(item.value)"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>

      <view v-if="state.error" class="error-card">
        {{ state.error }}
        <text @tap="getList(true)">重试</text>
      </view>

      <view
        v-for="item in state.list"
        :key="item.id"
        class="service-card"
        @tap="goDetail(item.id)"
      >
        <view class="card-head">
          <view class="title ss-line-1">{{ item.productName || '服务订单' }}</view>
          <service-status :status="item.status" />
        </view>

        <view class="meta">
          {{ item.serviceOrderNo || '-' }} · 商城单 {{ item.tradeOrderNo || '-' }}
        </view>

        <view class="row">
          <text class="label">类型</text>
          <text class="value">
            {{ item.serviceTypeName || getServiceTypeText(item.serviceType) }} ·
            {{ item.deviceTypeName || getDeviceTypeText(item.deviceType) }}
          </text>
        </view>

        <view class="row">
          <text class="label">规格</text>
          <text class="value ss-line-2">{{ item.skuName || '-' }}</text>
        </view>

        <view
          v-if="Number(item.status) === ServiceOrderStatus.WORKER_SUBMITTED"
          class="accept-tip"
        >
          打手已提交完成，请查看凭证并及时验收
        </view>

        <view class="card-foot">
          <text>{{ formatDeltaTime(item.createTime) }}</text>
          <view>{{ formatDeltaOptionalAmount(item.serviceAmount) }}</view>
        </view>
      </view>

      <s-empty
        v-if="!state.loading && !state.error && state.list.length === 0"
        text="暂无服务订单"
      />
      <uni-load-more
        v-if="state.list.length > 0"
        :status="state.loadStatus"
        @tap="loadMore"
      />
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive } from 'vue';
  import {
    onLoad,
    onPullDownRefresh,
    onReachBottom,
    onShow,
  } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import ServiceStatus from '../components/service-status.vue';
  import {
    ServiceOrderStatus,
    formatDeltaOptionalAmount,
    formatDeltaTime,
    getDeviceTypeText,
    getServiceTypeText,
    serviceOrderStatusMap,
  } from '@/sheep/helper/delta';

  const statusOptions = [
    { label: '全部', value: undefined },
    ...Object.entries(serviceOrderStatusMap).map(([value, label]) => ({
      value: Number(value),
      label,
    })),
  ];

  const validStatuses = statusOptions
    .map((item) => item.value)
    .filter((value) => value !== undefined);

  const state = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    loading: false,
    loadStatus: 'more',
    status: undefined,
    error: '',
  });

  function normalizeStatus(value) {
    if (value === undefined || value === null || value === '') return undefined;
    const status = Number(value);
    return validStatuses.includes(status) ? status : undefined;
  }

  async function getList(reset = false) {
    if (state.loading) return;

    if (reset) {
      state.pageNo = 1;
      state.list = [];
      state.total = 0;
      state.loadStatus = 'more';
      state.error = '';
    }

    const requestedPage = state.pageNo;
    state.loading = true;
    state.error = '';
    state.loadStatus = 'loading';

    try {
      const params = {
        pageNo: requestedPage,
        pageSize: state.pageSize,
      };
      if (state.status !== undefined) params.status = state.status;

      const res = await ServiceOrderApi.getPage(params, { showError: false });

      if (res?.code === 0) {
        const list = Array.isArray(res.data?.list) ? res.data.list : [];
        state.total = Number(res.data?.total || 0);
        state.list = reset ? list : state.list.concat(list);
        state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
      } else {
        state.error = res?.msg || '服务订单加载失败';
        if (!reset && requestedPage > 1) state.pageNo = requestedPage - 1;
        state.loadStatus = state.list.length > 0 ? 'more' : 'noMore';
      }
    } catch (error) {
      state.error = error?.msg || error?.message || '服务订单加载失败';
      if (!reset && requestedPage > 1) state.pageNo = requestedPage - 1;
      state.loadStatus = state.list.length > 0 ? 'more' : 'noMore';
    } finally {
      state.loading = false;
      uni.stopPullDownRefresh();
    }
  }

  async function changeStatus(status) {
    if (state.loading || state.status === status) return;
    state.status = status;
    await getList(true);
  }

  function loadMore() {
    if (state.loadStatus !== 'more' || state.loading) return;
    state.pageNo += 1;
    getList();
  }

  function goDetail(id) {
    sheep.$router.go('/pages-delta/service-order/detail', { id });
  }

  onLoad((options = {}) => {
    state.status = normalizeStatus(options.status);
  });

  onShow(() => getList(true));
  onPullDownRefresh(() => getList(true));
  onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
  .delta-page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .tabs {
    margin-bottom: 18rpx;
    white-space: nowrap;
  }

  .tab-row {
    display: inline-flex;
    padding: 8rpx;
    border-radius: 14rpx;
    background: #ffffff;
  }

  .tab {
    min-width: 128rpx;
    height: 56rpx;
    border-radius: 10rpx;
    color: #777777;
    font-size: 23rpx;
    line-height: 56rpx;
    text-align: center;
  }

  .tab.active {
    color: #ffffff;
    background: #e60012;
  }

  .service-card {
    margin-bottom: 18rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: #ffffff;
  }

  .card-head,
  .row,
  .card-foot {
    display: flex;
    align-items: flex-start;
  }

  .card-head {
    justify-content: space-between;
  }

  .title {
    flex: 1;
    min-width: 0;
    margin-right: 18rpx;
    color: #17191f;
    font-size: 30rpx;
    line-height: 42rpx;
    font-weight: 800;
  }

  .meta {
    margin-top: 8rpx;
    color: #9aa0aa;
    font-size: 22rpx;
    line-height: 32rpx;
  }

  .row {
    margin-top: 16rpx;
  }

  .label {
    width: 80rpx;
    flex-shrink: 0;
    color: #8b9099;
    font-size: 24rpx;
    line-height: 36rpx;
  }

  .value {
    flex: 1;
    min-width: 0;
    color: #3b3f47;
    font-size: 24rpx;
    line-height: 36rpx;
  }

  .accept-tip {
    margin-top: 16rpx;
    padding: 16rpx 18rpx;
    border-radius: 12rpx;
    color: #9a5b00;
    background: #fff7e8;
    font-size: 23rpx;
    line-height: 34rpx;
  }

  .card-foot {
    justify-content: space-between;
    margin-top: 16rpx;
    color: #999999;
    font-size: 22rpx;
  }

  .card-foot view {
    color: #e60012;
    font-size: 28rpx;
    font-weight: 800;
  }

  .error-card {
    margin-bottom: 18rpx;
    padding: 22rpx;
    border-radius: 14rpx;
    color: #8c929d;
    background: #ffffff;
    font-size: 24rpx;
  }

  .error-card text {
    float: right;
    color: #e60012;
  }
</style>
