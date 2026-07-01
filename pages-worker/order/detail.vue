<template>
  <s-layout title="任务详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="detail-page">
      <view class="detail-card" v-if="detail.id">
        <view class="title">{{ detail.productName || '服务任务' }}</view>
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
          ><text class="label">规格</text
          ><text class="value">{{ detail.skuName || '-' }}</text></view
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
        <view class="row" v-if="detail.customerRemark"
          ><text class="label">备注</text
          ><text class="value">{{ detail.customerRemark }}</text></view
        >
      </view>
      <view v-if="error" class="error-card">{{ error }}<text @tap="refresh">重试</text></view>
      <s-empty v-if="!loading && !error && !detail.id" text="暂无任务详情" />

      <view
        class="action-row"
        v-if="Number(detail.status) === ServiceOrderStatus.ACCEPTED_PENDING_START"
      >
        <button class="ss-reset-button submit-btn" :disabled="submitting" @tap="confirmStart">{{
          submitting ? '处理中' : '开始服务'
        }}</button>
      </view>
      <view v-if="Number(detail.status) === ServiceOrderStatus.IN_PROGRESS" class="action-grid">
        <button class="ss-reset-button ghost-btn" @tap="goProgress">提交进度</button>
        <button class="ss-reset-button ghost-btn" @tap="goEvidence">登记凭证</button>
        <button class="ss-reset-button finish-btn" @tap="goCompletion">提交完成</button>
      </view>

      <view v-if="progressList.length" class="section-card"
        ><view class="section-title">进度记录</view
        ><view v-for="item in progressList" :key="item.id" class="record"
          ><view>{{ item.progressTypeName || progressTypeMap[item.progressType] }}</view
          ><text>{{ item.progressPercent ?? '-' }}% · {{ formatDeltaTime(item.createTime) }}</text
          ><view>{{ item.content }}</view></view
        ></view
      >
      <view v-if="evidenceList.length" class="section-card"
        ><view class="section-title">服务凭证</view
        ><view v-for="item in evidenceList" :key="item.id" class="record"
          ><view>{{ item.evidenceTypeName || evidenceTypeMap[item.evidenceType] }}</view
          ><text>{{ formatDeltaTime(item.createTime) }}</text
          ><view>{{ item.content }}</view
          ><button
            v-if="Number(detail.status) === ServiceOrderStatus.IN_PROGRESS"
            class="ss-reset-button delete-btn"
            :disabled="deletingId === item.id"
            @tap="confirmDelete(item.id)"
            >删除</button
          ></view
        ></view
      >
    </view>
  </s-layout>
</template>

<script setup>
  import { ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import WorkerOrderApi from '@/sheep/api/delta/workerOrder';
  import {
    ServiceOrderStatus,
    evidenceTypeMap,
    formatDeltaAmount,
    formatDeltaTime,
    getDeviceTypeText,
    getServiceOrderStatusText,
    getServiceTypeText,
    progressTypeMap,
  } from '@/sheep/helper/delta';

  const id = ref('');
  const detail = ref({});
  const loading = ref(false);
  const error = ref('');
  const submitting = ref(false);
  const deletingId = ref(null);
  const progressList = ref([]);
  const evidenceList = ref([]);
  const deltaStore = sheep.$store('delta');

  async function getDetail() {
    loading.value = true;
    error.value = '';
    const res = await WorkerOrderApi.getDetail(id.value, { showError: false });
    if (res?.code === 0) {
      detail.value = res.data || {};
    } else {
      error.value = res?.msg || '任务详情加载失败';
    }
    loading.value = false;
  }

  async function getRecords() {
    const [progressRes, evidenceRes] = await Promise.all([
      WorkerOrderApi.getProgressList(id.value, { showError: false }),
      WorkerOrderApi.getEvidenceList(id.value, { showError: false }),
    ]);
    if (progressRes?.code === 0) progressList.value = progressRes.data || [];
    if (evidenceRes?.code === 0) evidenceList.value = evidenceRes.data || [];
  }
  async function refresh() {
    await Promise.all([getDetail(), getRecords()]);
  }

  function confirmStart() {
    if (submitting.value) return;
    uni.showModal({
      title: '开始服务',
      content: '确认现在开始执行该服务？',
      success: ({ confirm }) => {
        if (confirm) startOrder();
      },
    });
  }
  async function startOrder() {
    submitting.value = true;
    const res = await WorkerOrderApi.startOrder(id.value);
    submitting.value = false;
    if (res?.code === 0) await refresh();
  }

  function confirmDelete(evidenceId) {
    if (deletingId.value) return;
    uni.showModal({
      title: '删除凭证',
      content: '确认删除这条凭证？',
      success: ({ confirm }) => {
        if (confirm) deleteEvidence(evidenceId);
      },
    });
  }
  async function deleteEvidence(evidenceId) {
    deletingId.value = evidenceId;
    const res = await WorkerOrderApi.deleteEvidence(evidenceId);
    deletingId.value = null;
    if (res?.code === 0) await getRecords();
  }

  function goProgress() {
    sheep.$router.go('/pages-worker/progress/submit', { id: id.value });
  }
  function goEvidence() {
    sheep.$router.go('/pages-worker/evidence/submit', { id: id.value });
  }
  function goCompletion() {
    sheep.$router.go('/pages-worker/completion/submit', { id: id.value });
  }

  onLoad((options = {}) => {
    id.value = options.id || '';
  });
  onShow(async () => {
    if (id.value && (await deltaStore.guardWorkerPage())) refresh();
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
    width: 100%;
    color: #ffffff;
    background: #17191f;
  }
  .amount {
    color: #e60012;
    font-weight: 800;
  }
  .action-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16rpx;
    margin-top: 26rpx;
  }
  .action-grid .finish-btn {
    grid-column: 1 / -1;
  }
  .section-card {
    margin-top: 22rpx;
    padding: 24rpx;
    border-radius: 18rpx;
    background: #fff;
  }
  .section-title {
    margin-bottom: 16rpx;
    color: #17191f;
    font-size: 28rpx;
    font-weight: 800;
  }
  .record {
    position: relative;
    padding: 16rpx 0;
    border-top: 1rpx solid #f0f1f3;
    color: #333;
    font-size: 24rpx;
    line-height: 36rpx;
  }
  .record text {
    color: #999;
    font-size: 22rpx;
  }
  .delete-btn {
    position: absolute;
    right: 0;
    top: 14rpx;
    color: #e60012;
    font-size: 22rpx;
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
