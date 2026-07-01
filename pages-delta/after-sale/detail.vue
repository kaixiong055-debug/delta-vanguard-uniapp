<template>
  <s-layout title="售后详情" :bgStyle="{ color: '#f4f6f8' }"
    ><view class="page"
      ><view v-if="detail.id" class="card"
        ><view class="title">{{ detail.afterSaleNo }}</view
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
    { label: '服务单', value: detail.value.serviceOrderNo || '-' },
    { label: '状态', value: detail.value.statusName || '-' },
    { label: '售后类型', value: detail.value.afterSaleType ?? '-' },
    { label: '申请原因', value: detail.value.reason || '-' },
    { label: '问题描述', value: detail.value.description || '-' },
    { label: '请求退款', value: formatDeltaAmount(detail.value.requestedRefundAmount) },
    { label: '批准退款', value: formatDeltaAmount(detail.value.approvedRefundAmount) },
    { label: '仲裁结果', value: detail.value.arbitrationResult || '-' },
    { label: '创建时间', value: detail.value.createTime || '-' },
    { label: '处理时间', value: detail.value.handleTime || '-' },
  ]);
  async function load() {
    loading.value = true;
    error.value = '';
    const res = await ServiceOrderApi.getAfterSaleDetail(id.value, { showError: false });
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
