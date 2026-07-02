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
        <view v-if="serviceOrderId" class="link" @tap="goServiceOrder">查看服务订单</view>
      </view>
    </view>
  </s-layout>
</template>
<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import sheep from '@/sheep';
import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
import {
  formatDeltaOptionalAmount,
  formatDeltaTime,
  getDeltaCancelStatusText,
} from '@/sheep/helper/delta';

const id = ref('');
const detail = ref({});
const loading = ref(false);
const error = ref('');

function normalizeLongId(value) {
  const text = String(value ?? '').trim();

  if (!/^[1-9]\d*$/.test(text)) {
    return '';
  }

  return text;
}

const serviceOrderId = computed(() =>
  normalizeLongId(detail.value.serviceOrderId),
);

const rows = computed(() => [
  { label: '服务单', value: detail.value.serviceOrderNo || '-' },
  {
    label: '状态',
    value: detail.value.statusName || getDeltaCancelStatusText(detail.value.status),
  },
  { label: '申请原因', value: detail.value.applyReason || '-' },
  { label: '退款金额', value: formatDeltaOptionalAmount(detail.value.refundAmount) },
  { label: '审核备注', value: detail.value.reviewRemark || '-' },
  { label: '申请时间', value: formatDeltaTime(detail.value.createTime) },
  { label: '审核时间', value: formatDeltaTime(detail.value.reviewTime) },
]);

async function load() {
  if (loading.value) {
    uni.stopPullDownRefresh();
    return;
  }

  const recordId = normalizeLongId(id.value);

  if (!recordId) {
    detail.value = {};
    error.value = '取消申请 ID 不存在';
    uni.stopPullDownRefresh();
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const res = await ServiceOrderApi.getCancelDetail(recordId, {
      showError: false,
    });

    const responseId = normalizeLongId(res?.data?.id);

    if (res?.code !== 0 || !responseId) {
      detail.value = {};
      error.value = res?.msg || '取消申请详情加载失败';
      return;
    }

    detail.value = res.data;
  } catch (err) {
    detail.value = {};
    error.value =
      err?.msg ||
      err?.message ||
      '取消申请详情加载失败';
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

function goServiceOrder() {
  const orderId = normalizeLongId(
    detail.value.serviceOrderId,
  );

  if (!orderId) {
    sheep.$helper.toast('服务单 ID 不存在');
    return;
  }

  sheep.$router.go('/pages-delta/service-order/detail', {
    id: orderId,
  });
}

onLoad((options = {}) => {
  id.value = normalizeLongId(options.id);
});

onShow(load);
onPullDownRefresh(load);
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
