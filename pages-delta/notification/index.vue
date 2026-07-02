<template>
  <s-layout title="消息通知" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <view class="toolbar">
        <view>{{ unreadCount }} 条未读</view>
        <button
          class="ss-reset-button read-all"
          :disabled="markingAll || !unreadCount"
          @tap="markAll"
        >
          {{ markingAll ? '处理中' : '全部已读' }}
        </button>
      </view>

      <view class="tabs">
        <view
          v-for="item in filters"
          :key="item.label"
          class="tab"
          :class="{ active: state.readStatus === item.value }"
          @tap="change(item.value)"
        >
          {{ item.label }}
        </view>
      </view>

      <view v-if="state.error" class="error-card">
        <text>{{ state.error }}</text>
        <text class="retry" @tap="load(true)">重试</text>
      </view>

      <view
        v-for="item in state.list"
        :key="item.id"
        class="card"
        :class="{ unread: item.readStatus !== true, opening: openingId === item.id }"
        @tap="openNotification(item)"
      >
        <view class="head">
          <view class="title ss-line-1">{{ item.title || '站内通知' }}</view>
          <text>{{ getDeltaNotificationTypeText(item.notificationType) }}</text>
        </view>
        <view class="content ss-line-2">{{ item.content || '-' }}</view>
        <view class="foot">
          <text>{{ formatDeltaTime(item.createTime) }}</text>
          <text>{{ openingId === item.id ? '正在打开' : '查看 ›' }}</text>
        </view>
      </view>

      <s-empty
        v-if="!state.loading && !state.error && !state.list.length"
        text="暂无通知"
      />
      <uni-load-more v-if="state.list.length" :status="state.loadStatus" />
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import NotificationApi from '@/sheep/api/delta/notification';
  import { formatDeltaTime } from '@/sheep/helper/delta';
  import {
    getDeltaNotificationTypeText,
    resolveDeltaNotificationTarget,
  } from '@/sheep/helper/deltaNotification';

  const deltaStore = sheep.$store('delta');
  const unreadCount = ref(0);
  const markingAll = ref(false);
  const openingId = ref('');

  const filters = [
    { label: '全部', value: undefined },
    { label: '未读', value: false },
    { label: '已读', value: true },
  ];

  const state = reactive({
    readStatus: undefined,
    list: [],
    pageNo: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    loadStatus: 'more',
    error: '',
  });

  async function loadUnread() {
    try {
      const res = await NotificationApi.getUnreadCount({
        showError: false,
        showLoading: false,
      });
      if (res?.code === 0) unreadCount.value = Number(res.data || 0);
    } catch {
      // 未读数量是辅助信息，失败不影响通知列表。
    }
  }

  async function load(reset = false) {
    if (state.loading) return;
    if (!reset && state.loadStatus !== 'more') return;

    if (reset) {
      state.pageNo = 1;
      state.list = [];
      state.total = 0;
      state.loadStatus = 'more';
    }

    state.loading = true;
    state.error = '';

    try {
      const res = await NotificationApi.getPage(
        {
          pageNo: state.pageNo,
          pageSize: state.pageSize,
          readStatus: state.readStatus,
        },
        { showError: false, showLoading: false },
      );

      if (res?.code !== 0) throw new Error(res?.msg || '通知加载失败');

      const rows = Array.isArray(res.data?.list) ? res.data.list : [];
      state.total = Number(res.data?.total || 0);
      state.list = reset ? rows : state.list.concat(rows);
      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
    } catch (error) {
      state.error = error?.msg || error?.message || '通知加载失败';
      if (!reset && state.pageNo > 1) state.pageNo -= 1;
    } finally {
      state.loading = false;
    }
  }

  async function refresh() {
    await Promise.all([load(true), loadUnread()]);
    uni.stopPullDownRefresh();
  }

  function change(value) {
    if (state.loading || state.readStatus === value) return;
    state.readStatus = value;
    load(true);
  }

  function openFallbackDetail(item) {
    if (!item?.id) {
      sheep.$helper.toast(item?.content || '暂无法打开该通知');
      return;
    }
    sheep.$router.go('/pages-delta/notification/detail', { id: item.id });
  }

  async function guardTarget(target) {
    if (target.guard === 'worker') return deltaStore.guardWorkerPage();
    if (target.guard === 'club') {
      return deltaStore.guardClubMarketPage({ requireServiceScope: false });
    }
    return true;
  }

  async function markItemRead(item) {
    if (!item?.id || item.readStatus === true) return;

    try {
      const res = await NotificationApi.markRead(item.id, {
        showError: false,
        showLoading: false,
      });
      if (res?.code === 0) {
        item.readStatus = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch {
      // 标记失败不阻断业务跳转，返回列表时会重新同步服务端状态。
    }
  }

  async function openNotification(item) {
    if (!item || openingId.value) return;
    openingId.value = item.id || 'opening';

    try {
      await markItemRead(item);
      const target = resolveDeltaNotificationTarget(item, deltaStore.currentMode);
      if (!target) {
        openFallbackDetail(item);
        return;
      }

      const allowed = await guardTarget(target);
      if (!allowed) return;
      sheep.$router.go(target.url, target.params || {});
    } catch (error) {
      openFallbackDetail(item);
    } finally {
      openingId.value = '';
    }
  }

  async function markAll() {
    if (markingAll.value || !unreadCount.value) return;
    markingAll.value = true;

    try {
      const res = await NotificationApi.markAllRead({
        showError: false,
        showLoading: true,
      });
      if (res?.code !== 0) throw new Error(res?.msg || '全部标记已读失败');
      await refresh();
      sheep.$helper.toast('已全部标记为已读');
    } catch (error) {
      sheep.$helper.toast(error?.msg || error?.message || '全部标记已读失败');
    } finally {
      markingAll.value = false;
    }
  }

  function loadMore() {
    if (!state.loading && state.loadStatus === 'more') {
      state.pageNo += 1;
      load();
    }
  }

  onShow(refresh);
  onPullDownRefresh(refresh);
  onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
  .page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .toolbar,
  .tabs {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
    padding: 18rpx 22rpx;
    border-radius: 14rpx;
    background: #ffffff;
    font-size: 24rpx;
  }

  .read-all {
    color: #e60012;
    font-size: 23rpx;
  }

  .read-all[disabled] {
    color: #b8bdc6;
  }

  .tabs {
    justify-content: flex-start;
    padding: 8rpx;
  }

  .tab {
    flex: 1;
    height: 56rpx;
    border-radius: 10rpx;
    color: #777777;
    line-height: 56rpx;
    text-align: center;
  }

  .tab.active {
    color: #ffffff;
    background: #e60012;
  }

  .card,
  .error-card {
    position: relative;
    margin-bottom: 16rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: #ffffff;
  }

  .card.opening {
    opacity: 0.72;
  }

  .card.unread::before {
    position: absolute;
    top: 31rpx;
    left: 10rpx;
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
    background: #e60012;
    content: '';
  }

  .head,
  .foot,
  .error-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .title {
    flex: 1;
    min-width: 0;
    padding-right: 20rpx;
    color: #252932;
    font-size: 27rpx;
    font-weight: 800;
  }

  .head text,
  .foot {
    color: #999999;
    font-size: 21rpx;
  }

  .content {
    margin-top: 12rpx;
    color: #555b66;
    font-size: 24rpx;
    line-height: 36rpx;
  }

  .foot {
    margin-top: 14rpx;
  }

  .foot text:last-child,
  .retry {
    color: #e60012;
  }

  .error-card {
    color: #777d87;
    font-size: 24rpx;
  }
</style>
