<template>
  <s-layout title="分派打手" :bgStyle="{ color: '#f4f6f8' }">
    <view class="select-page">
      <view class="tip-card">
        <view class="tip-title">选择执行打手</view>
        <view class="tip-desc">
          只展示当前俱乐部中已审核、已启用、在线、技能匹配且没有有效订单的打手。
        </view>
        <view v-if="serviceOrderNo" class="order-no">服务单：{{ serviceOrderNo }}</view>
      </view>

      <view v-if="state.error" class="error-card">
        <text>{{ state.error }}</text>
        <text class="retry" @tap="loadPage(true)">重试</text>
      </view>

      <view
        v-for="item in state.list"
        :key="item.id"
        class="worker-card"
        :class="{ selected: Number(selectedWorkerId) === Number(item.id) }"
        @tap="selectWorker(item)"
      >
        <image v-if="item.avatar" class="avatar" :src="item.avatar" mode="aspectFill" />
        <view v-else class="avatar avatar-fallback">{{ getAvatarText(item.displayName) }}</view>
        <view class="worker-main">
          <view class="worker-head">
            <view class="worker-name">{{ item.displayName || '未命名打手' }}</view>
            <view class="work-status">{{ item.workStatusName || '在线' }}</view>
          </view>
          <view class="worker-no">{{ item.workerNo || '-' }}</view>
          <view class="meta">
            <text>等级 {{ item.level ?? '-' }}</text>
            <text>评分 {{ item.score ?? '-' }}</text>
            <text>任务 {{ item.currentOrderCount ?? 0 }}/{{ item.maxOrderCount ?? '-' }}</text>
          </view>
        </view>
        <view class="radio">
          <view v-if="Number(selectedWorkerId) === Number(item.id)" class="radio-dot" />
        </view>
      </view>

      <s-empty
        v-if="!state.loading && !state.error && state.list.length === 0"
        text="暂无可分派打手"
      />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />

      <view class="remark-card">
        <view class="remark-title">分派备注</view>
        <textarea
          v-model="remark"
          class="remark-input"
          maxlength="500"
          placeholder="选填，可填写任务重点或注意事项"
        />
        <view class="remark-count">{{ remark.length }}/500</view>
      </view>

      <button
        class="ss-reset-button submit-btn"
        :disabled="submitting || !selectedWorkerId"
        @tap="confirmAssign"
      >
        {{ submitting ? '分派中' : '确认分派' }}
      </button>
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onLoad, onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ClubOrderApi from '@/sheep/api/delta/clubOrder';

  const deltaStore = sheep.$store('delta');
  const listingId = ref('');
  const serviceOrderNo = ref('');
  const selectedWorkerId = ref('');
  const remark = ref('');
  const submitting = ref(false);

  const state = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    loading: false,
    loadStatus: 'more',
    error: '',
  });

  async function loadPage(reset = false) {
    if (!listingId.value || state.loading) return;

    if (reset) {
      state.pageNo = 1;
      state.list = [];
      state.total = 0;
      state.loadStatus = 'more';
      selectedWorkerId.value = '';
    }

    const requestedPage = state.pageNo;
    state.loading = true;
    state.error = '';
    state.loadStatus = 'loading';

    try {
      const res = await ClubOrderApi.getAvailableWorkerPage(
        {
          listingId: listingId.value,
          pageNo: requestedPage,
          pageSize: state.pageSize,
        },
        { showError: false },
      );

      if (res?.code === 0) {
        const list = Array.isArray(res.data?.list) ? res.data.list : [];
        state.total = Number(res.data?.total || 0);
        state.list = reset ? list : state.list.concat(list);
        state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
      } else {
        state.error = res?.msg || '候选打手加载失败';
        if (requestedPage > 1) state.pageNo = requestedPage - 1;
        state.loadStatus = state.list.length ? 'more' : 'noMore';
      }
    } catch (error) {
      state.error = error?.msg || error?.message || '候选打手加载失败';
      if (requestedPage > 1) state.pageNo = requestedPage - 1;
      state.loadStatus = state.list.length ? 'more' : 'noMore';
    } finally {
      state.loading = false;
    }
  }

  function loadMore() {
    if (state.loading || state.loadStatus !== 'more') return;
    state.pageNo += 1;
    loadPage();
  }

  function selectWorker(item) {
    if (submitting.value) return;
    selectedWorkerId.value = item?.id || '';
  }

  function getAvatarText(displayName) {
    return String(displayName || '打').slice(0, 1);
  }

  function confirmAssign() {
    if (submitting.value || !selectedWorkerId.value) return;

    uni.showModal({
      title: '确认分派',
      content: '确认将该订单分派给所选打手？分派成功后打手会进入忙碌状态。',
      success: ({ confirm }) => {
        if (confirm) assignWorker();
      },
    });
  }

  async function assignWorker() {
    submitting.value = true;
    try {
      const res = await ClubOrderApi.assignWorker({
        listingId: listingId.value,
        workerId: selectedWorkerId.value,
        remark: remark.value.trim(),
      });

      if (res?.code === 0) {
        setTimeout(() => {
          uni.navigateBack({ delta: 1 });
        }, 400);
      }
    } catch (error) {
      sheep.$helper.toast(error?.msg || error?.message || '分派失败，请稍后重试');
    } finally {
      submitting.value = false;
    }
  }

  onLoad((options = {}) => {
    listingId.value = options.listingId || '';
    serviceOrderNo.value = options.serviceOrderNo || '';
  });

  onShow(async () => {
    if (!listingId.value) {
      state.error = '挂牌 ID 不存在';
      return;
    }
    if (await deltaStore.guardClubMarketPage({ requireServiceScope: false })) {
      await loadPage(true);
    }
  });

  onPullDownRefresh(async () => {
    try {
      if (!listingId.value) {
        state.error = '挂牌 ID 不存在';
        return;
      }
      if (await deltaStore.guardClubMarketPage({ requireServiceScope: false })) {
        await loadPage(true);
      }
    } catch (error) {
      state.error = error?.msg || error?.message || '候选打手加载失败';
    } finally {
      uni.stopPullDownRefresh();
    }
  });

  onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
  .select-page {
    min-height: 100vh;
    padding: 24rpx 24rpx 50rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .tip-card,
  .worker-card,
  .remark-card,
  .error-card {
    margin-bottom: 20rpx;
    padding: 24rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }

  .tip-title,
  .remark-title {
    color: #17191f;
    font-size: 28rpx;
    font-weight: 800;
  }

  .tip-desc {
    margin-top: 10rpx;
    color: #7f8590;
    font-size: 24rpx;
    line-height: 38rpx;
  }

  .order-no {
    margin-top: 12rpx;
    color: #e60012;
    font-size: 23rpx;
  }

  .worker-card {
    display: flex;
    align-items: center;
    border: 2rpx solid transparent;
  }

  .worker-card.selected {
    border-color: #e60012;
    box-shadow: 0 8rpx 24rpx rgba(230, 0, 18, 0.08);
  }

  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 96rpx;
    height: 96rpx;
    margin-right: 18rpx;
    border-radius: 50%;
    background: #f0f1f3;
  }

  .avatar-fallback {
    color: #ffffff;
    background: #e60012;
    font-size: 34rpx;
    font-weight: 800;
  }

  .worker-main {
    flex: 1;
    min-width: 0;
  }

  .worker-head,
  .meta,
  .error-card {
    display: flex;
    align-items: center;
  }

  .worker-head,
  .error-card {
    justify-content: space-between;
  }

  .worker-name {
    color: #252932;
    font-size: 28rpx;
    font-weight: 800;
  }

  .work-status {
    padding: 5rpx 12rpx;
    border-radius: 999rpx;
    color: #168a48;
    background: #edf9f2;
    font-size: 20rpx;
  }

  .worker-no {
    margin-top: 6rpx;
    color: #9a9fa8;
    font-size: 22rpx;
  }

  .meta {
    flex-wrap: wrap;
    gap: 18rpx;
    margin-top: 12rpx;
    color: #7f8590;
    font-size: 22rpx;
  }

  .radio {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38rpx;
    height: 38rpx;
    margin-left: 18rpx;
    border: 2rpx solid #c9cdd4;
    border-radius: 50%;
  }

  .selected .radio {
    border-color: #e60012;
  }

  .radio-dot {
    width: 22rpx;
    height: 22rpx;
    border-radius: 50%;
    background: #e60012;
  }

  .remark-input {
    width: 100%;
    min-height: 180rpx;
    margin-top: 16rpx;
    padding: 18rpx;
    border-radius: 12rpx;
    box-sizing: border-box;
    color: #343841;
    background: #f6f7f9;
    font-size: 25rpx;
    line-height: 38rpx;
  }

  .remark-count {
    margin-top: 8rpx;
    color: #9a9fa8;
    font-size: 22rpx;
    text-align: right;
  }

  .submit-btn {
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

  .submit-btn[disabled] {
    opacity: 0.5;
  }

  .error-card {
    color: #7f8590;
    font-size: 24rpx;
  }

  .retry {
    color: #e60012;
  }
</style>
