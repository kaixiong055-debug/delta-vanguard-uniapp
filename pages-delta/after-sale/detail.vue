<template>
  <s-layout title="售后详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <view v-if="error" class="error"
        >{{ error }}<text @tap="load">重试</text></view
      >
      <view v-if="!detail.id && !loading && !error" class="no-id-card">
        <view class="no-id-text">{{ id ? '暂无详情' : '记录 ID 不存在' }}</view>
      </view>
      <view v-if="detail.id">
        <view class="section-title">申请信息</view>
        <view class="card">
          <view class="title">{{ detail.afterSaleNo || '-' }}</view>
          <view class="row">
            <text>服务单</text>
            <view>{{ detail.serviceOrderNo || '-' }}</view>
          </view>
          <view class="row">
            <text>状态</text>
            <view>{{ detail.statusName || getDeltaAfterSaleStatusText(detail.status) }}</view>
          </view>
          <view v-if="detail.afterSaleType != null" class="row">
            <text>售后类型</text>
            <view>{{ getDeltaAfterSaleTypeText(detail.afterSaleType) }}</view>
          </view>
          <view class="row">
            <text>申请原因</text>
            <view>{{ detail.reason || '-' }}</view>
          </view>
          <view v-if="detail.description" class="row">
            <text>问题描述</text>
            <view class="multiline">{{ detail.description }}</view>
          </view>
        </view>

        <view class="section-title">退款诉求</view>
        <view class="card">
          <view class="row">
            <text>请求退款</text>
            <view class="amount">{{ formatDeltaOptionalAmount(detail.requestedRefundAmount) }}</view>
          </view>
          <view v-if="detail.approvedRefundAmount != null" class="row">
            <text>批准退款</text>
            <view class="amount">{{ formatDeltaOptionalAmount(detail.approvedRefundAmount) }}</view>
          </view>
        </view>

        <view v-if="detail.arbitrationResult" class="section-title">仲裁结果</view>
        <view v-if="detail.arbitrationResult" class="card">
          <view class="row">
            <text>仲裁结果</text>
            <view>{{ detail.arbitrationResult }}</view>
          </view>
        </view>

        <view class="section-title">时间信息</view>
        <view class="card">
          <view class="row">
            <text>创建时间</text>
            <view>{{ formatDeltaTime(detail.createTime) }}</view>
          </view>
          <view v-if="detail.handleTime" class="row">
            <text>处理时间</text>
            <view>{{ formatDeltaTime(detail.handleTime) }}</view>
          </view>
        </view>

        <view v-if="detail.serviceOrderId" class="link" @tap="goServiceOrder">查看服务订单</view>
      </view>
    </view>
  </s-layout>
</template>
<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import sheep from '@/sheep';
import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
import {
  formatDeltaOptionalAmount,
  formatDeltaTime,
  getDeltaAfterSaleStatusText,
  getDeltaAfterSaleTypeText,
} from '@/sheep/helper/delta';

const id = ref('');
const detail = ref({});
const loading = ref(false);
const error = ref('');

async function load() {
  if (!id.value) {
    detail.value = {};
    return;
  }
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    const res = await ServiceOrderApi.getAfterSaleDetail(id.value, { showError: false });
    if (res?.code === 0) {
      detail.value = res.data || {};
    } else {
      detail.value = {};
      error.value = res?.msg || '加载失败';
    }
  } catch (e) {
    detail.value = {};
    error.value = '加载失败';
  } finally {
    loading.value = false;
  }
}

function goServiceOrder() {
  if (detail.value.serviceOrderId) {
    sheep.$router.go('/pages-delta/service-order/detail', {
      id: detail.value.serviceOrderId,
    });
  }
}

onLoad((o = {}) => {
  id.value = o.id || '';
  if (id.value) load();
});
</script>
<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
  background: #f4f6f8;
}
.section-title {
  margin: 12rpx 0 0;
  font-size: 24rpx;
  color: #999;
  font-weight: 600;
  padding: 8rpx 4rpx;
}
.card,
.error,
.no-id-card {
  padding: 26rpx;
  border-radius: 16rpx;
  background: #fff;
  margin-bottom: 12rpx;
}
.no-id-text {
  text-align: center;
  color: #999;
  font-size: 26rpx;
  padding: 40rpx 0;
}
.title {
  margin-bottom: 16rpx;
  font-size: 30rpx;
  font-weight: 800;
  word-break: break-all;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-top: 1rpx solid #eee;
  color: #333;
  font-size: 24rpx;
}
.row text {
  color: #999;
  flex-shrink: 0;
}
.row view {
  max-width: 70%;
  text-align: right;
  word-break: break-all;
}
.multiline {
  max-width: 70%;
  text-align: right;
  white-space: pre-wrap;
  word-break: break-all;
}
.amount {
  font-weight: 800;
  color: #e60012;
}
.link {
  margin-top: 26rpx;
  margin-bottom: 16rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  background: #fff;
  text-align: center;
  color: #e60012;
  font-size: 26rpx;
  font-weight: 600;
}
.error {
  color: #999;
  margin-bottom: 16rpx;
}
.error text {
  float: right;
  color: #e60012;
}
</style>
