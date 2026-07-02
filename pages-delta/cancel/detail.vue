<template>
  <s-layout title="取消申请详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <view v-if="error" class="error"
        >{{ error }}<text @tap="load">重试</text></view
      >
      <view v-if="!detail.id && !loading && !error" class="no-id-card">
        <view class="no-id-text">{{ id ? '暂无详情' : '记录 ID 不存在' }}</view>
      </view>
      <view v-if="detail.id" class="card">
        <view class="title">{{ detail.cancelNo || '-' }}</view>
        <block v-for="row in rows" :key="row.label">
          <view class="row">
            <text>{{ row.label }}</text>
            <view>{{ row.value }}</view>
          </view>
        </block>
        <view class="link" @tap="goServiceOrder">查看服务订单</view>
      </view>
    </view>
  </s-layout>
</template>
<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import sheep from '@/sheep';
import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
import {
  formatDeltaAmount,
  formatDeltaTime,
  getDeltaCancelStatusText,
} from '@/sheep/helper/delta';

const id = ref('');
const detail = ref({});
const loading = ref(false);
const error = ref('');

const rows = computed(() => [
  { label: '服务单', value: detail.value.serviceOrderNo || '-' },
  {
    label: '状态',
    value: detail.value.statusName || getDeltaCancelStatusText(detail.value.status),
  },
  { label: '申请原因', value: detail.value.applyReason || '-' },
  { label: '退款金额', value: formatDeltaAmount(detail.value.refundAmount) },
  { label: '审核备注', value: detail.value.reviewRemark || '-' },
  { label: '申请时间', value: formatDeltaTime(detail.value.createTime) },
  { label: '审核时间', value: formatDeltaTime(detail.value.reviewTime) },
]);

let loadingPromise = null;

async function load() {
  if (!id.value) {
    detail.value = {};
    return;
  }
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    const res = await ServiceOrderApi.getCancelDetail(id.value, { showError: false });
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
.card,
.error,
.no-id-card {
  padding: 26rpx;
  border-radius: 16rpx;
  background: #fff;
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
.link {
  margin-top: 26rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #e60012;
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
