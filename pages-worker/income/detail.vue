<template>
  <s-layout title="结算详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page"
      ><view v-if="detail.id" class="card"
        ><view class="title">{{ detail.settlementNo }}</view
        ><view v-for="row in rows" :key="row.label" class="row"
          ><text>{{ row.label }}</text
          ><view>{{ row.value }}</view></view
        ></view
      ><view v-if="error" class="error">{{ error }}<text @tap="load">重试</text></view
      ><s-empty v-if="!loading && !error && !detail.id" text="暂无结算详情"
    /></view>
  </s-layout>
</template>
<script setup>
  import { computed, ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import SettlementApi from '@/sheep/api/delta/settlement';
  import { formatDeltaAmount, formatDeltaTime } from '@/sheep/helper/delta';
  const id = ref('');
  const detail = ref({});
  const loading = ref(false);
  const error = ref('');
  const deltaStore = sheep.$store('delta');
  const rows = computed(() => [
    { label: '服务单', value: detail.value.serviceOrderNo || '-' },
    { label: '服务金额', value: formatDeltaAmount(detail.value.serviceAmount) },
    {
      label: '平台抽成',
      value: `${formatDeltaAmount(detail.value.platformFee)} (${Number(detail.value.commissionRate || 0) / 100}%)`,
    },
    { label: '打手收入', value: formatDeltaAmount(detail.value.workerAmount) },
    { label: '状态', value: detail.value.settlementStatusName || '-' },
    { label: '审核时间', value: formatDeltaTime(detail.value.reviewTime) },
    { label: '打款时间', value: formatDeltaTime(detail.value.paidTime) },
    { label: '创建时间', value: formatDeltaTime(detail.value.createTime) },
  ]);
  async function load() {
    loading.value = true;
    error.value = '';
    const res = await SettlementApi.getDetail(id.value, { showError: false });
    if (res?.code === 0) detail.value = res.data || {};
    else error.value = res?.msg || '加载失败';
    loading.value = false;
  }
  onLoad((options = {}) => {
    id.value = options.id || '';
  });
  onShow(async () => {
    if (id.value && (await deltaStore.guardWorkerPage())) load();
  });
</script>
<style lang="scss" scoped>
  .page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }
  .card {
    padding: 28rpx;
    border-radius: 18rpx;
    background: #fff;
  }
  .title {
    margin-bottom: 16rpx;
    font-size: 32rpx;
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
  .error {
    padding: 24rpx;
    border-radius: 16rpx;
    background: #fff;
    color: #999;
  }
  .error text {
    float: right;
    color: #e60012;
  }
</style>
