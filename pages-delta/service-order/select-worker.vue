<template>
  <s-layout title="指派打手" :bgStyle="{ color: '#f4f6f8' }">
    <view class="select-page">
      <worker-card
        v-for="item in state.list"
        :key="item.id"
        :worker="item"
        @select="selectWorker"
      />
      <s-empty v-if="!state.loading && state.list.length === 0" text="暂无可指派打手" />
      <uni-load-more v-if="state.list.length > 0" :status="state.loadStatus" @tap="loadMore" />
    </view>
  </s-layout>
</template>

<script setup>
  import { reactive, ref } from 'vue';
  import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import WorkerCard from '../components/worker-card.vue';

  const orderId = ref('');
  const state = reactive({
    list: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    loading: false,
    loadStatus: 'more',
  });

  async function getList(reset = false) {
    if (state.loading) {
      return;
    }
    if (reset) {
      state.pageNo = 1;
      state.list = [];
      state.loadStatus = 'more';
    }
    state.loading = true;
    state.loadStatus = 'loading';
    const res = await ServiceOrderApi.getWorkerCandidatePage(
      {
        serviceOrderId: orderId.value,
        pageNo: state.pageNo,
        pageSize: state.pageSize,
      },
      { showError: false },
    );
    if (res?.code === 0) {
      const list = res.data?.list || [];
      state.total = res.data?.total || 0;
      state.list = reset ? list : state.list.concat(list);
      state.loadStatus = state.list.length < state.total ? 'more' : 'noMore';
    } else {
      state.loadStatus = state.list.length > 0 ? 'more' : 'noMore';
    }
    state.loading = false;
    uni.stopPullDownRefresh();
  }

  function loadMore() {
    if (state.loadStatus !== 'more' || state.loading) {
      return;
    }
    state.pageNo++;
    getList();
  }

  async function selectWorker(worker) {
    const res = await ServiceOrderApi.assignWorker({
      serviceOrderId: orderId.value,
      workerId: worker.id,
    });
    if (res?.code === 0) {
      sheep.$router.back();
    }
  }

  onLoad((options = {}) => {
    orderId.value = options.id || '';
    getList(true);
  });
  onPullDownRefresh(() => getList(true));
  onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
  .select-page {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }
</style>
