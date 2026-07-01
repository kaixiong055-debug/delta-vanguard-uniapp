<template>
  <s-layout title="消息通知" :bgStyle="{ color: '#f4f6f8' }"
    ><view class="page"
      ><view class="toolbar"
        ><view>{{ unreadCount }} 条未读</view
        ><button
          class="ss-reset-button read-all"
          :disabled="markingAll || !unreadCount"
          @tap="markAll"
          >全部已读</button
        ></view
      ><view class="tabs"
        ><view
          v-for="item in filters"
          :key="item.label"
          class="tab"
          :class="{ active: state.readStatus === item.value }"
          @tap="change(item.value)"
          >{{ item.label }}</view
        ></view
      ><view v-if="state.error" class="error"
        >{{ state.error }}<text @tap="load(true)">重试</text></view
      ><view
        v-for="item in state.list"
        :key="item.id"
        class="card"
        :class="{ unread: !item.readStatus }"
        @tap="go(item)"
        ><view class="head"
          ><view>{{ item.title }}</view
          ><text>{{ item.notificationType }}</text></view
        ><view class="content ss-line-2">{{ item.content }}</view
        ><view class="time">{{ formatDeltaTime(item.createTime) }}</view></view
      ><s-empty
        v-if="!state.loading && !state.error && !state.list.length"
        text="暂无通知" /><uni-load-more
        v-if="state.list.length"
        :status="state.loadStatus" /></view
  ></s-layout>
</template>
<script setup>
  import { reactive, ref } from 'vue';
  import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import NotificationApi from '@/sheep/api/delta/notification';
  import { formatDeltaTime } from '@/sheep/helper/delta';
  const unreadCount = ref(0);
  const markingAll = ref(false);
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
    const res = await NotificationApi.getUnreadCount({ showError: false });
    if (res?.code === 0) unreadCount.value = Number(res.data || 0);
  }
  async function load(reset = false) {
    if (state.loading) return;
    if (reset) {
      state.pageNo = 1;
      state.list = [];
    }
    state.loading = true;
    state.error = '';
    const res = await NotificationApi.getPage(
      { pageNo: state.pageNo, pageSize: state.pageSize, readStatus: state.readStatus },
      { showError: false },
    );
    if (res?.code === 0) {
      const rows = res.data?.list || [];
      state.total = res.data?.total || 0;
      state.list = reset ? rows : state.list.concat(rows);
      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
    } else {
      state.error = res?.msg || '加载失败';
      if (!reset && state.pageNo > 1) state.pageNo--;
    }
    state.loading = false;
    uni.stopPullDownRefresh();
  }
  function change(value) {
    state.readStatus = value;
    load(true);
  }
  function go(item) {
    sheep.$router.go('/pages-delta/notification/detail', { id: item.id });
  }
  async function markAll() {
    if (markingAll.value) return;
    markingAll.value = true;
    const res = await NotificationApi.markAllRead();
    markingAll.value = false;
    if (res?.code === 0) {
      await Promise.all([load(true), loadUnread()]);
    }
  }
  function more() {
    if (!state.loading && state.loadStatus === 'more') {
      state.pageNo++;
      load();
    }
  }
  onShow(() => Promise.all([load(true), loadUnread()]));
  onPullDownRefresh(() => Promise.all([load(true), loadUnread()]));
  onReachBottom(more);
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
    background: #fff;
    font-size: 24rpx;
  }
  .read-all {
    color: #e60012;
    font-size: 23rpx;
  }
  .tabs {
    justify-content: flex-start;
    padding: 8rpx;
  }
  .tab {
    flex: 1;
    height: 56rpx;
    border-radius: 10rpx;
    color: #777;
    line-height: 56rpx;
    text-align: center;
  }
  .tab.active {
    color: #fff;
    background: #e60012;
  }
  .card,
  .error {
    position: relative;
    margin-bottom: 16rpx;
    padding: 24rpx;
    border-radius: 16rpx;
    background: #fff;
  }
  .card.unread:before {
    position: absolute;
    left: 10rpx;
    top: 30rpx;
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
    background: #e60012;
    content: '';
  }
  .head {
    display: flex;
    justify-content: space-between;
    font-size: 27rpx;
    font-weight: 800;
  }
  .head text {
    color: #999;
    font-size: 20rpx;
  }
  .content,
  .time {
    margin-top: 10rpx;
    color: #555;
    font-size: 24rpx;
    line-height: 36rpx;
  }
  .time {
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
