<template>
  <s-layout title="退款详情" :bgStyle="{ color: '#f4f6f8' }"
    ><view class="page"
      ><view v-if="detail.id" class="card"
        ><view class="title">{{ detail.refundNo }}</view
        ><view v-for="row in rows" :key="row.label" class="row"
          ><text>{{ row.label }}</text
          ><view>{{ row.value }}</view></view
        ></view
      ><view v-if="error" class="error">{{ error }}<text @tap="load">重试</text></view
      ><s-empty v-if="!loading && !error && !detail.id" text="暂无详情" /></view
  ></s-layout>
</template>
<script setup>
  import { computed, ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import { formatDeltaAmount } from '@/sheep/helper/delta';
  const id = ref('');
  const detail = ref({});
  const loading = ref(false);
  const error = ref('');
  const rows = computed(() => [
    { label: '服务订单 ID', value: detail.value.serviceOrderId || '-' },
    { label: '退款金额', value: formatDeltaAmount(detail.value.refundAmount) },
    { label: '退款状态', value: detail.value.refundStatusName || '-' },
    { label: '退款方式', value: detail.value.refundMethodName || '-' },
    { label: '处理备注', value: detail.value.processRemark || '-' },
    { label: '完成时间', value: detail.value.completedTime || '-' },
    { label: '创建时间', value: detail.value.createTime || '-' },
  ]);
  async function load() {
    loading.value = true;
    error.value = '';
    const res = await ServiceOrderApi.getRefundDetail(id.value, { showError: false });
    if (res?.code === 0) detail.value = res.data || {};
    else error.value = res?.msg || '加载失败';
    loading.value = false;
  }
  onLoad((o = {}) => {
    id.value = o.id || '';
  });
  onShow(() => {
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
  .error {
    padding: 26rpx;
    border-radius: 16rpx;
    background: #fff;
  }
  .title {
    margin-bottom: 16rpx;
    font-size: 30rpx;
    font-weight: 800;
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
  }
  .row view {
    max-width: 70%;
    text-align: right;
  }
  .error {
    color: #999;
  }
  .error text {
    float: right;
    color: #e60012;
  }
</style>
