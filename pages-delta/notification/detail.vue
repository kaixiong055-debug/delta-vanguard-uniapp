<template>
  <s-layout title="通知详情" :bgStyle="{ color: '#f4f6f8' }"
    ><view class="page"
      ><view v-if="detail.id" class="card"
        ><view class="title">{{ detail.title }}</view
        ><view class="meta"
          >{{ detail.notificationType }} · {{ formatDeltaTime(detail.createTime) }}</view
        ><view class="content">{{ detail.content }}</view
        ><view v-if="detail.bizType" class="biz"
          >业务：{{ detail.bizType }} #{{ detail.bizId }}</view
        ></view
      ><view v-if="error" class="error">{{ error }}<text @tap="load">重试</text></view
      ><s-empty v-if="!loading && !error && !detail.id" text="暂无通知详情" /></view
  ></s-layout>
</template>
<script setup>
  import { ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import NotificationApi from '@/sheep/api/delta/notification';
  import { formatDeltaTime } from '@/sheep/helper/delta';
  const id = ref('');
  const detail = ref({});
  const loading = ref(false);
  const error = ref('');
  async function load() {
    loading.value = true;
    error.value = '';
    const res = await NotificationApi.getDetail(id.value, { showError: false });
    if (res?.code === 0) {
      detail.value = res.data || {};
      if (detail.value.id && !detail.value.readStatus)
        await NotificationApi.markRead(detail.value.id);
    } else error.value = res?.msg || '加载失败';
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
    padding: 28rpx;
    border-radius: 18rpx;
    background: #fff;
  }
  .title {
    font-size: 32rpx;
    font-weight: 800;
  }
  .meta,
  .biz {
    margin-top: 10rpx;
    color: #999;
    font-size: 22rpx;
  }
  .content {
    margin-top: 24rpx;
    color: #333;
    font-size: 26rpx;
    line-height: 42rpx;
    white-space: pre-wrap;
  }
  .biz {
    margin-top: 28rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid #eee;
  }
  .error {
    color: #999;
  }
  .error text {
    float: right;
    color: #e60012;
  }
</style>
