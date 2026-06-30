<template>
  <s-layout title="任务详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="detail-page">
      <view class="detail-card" v-if="detail.id">
        <view class="title">{{
          detail.title || detail.serviceName || detail.goodsName || '服务任务'
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
      <s-empty v-else-if="!loading" text="暂无任务详情" />

      <view class="action-row" v-if="detail.id">
        <button class="ss-reset-button ghost-btn" @tap="startOrder">开始服务</button>
        <button class="ss-reset-button submit-btn" @tap="goSubmit">提交进度</button>
      </view>
      <button v-if="detail.id" class="ss-reset-button finish-btn" @tap="finishOrder"
        >提交完成</button
      >
    </view>
  </s-layout>
</template>

<script setup>
  import { ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerOrderApi from '@/sheep/api/delta/workerOrder';

  const id = ref('');
  const detail = ref({});
  const loading = ref(false);

  async function getDetail() {
    loading.value = true;
    const res = await WorkerOrderApi.getDetail(id.value, { showError: false });
    if (res?.code === 0) {
      detail.value = res.data || {};
    }
    loading.value = false;
  }

  async function startOrder() {
    const res = await WorkerOrderApi.startOrder(id.value);
    if (res?.code === 0) {
      getDetail();
    }
  }

  async function finishOrder() {
    const res = await WorkerOrderApi.finishOrder(id.value);
    if (res?.code === 0) {
      getDetail();
    }
  }

  function goSubmit() {
    sheep.$router.go('/pages-worker/progress/submit', { id: id.value });
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

  .action-row {
    display: flex;
    margin-top: 30rpx;
  }

  .ghost-btn,
  .submit-btn,
  .finish-btn {
    height: 82rpx;
    border-radius: 999rpx;
    font-size: 28rpx;
    line-height: 82rpx;
    font-weight: 800;
  }

  .ghost-btn {
    flex: 1;
    margin-right: 18rpx;
    color: #e60012;
    background: #fff0f1;
  }

  .submit-btn {
    flex: 1;
    color: #ffffff;
    background: #e60012;
  }

  .finish-btn {
    margin-top: 18rpx;
    width: 100%;
    color: #ffffff;
    background: #17191f;
  }
</style>
