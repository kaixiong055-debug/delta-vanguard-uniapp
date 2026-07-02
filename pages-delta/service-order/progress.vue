<template>
  <s-layout title="履约进度" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <view v-if="error" class="error">
        {{ error }}
        <text @tap="load">重试</text>
      </view>

      <view v-for="item in list" :key="item.id" class="card">
        <view class="head">
          <text>
            {{
              item.progressTypeName ||
              progressTypeMap[Number(item.progressType)] ||
              '-'
            }}
          </text>
          <text>{{ formatProgressPercent(item.progressPercent) }}</text>
        </view>
        <view class="content">{{ item.content || '-' }}</view>
        <view class="time">{{ formatDeltaTime(item.createTime) }}</view>
      </view>

      <s-empty v-if="!loading && !error && !list.length" text="暂无履约进度" />
    </view>
  </s-layout>
</template>

<script setup>
  import { ref } from 'vue';
  import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import { formatDeltaTime, progressTypeMap } from '@/sheep/helper/delta';

  const id = ref('');
  const list = ref([]);
  const loading = ref(false);
  const error = ref('');

  function getServiceOrderId() {
    return normalizeLongId(id.value);
  }

  function normalizeLongId(value) {
    const text = String(value ?? '').trim();
    return /^[1-9]\d*$/.test(text) ? text : '';
  }

  function formatProgressPercent(value) {
    if (value === null || value === undefined || value === '') return '-';

    const number = Number(value);
    if (!Number.isFinite(number)) return '-';

    return `${number}%`;
  }

  async function load() {
    if (loading.value) {
      uni.stopPullDownRefresh();
      return;
    }

    const serviceOrderId = getServiceOrderId();
    if (!serviceOrderId) {
      list.value = [];
      error.value = '服务单 ID 不存在';
      uni.stopPullDownRefresh();
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const res = await ServiceOrderApi.getProgressList(serviceOrderId, {
        showError: false,
      });

      if (res?.code !== 0) {
        list.value = [];
        error.value = res?.msg || '履约进度加载失败';
        return;
      }

      list.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      list.value = [];
      error.value = err?.msg || err?.message || '履约进度加载失败';
    } finally {
      loading.value = false;
      uni.stopPullDownRefresh();
    }
  }

  onLoad((options = {}) => {
    id.value = normalizeLongId(options.id);
  });

  onShow(() => {
    load();
  });

  onPullDownRefresh(() => {
    load();
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
    margin-bottom: 16rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: #fff;
  }

  .head {
    display: flex;
    justify-content: space-between;
    color: #222;
    font-size: 27rpx;
    font-weight: 800;
  }

  .content {
    margin-top: 12rpx;
    color: #444;
    font-size: 25rpx;
    line-height: 38rpx;
  }

  .time {
    margin-top: 8rpx;
    color: #999;
    font-size: 22rpx;
  }

  .error {
    color: #999;
  }

  .error text {
    float: right;
    color: #e60012;
  }
</style>
