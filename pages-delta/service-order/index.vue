<template>
  <s-layout title="服务订单" :bgStyle="{ color: '#f4f6f8' }">
    <view class="delta-page">
      <view v-for="item in state.list" :key="item.id" class="service-card" @tap="goDetail(item.id)">
        <view class="card-head">
          <view class="title ss-line-1">{{
            item.title || item.serviceName || item.goodsName || '服务订单'
          }}</view>
          <service-status :status="item.status" :text="item.statusText || item.statusName" />
        </view>
        <view class="meta" v-if="item.orderNo || item.serviceNo">{{
          item.orderNo || item.serviceNo
        }}</view>
        <view class="row" v-if="item.workerName">
          <text class="label">打手</text>
          <text class="value">{{ item.workerName }}</text>
        </view>
        <view class="row" v-if="item.requirement || item.remark">
          <text class="label">需求</text>
          <text class="value ss-line-2">{{ item.requirement || item.remark }}</text>
        </view>
      </view>
      <s-empty v-if="!state.loading && state.list.length === 0" text="暂无服务订单" />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive } from 'vue';
  import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import ServiceStatus from '../components/service-status.vue';

  const state = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    loading: false,
    loadStatus: 'more',
  });

  async function getList(reset = false) {
    if (state.loading) {
      return;
    }
    if (reset) {
      state.pageNo = 1;
      state.list = [];
      state.loadStatus = 'more';
    }
    state.loading = true;
    state.loadStatus = 'loading';
    const res = await ServiceOrderApi.getPage(
      {
        pageNo: state.pageNo,
        pageSize: state.pageSize,
      },
      { showError: false },
    );
    if (res?.code === 0) {
      const list = res.data?.list || [];
      state.total = res.data?.total || 0;
      state.list = reset ? list : state.list.concat(list);
      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
    } else {
      state.loadStatus = state.list.length > 0 ? 'more' : 'noMore';
    }
    state.loading = false;
    uni.stopPullDownRefresh();
  }

  function loadMore() {
    if (state.loadStatus !== 'more' || state.loading) {
      return;
    }
    state.pageNo++;
    getList();
  }

  function goDetail(id) {
    sheep.$router.go('/pages-delta/service-order/detail', { id });
  }

  onLoad(() => getList(true));
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

  .service-card {
    margin-bottom: 18rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: #ffffff;
  }

  .card-head,
  .row {
    display: flex;
    align-items: flex-start;
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
</style>
