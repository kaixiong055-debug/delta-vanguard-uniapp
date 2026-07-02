<template>
  <view class="timeline">
    <view
      v-for="(item, index) in safeList"
      :key="getTimelineKey(item, index)"
      class="timeline-item"
    >
      <view class="dot" />
      <view class="timeline-content">
        <view class="timeline-title">{{ getTimelineTitle(item) }}</view>
        <view class="timeline-meta">
          <text>{{ formatDeltaTime(item.eventTime) }}</text>
          <text v-if="getOperatorText(item)">
            操作人：{{ getOperatorText(item) }}
          </text>
        </view>
        <view
          v-if="normalizeText(item.content)"
          class="timeline-desc"
        >
          {{ normalizeText(item.content) }}
        </view>
      </view>
    </view>
    <view v-if="!safeList.length" class="timeline-empty">暂无履约时间线</view>
  </view>
</template>

<script setup>
  import { computed } from 'vue';
  import { formatDeltaTime } from '@/sheep/helper/delta';

  const props = defineProps({
    list: {
      type: Array,
      default: () => [],
    },
  });

  const safeList = computed(() =>
    Array.isArray(props.list) ? props.list : [],
  );

  function getTimelineKey(item, index) {
    return [
      item?.nodeType || 'NODE',
      item?.eventTime || 'NO_TIME',
      index,
    ].join('-');
  }

  const nodeTypeMap = {
    PROGRESS: '履约进度',
    LOG: '状态记录',
    EVIDENCE: '服务凭证',
  };

  function getTimelineTitle(item = {}) {
    const title =
      typeof item.title === 'string' ? item.title.trim() : '';

    if (title) return title;

    return nodeTypeMap[item.nodeType] || '履约记录';
  }

  const operatorTypeMap = {
    CUSTOMER: '买家',
    WORKER: '打手',
    ADMIN: '平台',
    SYSTEM: '系统',
  };

  function getOperatorText(item = {}) {
    const name =
      typeof item.operatorName === 'string'
        ? item.operatorName.trim()
        : '';

    if (name) return name;

    return operatorTypeMap[item.operatorType] || '';
  }

  function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }
</script>

<style lang="scss" scoped>
  .timeline {
    padding: 6rpx 0;
  }

  .timeline-item {
    display: flex;
    align-items: flex-start;
    padding-bottom: 26rpx;
  }

  .dot {
    width: 18rpx;
    height: 18rpx;
    margin-top: 10rpx;
    border-radius: 50%;
    background: #e60012;
    box-shadow: 0 0 0 8rpx #fff0f1;
    flex-shrink: 0;
  }

  .timeline-content {
    flex: 1;
    min-width: 0;
    margin-left: 22rpx;
  }

  .timeline-title {
    color: #17191f;
    font-size: 27rpx;
    line-height: 38rpx;
    font-weight: 800;
  }

  .timeline-meta {
    margin-top: 6rpx;
    color: #8d939e;
    font-size: 24rpx;
    line-height: 36rpx;
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }

  .timeline-desc {
    margin-top: 8rpx;
    color: #4a4f58;
    font-size: 24rpx;
    line-height: 36rpx;
    word-break: break-all;
  }

  .timeline-empty {
    padding: 28rpx 0;
    color: #8d939e;
    font-size: 24rpx;
    line-height: 36rpx;
    text-align: center;
  }
</style>
