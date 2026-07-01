<template>
  <s-layout title="服务单详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="detail-page">
      <view class="detail-card" v-if="detail.id">
        <view class="title">{{ detail.productName || '服务单' }}</view>
        <view class="row">
          <text class="label">状态</text>
          <text class="value">{{
            detail.statusName || getServiceOrderStatusText(detail.status)
          }}</text>
        </view>
        <view class="row"
          ><text class="label">服务单</text
          ><text class="value">{{ detail.serviceOrderNo }}</text></view
        >
        <view class="row"
          ><text class="label">商城单</text
          ><text class="value">{{ detail.tradeOrderNo }}</text></view
        >
        <view class="row"
          ><text class="label">类型</text
          ><text class="value"
            >{{ detail.serviceTypeName || getServiceTypeText(detail.serviceType) }} ·
            {{ detail.deviceTypeName || getDeviceTypeText(detail.deviceType) }}</text
          ></view
        >
        <view class="row"
          ><text class="label">金额</text
          ><text class="value amount">{{ formatDeltaAmount(detail.serviceAmount) }}</text></view
        >
        <view class="row" v-if="detail.skuName">
          <text class="label">规格</text><text class="value">{{ detail.skuName }}</text>
        </view>
        <view class="row" v-if="detail.customerRemark">
          <text class="label">备注</text><text class="value">{{ detail.customerRemark }}</text>
        </view>
      </view>
      <view v-if="error" class="error-card">{{ error }}<text @tap="getDetail">重试</text></view>
      <s-empty v-if="!loading && !error && !detail.id" text="暂无服务单详情" />
      <button
        v-if="detail.id"
        class="ss-reset-button submit-btn"
        :disabled="submitting"
        @tap="confirmClaim"
        >{{ submitting ? '接单中' : '接单' }}</button
      >
    </view>
  </s-layout>
</template>

<script setup>
  import { ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import OrderPoolApi from '@/sheep/api/delta/orderPool';
  import {
    formatDeltaAmount,
    getDeviceTypeText,
    getServiceOrderStatusText,
    getServiceTypeText,
  } from '@/sheep/helper/delta';

  const id = ref('');
  const detail = ref({});
  const loading = ref(false);
  const submitting = ref(false);
  const error = ref('');
  const deltaStore = sheep.$store('delta');

  async function getDetail() {
    loading.value = true;
    error.value = '';
    const res = await OrderPoolApi.getDetail(id.value, { showError: false });
    if (res?.code === 0) {
      detail.value = res.data || {};
    } else {
      error.value = res?.msg || '详情加载失败';
    }
    loading.value = false;
  }

  function confirmClaim() {
    if (submitting.value) return;
    uni.showModal({
      title: '确认接单',
      content: `确认领取服务单 ${detail.value.serviceOrderNo || ''}？`,
      success: ({ confirm }) => {
        if (confirm) claimOrder();
      },
    });
  }
  async function claimOrder() {
    submitting.value = true;
    const res = await OrderPoolApi.claimOrder(id.value);
    if (res?.code === 0) {
      sheep.$router.redirect('/pages-worker/order/detail', { id: id.value });
    }
    submitting.value = false;
  }

  onLoad((options = {}) => {
    id.value = options.id || '';
  });
  onShow(async () => {
    if (id.value && (await deltaStore.guardWorkerPage())) getDetail();
  });
</script>

<style lang="scss" scoped>
  .detail-page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .detail-card {
    padding: 28rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }

  .title {
    margin-bottom: 18rpx;
    color: #17191f;
    font-size: 34rpx;
    line-height: 48rpx;
    font-weight: 800;
  }

  .row {
    display: flex;
    align-items: flex-start;
    padding: 16rpx 0;
    border-top: 1rpx solid #f0f1f3;
  }

  .label {
    width: 96rpx;
    color: #8c929d;
    font-size: 25rpx;
    line-height: 38rpx;
  }

  .value {
    flex: 1;
    min-width: 0;
    color: #2c3038;
    font-size: 25rpx;
    line-height: 38rpx;
  }

  .submit-btn {
    margin-top: 30rpx;
    height: 82rpx;
    border-radius: 999rpx;
    background: #e60012;
    color: #ffffff;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }
  .amount {
    color: #e60012;
    font-weight: 800;
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
