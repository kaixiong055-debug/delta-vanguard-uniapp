<template>
  <s-layout title="接单大厅" :bgStyle="{ color: '#f4f6f8' }">
    <view class="worker-page">
      <view class="filters">
        <picker :range="serviceOptions" range-key="label" @change="changeServiceType">
          <view class="filter-item">{{ serviceOptions[state.serviceIndex].label }}</view>
        </picker>
        <picker :range="deviceOptions" range-key="label" @change="changeDeviceType">
          <view class="filter-item">{{ deviceOptions[state.deviceIndex].label }}</view>
        </picker>
      </view>
      <view v-if="state.error" class="error-card"
        >{{ state.error }}<text @tap="getList(true)">重试</text></view
      >
      <worker-order-card v-for="item in state.list" :key="item.id" :order="item" @tap="goDetail">
        <template #action>
          <button
            class="ss-reset-button card-btn"
            :disabled="Boolean(claimingId) || !getServiceOrderId(item)"
            @tap.stop="confirmClaim(item)"
            >{{ isClaiming(item) ? '接单中' : '接单' }}</button
          >
        </template>
      </worker-order-card>
      <s-empty
        v-if="!state.loading && !state.error && state.list.length === 0"
        text="暂无可接服务单"
      />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>
    <worker-tabbar active="/pages-worker/pool/index" />
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import OrderPoolApi from '@/sheep/api/delta/orderPool';
  import WorkerTabbar from '../components/worker-tabbar.vue';
  import WorkerOrderCard from '../components/worker-order-card.vue';
  import { DeltaRoute } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const claimingId = ref('');

  function normalizeLongId(value) {
    const text = String(value ?? '').trim();
    return /^[1-9]\d*$/.test(text) ? text : '';
  }

  function normalizeTotal(value) {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 0) {
      return 0;
    }
    return number;
  }

  function restoreAfterLoadFailure(reset, requestedPage) {
    if (!reset && requestedPage > 1) {
      state.pageNo = requestedPage - 1;
    }
    state.loadStatus = state.list.length > 0 ? 'more' : 'noMore';
  }

  function normalizePickerIndex(value, options) {
    const index = Number(value);
    if (!Number.isSafeInteger(index) || index < 0 || index >= options.length) {
      return -1;
    }
    return index;
  }

  function getServiceOrderId(item = {}) {
    return normalizeLongId(item.id);
  }

  function isClaiming(item = {}) {
    const serviceOrderId = getServiceOrderId(item);
    return Boolean(serviceOrderId && claimingId.value === serviceOrderId);
  }

  const serviceOptions = [
    { label: '全部服务', value: undefined },
    { label: '陪玩', value: 1 },
    { label: '护航', value: 2 },
    { label: '趣味单', value: 3 },
  ];
  const deviceOptions = [
    { label: '全部设备', value: undefined },
    { label: '手机', value: 1 },
    { label: '平板', value: 2 },
    { label: 'PC', value: 3 },
  ];

  const state = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    loading: false,
    loadStatus: 'more',
    serviceIndex: 0,
    deviceIndex: 0,
    error: '',
  });

  async function getList(reset = false) {
    if (state.loading) {
      uni.stopPullDownRefresh();
      return;
    }

    if (!reset && state.loadStatus === 'noMore') {
      uni.stopPullDownRefresh();
      return;
    }

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
      const res = await OrderPoolApi.getPage(
        {
          pageNo: requestedPage,
          pageSize: state.pageSize,
          serviceType: serviceOptions[state.serviceIndex].value,
          deviceType: deviceOptions[state.deviceIndex].value,
        },
        { showError: false },
      );

      if (res?.code !== 0) {
        state.error = res?.msg || '接单大厅加载失败';
        restoreAfterLoadFailure(reset, requestedPage);
        return;
      }

      const rows = Array.isArray(res.data?.list) ? res.data.list : [];
      const total = normalizeTotal(res.data?.total);

      state.total = total;
      state.list = reset ? rows : state.list.concat(rows);

      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
    } catch (error) {
      state.error = error?.msg || error?.message || '接单大厅加载失败';
      restoreAfterLoadFailure(reset, requestedPage);
    } finally {
      state.loading = false;
      uni.stopPullDownRefresh();
    }
  }

  async function changeServiceType(event) {
    if (state.loading) return;

    const index = normalizePickerIndex(event?.detail?.value, serviceOptions);

    if (index < 0 || index === state.serviceIndex) {
      return;
    }

    state.serviceIndex = index;
    await getList(true);
  }

  async function changeDeviceType(event) {
    if (state.loading) return;

    const index = normalizePickerIndex(event?.detail?.value, deviceOptions);

    if (index < 0 || index === state.deviceIndex) {
      return;
    }

    state.deviceIndex = index;
    await getList(true);
  }

  function loadMore() {
    if (state.loading || state.loadStatus !== 'more') {
      return;
    }

    state.pageNo += 1;
    getList();
  }

  function goDetail(order = {}) {
    const serviceOrderId = normalizeLongId(order.id);

    if (!serviceOrderId) {
      sheep.$helper.toast('服务单 ID 不存在');
      return;
    }

    sheep.$router.go('/pages-worker/pool/detail', {
      id: serviceOrderId,
    });
  }

  function confirmClaim(item = {}) {
    if (claimingId.value) return;

    const serviceOrderId = getServiceOrderId(item);

    if (!serviceOrderId) {
      sheep.$helper.toast('服务单 ID 不存在');
      return;
    }

    uni.showModal({
      title: '确认接单',
      content: `确认领取服务单 ${item.serviceOrderNo || ''}？`,
      success: ({ confirm }) => {
        if (confirm) {
          claimOrder(serviceOrderId);
        }
      },
    });
  }

  async function claimOrder(serviceOrderId) {
    const normalizedId = normalizeLongId(serviceOrderId);

    if (!normalizedId) {
      sheep.$helper.toast('服务单 ID 不存在');
      return;
    }

    if (claimingId.value) return;

    claimingId.value = normalizedId;

    try {
      const res = await OrderPoolApi.claimOrder(normalizedId);

      if (res?.code !== 0) {
        sheep.$helper.toast(res?.msg || '接单失败，请稍后重试');
        return;
      }

      await getList(true);
      sheep.$router.go(DeltaRoute.WORKER_ORDERS);
    } catch (error) {
      sheep.$helper.toast(error?.msg || error?.message || '接单失败，请稍后重试');
    } finally {
      claimingId.value = '';
    }
  }

  async function refresh() {
    const allowed = await deltaStore.guardWorkerPage();

    if (!allowed) {
      uni.stopPullDownRefresh();
      return;
    }

    await getList(true);
  }

  onShow(refresh);
  onPullDownRefresh(refresh);
  onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
  .worker-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 0;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .card-btn {
    min-width: 112rpx;
    height: 52rpx;
    padding: 0 22rpx;
    border-radius: 999rpx;
    background: #e60012;
    color: #ffffff;
    font-size: 24rpx;
    line-height: 52rpx;
  }
  .filters {
    display: flex;
    gap: 16rpx;
    margin-bottom: 20rpx;
  }
  .filters picker {
    flex: 1;
  }
  .filter-item {
    height: 64rpx;
    border-radius: 14rpx;
    background: #fff;
    color: #444;
    font-size: 24rpx;
    line-height: 64rpx;
    text-align: center;
  }
  .error-card {
    margin-bottom: 18rpx;
    padding: 22rpx;
    border-radius: 14rpx;
    background: #fff;
    color: #8c929d;
    font-size: 24rpx;
  }
  .error-card text {
    float: right;
    color: #e60012;
  }
</style>
