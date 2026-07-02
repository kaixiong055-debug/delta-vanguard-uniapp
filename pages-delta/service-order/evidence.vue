<template>
  <s-layout title="服务凭证" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <view v-if="error" class="error">
        {{ error }}
        <text @tap="load">重试</text>
      </view>

      <view v-for="item in list" :key="item.id" class="card">
        <view class="head">
          {{
            item.evidenceTypeName ||
            evidenceTypeMap[Number(item.evidenceType)] ||
            '-'
          }}
        </view>
        <view v-if="item.content" class="content">{{ item.content }}</view>
        <view class="images">
          <image
            v-for="(url, index) in normalizeImageUrls(item.imageUrls)"
            :key="`${item.id || 'evidence'}-${index}-${url}`"
            :src="url"
            mode="aspectFill"
            lazy-load
            @tap="preview(url, item.imageUrls)"
          />
        </view>
        <video
          v-if="normalizeMediaUrl(item.videoUrl)"
          class="video"
          :src="normalizeMediaUrl(item.videoUrl)"
          controls
        />
        <view class="time">{{ formatDeltaTime(item.createTime) }}</view>
      </view>

      <s-empty v-if="!loading && !error && !list.length" text="暂无服务凭证" />
    </view>
  </s-layout>
</template>

<script setup>
  import { ref } from 'vue';
  import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import { evidenceTypeMap, formatDeltaTime } from '@/sheep/helper/delta';

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

  function normalizeImageUrls(urls) {
    if (!Array.isArray(urls)) return [];

    return urls.filter((url) => typeof url === 'string' && url.trim());
  }

  function normalizeMediaUrl(url) {
    return typeof url === 'string' ? url.trim() : '';
  }

  function preview(current, urls) {
    const validUrls = normalizeImageUrls(urls);
    if (!validUrls.length) return;

    const target = validUrls.includes(current) ? current : validUrls[0];

    uni.previewImage({
      current: target,
      urls: validUrls,
    });
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
      const res = await ServiceOrderApi.getEvidenceList(serviceOrderId, {
        showError: false,
      });

      if (res?.code !== 0) {
        list.value = [];
        error.value = res?.msg || '服务凭证加载失败';
        return;
      }

      list.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      list.value = [];
      error.value = err?.msg || err?.message || '服务凭证加载失败';
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
    font-size: 28rpx;
    font-weight: 800;
  }

  .content,
  .time {
    margin-top: 10rpx;
    color: #555;
    font-size: 24rpx;
  }

  .time {
    color: #999;
    font-size: 22rpx;
  }

  .images {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 14rpx;
  }

  .images image {
    width: 180rpx;
    height: 180rpx;
    border-radius: 12rpx;
  }

  .video {
    width: 100%;
    margin-top: 14rpx;
  }

  .error {
    color: #999;
  }

  .error text {
    float: right;
    color: #e60012;
  }
</style>
