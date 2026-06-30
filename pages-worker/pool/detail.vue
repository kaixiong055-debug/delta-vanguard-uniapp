<template>
  <s-layout title="服务单详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="detail-page">
      <view class="detail-card" v-if="detail.id">
        <view class="title">{{
          detail.title || detail.serviceName || detail.goodsName || '服务单'
        }}</view>
        <view class="row">
          <text class="label">状态</text>
          <text class="value">{{ detail.statusText || detail.statusName || '待处理' }}</text>
        </view>
        <view class="row" v-if="detail.serverName || detail.gameServer">
          <text class="label">区服</text>
          <text class="value">{{ detail.serverName || detail.gameServer }}</text>
        </view>
        <view class="row" v-if="detail.requirement || detail.remark">
          <text class="label">需求</text>
          <text class="value">{{ detail.requirement || detail.remark }}</text>
        </view>
      </view>
      <s-empty v-else-if="!loading" text="暂无服务单详情" />
      <button v-if="detail.id" class="ss-reset-button submit-btn" @tap="takeOrder">接单</button>
    </view>
  </s-layout>
</template>

<script setup>
  import { ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import OrderPoolApi from '@/sheep/api/delta/orderPool';

  const id = ref('');
  const detail = ref({});
  const loading = ref(false);

  async function getDetail() {
    loading.value = true;
    const res = await OrderPoolApi.getDetail(id.value, { showError: false });
    if (res?.code === 0) {
      detail.value = res.data || {};
    }
    loading.value = false;
  }

  async function takeOrder() {
    const res = await OrderPoolApi.takeOrder(id.value);
    if (res?.code === 0) {
      const workerOrderId = res.data?.workerOrderId || res.data?.id || id.value;
      sheep.$router.redirect('/pages-worker/order/detail', { id: workerOrderId });
    }
  }

  onLoad((options = {}) => {
    id.value = options.id || '';
    if (id.value) {
      getDetail();
    }
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
</style>
