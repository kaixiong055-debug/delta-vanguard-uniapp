<template>
  <s-layout title="服务订单详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="detail-page">
      <view class="detail-card" v-if="detail.id">
        <view class="title">{{
          detail.title || detail.serviceName || detail.goodsName || '服务订单'
        }}</view>
        <service-status :status="detail.status" :text="detail.statusText || detail.statusName" />
        <view class="row" v-if="detail.workerName">
          <text class="label">打手</text>
          <text class="value">{{ detail.workerName }}</text>
        </view>
        <view class="row" v-if="detail.requirement || detail.remark">
          <text class="label">需求</text>
          <text class="value">{{ detail.requirement || detail.remark }}</text>
        </view>
      </view>
      <s-empty v-else-if="!loading" text="暂无服务订单详情" />

      <button v-if="detail.id" class="ss-reset-button submit-btn" @tap="goSelectWorker"
        >指派打手</button
      >

      <view class="timeline-card" v-if="detail.id">
        <view class="section-title">服务进度</view>
        <progress-timeline :list="progressList" />
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import { ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import ServiceStatus from '../components/service-status.vue';
  import ProgressTimeline from '../components/progress-timeline.vue';

  const id = ref('');
  const detail = ref({});
  const progressList = ref([]);
  const loading = ref(false);

  async function getDetail() {
    loading.value = true;
    const res = await ServiceOrderApi.getDetail(id.value, { showError: false });
    if (res?.code === 0) {
      detail.value = res.data || {};
    }
    const progressRes = await ServiceOrderApi.getProgressList(id.value, { showError: false });
    if (progressRes?.code === 0) {
      progressList.value = progressRes.data || [];
    }
    loading.value = false;
  }

  function goSelectWorker() {
    sheep.$router.go('/pages-delta/service-order/select-worker', { id: id.value });
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

  .detail-card,
  .timeline-card {
    padding: 28rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }

  .title {
    margin-bottom: 16rpx;
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
    margin-top: 24rpx;
    height: 82rpx;
    border-radius: 999rpx;
    background: #e60012;
    color: #ffffff;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }

  .timeline-card {
    margin-top: 24rpx;
  }

  .section-title {
    margin-bottom: 18rpx;
    color: #17191f;
    font-size: 30rpx;
    line-height: 42rpx;
    font-weight: 800;
  }
</style>
