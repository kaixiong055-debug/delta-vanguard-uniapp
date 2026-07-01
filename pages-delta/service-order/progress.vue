<template>
  <s-layout title="履约进度" :bgStyle="{ color: '#f4f6f8' }"
    ><view class="page"
      ><view v-if="error" class="error">{{ error }}<text @tap="load">重试</text></view
      ><view v-for="item in list" :key="item.id" class="card"
        ><view class="head"
          ><text>{{ item.progressTypeName || progressTypeMap[item.progressType] }}</text
          ><text>{{ item.progressPercent ?? '-' }}%</text></view
        ><view class="content">{{ item.content }}</view
        ><view class="time">{{ formatDeltaTime(item.createTime) }}</view></view
      ><s-empty v-if="!loading && !error && !list.length" text="暂无履约进度" /></view
  ></s-layout>
</template>
<script setup>
  import { ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import { formatDeltaTime, progressTypeMap } from '@/sheep/helper/delta';
  const id = ref('');
  const list = ref([]);
  const loading = ref(false);
  const error = ref('');
  async function load() {
    loading.value = true;
    error.value = '';
    const res = await ServiceOrderApi.getProgressList(id.value, { showError: false });
    if (res?.code === 0) list.value = res.data || [];
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
