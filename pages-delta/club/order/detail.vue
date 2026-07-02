<template>
  <s-layout title="俱乐部订单详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="detail-page">
      <view v-if="error" class="error-card">
        <text>{{ error }}</text>
        <text class="retry" @tap="loadDetail">重试</text>
      </view>

      <block v-if="detail.listingId">
        <view class="hero-card">
          <view class="hero-main">
            <image
              v-if="detail.productPicUrl"
              class="product-image"
              :src="detail.productPicUrl"
              mode="aspectFill"
            />
            <view class="hero-content">
              <view class="product-name">{{ detail.productName || '俱乐部履约订单' }}</view>
              <view class="sku-name">{{ detail.skuName || detail.requirementSummary || '-' }}</view>
              <view class="amount">{{ formatDeltaAmount(detail.serviceAmount) }}</view>
            </view>
          </view>
          <view class="status-line">
            <text>当前状态</text>
            <text class="status">{{ detail.orderStatusName || getServiceOrderStatusText(detail.orderStatus) }}</text>
          </view>
        </view>

        <view class="section-card">
          <view class="section-title">订单信息</view>
          <view class="row"><text>服务单号</text><text>{{ detail.serviceOrderNo || '-' }}</text></view>
          <view class="row"><text>挂牌编号</text><text>{{ detail.listingNo || '-' }}</text></view>
          <view class="row">
            <text>服务类型</text>
            <text>{{ detail.serviceTypeName || getServiceTypeText(detail.serviceType) }}</text>
          </view>
          <view class="row">
            <text>设备类型</text>
            <text>{{ detail.deviceTypeName || getDeviceTypeText(detail.deviceType) }}</text>
          </view>
          <view class="row"><text>数量</text><text>{{ detail.count || 1 }}</text></view>
          <view class="row"><text>接单时间</text><text>{{ formatDeltaTime(detail.claimTime) }}</text></view>
          <view class="row"><text>创建时间</text><text>{{ formatDeltaTime(detail.createTime) }}</text></view>
          <view v-if="detail.customerRemark" class="remark">
            <view class="remark-title">客户备注</view>
            <view>{{ detail.customerRemark }}</view>
          </view>
        </view>

        <view class="section-card">
          <view class="section-title">履约打手</view>
          <view v-if="detail.assignedWorkerId" class="worker-box">
            <image
              class="avatar"
              :src="detail.assignedWorkerAvatar || '/static/images/user/avatar-default.png'"
              mode="aspectFill"
            />
            <view class="worker-main">
              <view class="worker-name">{{ detail.assignedWorkerDisplayName || '未命名打手' }}</view>
              <view class="worker-no">{{ detail.assignedWorkerNo || '-' }}</view>
            </view>
            <view class="assigned-tag">已分派</view>
          </view>
          <view v-else class="unassigned-box">
            <view class="unassigned-title">尚未分派打手</view>
            <view class="unassigned-desc">请从当前俱乐部的可用打手中选择一人执行该订单。</view>
          </view>
        </view>

        <view class="section-card">
          <view class="section-title">履约时间</view>
          <view class="row"><text>接受时间</text><text>{{ formatDeltaTime(detail.acceptedAt) }}</text></view>
          <view class="row"><text>开始时间</text><text>{{ formatDeltaTime(detail.startedAt) }}</text></view>
          <view class="row"><text>提交时间</text><text>{{ formatDeltaTime(detail.submittedAt) }}</text></view>
          <view class="row"><text>完成时间</text><text>{{ formatDeltaTime(detail.completedAt) }}</text></view>
        </view>

        <button
          v-if="canAssign"
          class="ss-reset-button primary-btn"
          @tap="goWorkerSelect"
        >
          分派打手
        </button>
      </block>

      <s-empty v-if="!loading && !error && !detail.listingId" text="暂无订单详情" />
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ClubOrderApi from '@/sheep/api/delta/clubOrder';
  import {
    DeltaRoute,
    ServiceOrderStatus,
    formatDeltaAmount,
    formatDeltaTime,
    getDeviceTypeText,
    getServiceOrderStatusText,
    getServiceTypeText,
  } from '@/sheep/helper/delta';

  const deltaStore = sheep.$store('delta');
  const listingId = ref('');
  const detail = ref({});
  const loading = ref(false);
  const error = ref('');

  const canAssign = computed(
    () =>
      Boolean(detail.value?.listingId) &&
      !detail.value?.assignedWorkerId &&
      Number(detail.value?.orderStatus) === ServiceOrderStatus.PENDING_DISPATCH,
  );

  async function loadDetail() {
    if (!listingId.value || loading.value) return;

    loading.value = true;
    error.value = '';

    try {
      const res = await ClubOrderApi.getDetail(listingId.value, { showError: false });
      if (res?.code === 0) {
        detail.value = res.data || {};
      } else {
        detail.value = {};
        error.value = res?.msg || '订单详情加载失败';
      }
    } catch (err) {
      detail.value = {};
      error.value = err?.msg || err?.message || '订单详情加载失败';
    } finally {
      loading.value = false;
    }
  }

  function goWorkerSelect() {
    sheep.$router.go(DeltaRoute.CLUB_ORDER_WORKER_SELECT, {
      listingId: detail.value.listingId,
      serviceOrderNo: detail.value.serviceOrderNo || '',
    });
  }

  onLoad((options = {}) => {
    listingId.value = options.listingId || '';
  });

  onShow(async () => {
    if (!listingId.value) {
      error.value = '挂牌 ID 不存在';
      return;
    }
    if (await deltaStore.guardClubMarketPage({ requireServiceScope: false })) {
      await loadDetail();
    }
  });
</script>

<style lang="scss" scoped>
  .detail-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 50rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .hero-card,
  .section-card,
  .error-card {
    margin-bottom: 20rpx;
    padding: 26rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }

  .hero-main,
  .worker-box,
  .status-line,
  .row,
  .error-card {
    display: flex;
    align-items: center;
  }

  .hero-main {
    align-items: flex-start;
  }

  .product-image {
    width: 150rpx;
    height: 150rpx;
    margin-right: 22rpx;
    border-radius: 16rpx;
    background: #f0f1f3;
  }

  .hero-content,
  .worker-main {
    flex: 1;
    min-width: 0;
  }

  .product-name {
    color: #17191f;
    font-size: 32rpx;
    line-height: 44rpx;
    font-weight: 800;
  }

  .sku-name {
    margin-top: 10rpx;
    color: #7f8590;
    font-size: 24rpx;
    line-height: 36rpx;
  }

  .amount {
    margin-top: 14rpx;
    color: #e60012;
    font-size: 32rpx;
    font-weight: 800;
  }

  .status-line,
  .row,
  .error-card {
    justify-content: space-between;
  }

  .status-line {
    margin-top: 24rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f1f3;
    color: #8c929d;
    font-size: 24rpx;
  }

  .status {
    color: #e60012;
    font-weight: 700;
  }

  .section-title {
    margin-bottom: 12rpx;
    color: #17191f;
    font-size: 28rpx;
    font-weight: 800;
  }

  .row {
    padding: 15rpx 0;
    border-top: 1rpx solid #f4f5f7;
    color: #8c929d;
    font-size: 24rpx;
  }

  .row text:last-child {
    max-width: 440rpx;
    color: #343841;
    text-align: right;
    word-break: break-all;
  }

  .remark,
  .unassigned-box {
    margin-top: 16rpx;
    padding: 18rpx;
    border-radius: 12rpx;
    background: #f6f7f9;
    color: #50555f;
    font-size: 24rpx;
    line-height: 38rpx;
  }

  .remark-title,
  .unassigned-title {
    margin-bottom: 8rpx;
    color: #252932;
    font-weight: 800;
  }

  .unassigned-desc {
    color: #8c929d;
  }

  .avatar {
    width: 88rpx;
    height: 88rpx;
    margin-right: 18rpx;
    border-radius: 50%;
    background: #f0f1f3;
  }

  .worker-name {
    color: #252932;
    font-size: 28rpx;
    font-weight: 800;
  }

  .worker-no {
    margin-top: 6rpx;
    color: #9a9fa8;
    font-size: 22rpx;
  }

  .assigned-tag {
    padding: 6rpx 14rpx;
    border-radius: 999rpx;
    color: #168a48;
    background: #edf9f2;
    font-size: 22rpx;
  }

  .primary-btn {
    width: 100%;
    height: 84rpx;
    margin-top: 28rpx;
    border-radius: 999rpx;
    color: #ffffff;
    background: #e60012;
    font-size: 28rpx;
    line-height: 84rpx;
    font-weight: 800;
  }

  .error-card {
    color: #7f8590;
    font-size: 24rpx;
  }

  .retry {
    color: #e60012;
  }
</style>
