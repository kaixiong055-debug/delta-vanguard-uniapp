<template>
  <s-layout title="服务订单详情" :bgStyle="{ color: '#f4f6f8' }">
    <view class="page">
      <view v-if="detail.id" class="guide-card" :class="guideInfo.type">
        <view class="guide-title">{{ guideInfo.title }}</view>
        <view class="guide-desc">{{ guideInfo.desc }}</view>
      </view>

      <view v-if="detail.id" class="card">
        <view class="head">
          <view class="title">{{ detail.productName || '服务订单' }}</view>
          <service-status :status="detail.status" />
        </view>

        <image
          v-if="detail.productPicUrl"
          class="product-image"
          :src="detail.productPicUrl"
          mode="aspectFill"
        />

        <view v-for="row in detailRows" :key="row.label" class="row">
          <text>{{ row.label }}</text>
          <view>{{ row.value }}</view>
        </view>
      </view>

      <view v-if="error" class="error">
        {{ error }}
        <text @tap="refresh">重试</text>
      </view>
      <s-empty v-if="!loading && !error && !detail.id" text="暂无服务订单详情" />

      <view v-if="sectionWarning" class="section-warning">
        {{ sectionWarning }}
        <text @tap="refresh">重新加载</text>
      </view>

      <view v-if="detail.id" class="action-grid">
        <button class="ss-reset-button ghost" @tap="go('/pages-delta/service-order/progress')">
          履约进度{{ progressList.length ? `（${progressList.length}）` : '' }}
        </button>
        <button class="ss-reset-button ghost" @tap="go('/pages-delta/service-order/evidence')">
          服务凭证{{ evidenceList.length ? `（${evidenceList.length}）` : '' }}
        </button>

        <button
          v-if="canAccept"
          class="ss-reset-button primary"
          @tap="go('/pages-delta/service-order/accept')"
        >
          验收通过
        </button>
        <button
          v-if="canAccept"
          class="ss-reset-button warning"
          @tap="go('/pages-delta/service-order/rework')"
        >
          要求返工
        </button>
        <button
          v-if="canCancel"
          class="ss-reset-button warning"
          @tap="go('/pages-delta/cancel/apply')"
        >
          申请取消
        </button>
        <button
          v-if="canAfterSale"
          class="ss-reset-button primary"
          @tap="go('/pages-delta/after-sale/apply')"
        >
          申请售后
        </button>
      </view>

      <view v-if="progressPreview.length" class="card section">
        <view class="section-head">
          <view class="section-title">最新履约进度</view>
          <text @tap="go('/pages-delta/service-order/progress')">查看全部</text>
        </view>
        <view v-for="item in progressPreview" :key="item.id" class="record">
          <view class="record-head">
            <view>{{ item.progressTypeName || progressTypeMap[item.progressType] }}</view>
            <text>{{ formatProgressPercent(item.progressPercent) }}</text>
          </view>
          <view class="record-content">{{ item.content || '-' }}</view>
          <text>{{ formatDeltaTime(item.createTime) }}</text>
        </view>
      </view>

      <view v-if="evidencePreview.length" class="card section">
        <view class="section-head">
          <view class="section-title">最新服务凭证</view>
          <text @tap="go('/pages-delta/service-order/evidence')">查看全部</text>
        </view>
        <view v-for="item in evidencePreview" :key="item.id" class="record">
          <view class="record-head">
            <view>{{ item.evidenceTypeName || evidenceTypeMap[item.evidenceType] }}</view>
            <text>{{ formatDeltaTime(item.createTime) }}</text>
          </view>
          <view v-if="item.content" class="record-content">{{ item.content }}</view>
          <image
            v-if="item.imageUrls?.length"
            class="evidence-thumb"
            :src="item.imageUrls[0]"
            mode="aspectFill"
            @tap="previewImages(item.imageUrls)"
          />
          <video
            v-else-if="item.videoUrl"
            class="evidence-video"
            :src="item.videoUrl"
            controls
          />
        </view>
      </view>

      <view v-if="timeline.length" class="card section">
        <view class="section-title">履约时间线</view>
        <progress-timeline :list="timeline" />
      </view>

      <view v-if="acceptances.length || reworks.length" class="card section">
        <view class="section-title">验收与返工记录</view>
        <view v-for="item in acceptances" :key="`a-${item.id}`" class="record">
          <view>{{ item.acceptanceResultName || '验收记录' }}</view>
          <text>{{ item.remark || '-' }} · {{ formatDeltaTime(item.createTime) }}</text>
        </view>
        <view v-for="item in reworks" :key="`r-${item.id}`" class="record">
          <view>第 {{ item.reworkNo }} 次返工</view>
          <text>{{ item.reason || '-' }} · {{ formatDeltaTime(item.createTime) }}</text>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import ServiceOrderApi from '@/sheep/api/delta/serviceOrder';
  import ProgressTimeline from '../components/progress-timeline.vue';
  import ServiceStatus from '../components/service-status.vue';
  import {
    ServiceOrderStatus,
    acceptableStatuses,
    afterSaleStatuses,
    cancelableStatuses,
    evidenceTypeMap,
    formatDeltaOptionalAmount,
    formatDeltaTime,
    getDeviceTypeText,
    getServiceTypeText,
    progressTypeMap,
  } from '@/sheep/helper/delta';

  const id = ref('');
  const detail = ref({});
  const timeline = ref([]);
  const progressList = ref([]);
  const evidenceList = ref([]);
  const acceptances = ref([]);
  const reworks = ref([]);
  const loading = ref(false);
  const error = ref('');
  const sectionWarning = ref('');

  function formatProgressPercent(value) {
    if (value === null || value === undefined || value === '') return '-';

    const number = Number(value);
    if (!Number.isFinite(number)) return '-';

    return `${number}%`;
  }

  function clearSectionData() {
    timeline.value = [];
    progressList.value = [];
    evidenceList.value = [];
    acceptances.value = [];
    reworks.value = [];
  }

  const canAccept = computed(() =>
    acceptableStatuses.includes(Number(detail.value.status)),
  );
  const canCancel = computed(() =>
    cancelableStatuses.includes(Number(detail.value.status)),
  );
  const canAfterSale = computed(() =>
    afterSaleStatuses.includes(Number(detail.value.status)),
  );

  const progressPreview = computed(() =>
    [...progressList.value]
      .sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
      .slice(0, 2),
  );

  const evidencePreview = computed(() =>
    [...evidenceList.value]
      .sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
      .slice(0, 2),
  );

  const guideInfo = computed(() => {
    const map = {
      [ServiceOrderStatus.PENDING_DISPATCH]: {
        type: 'normal',
        title: '等待平台派单',
        desc: '平台正在为你的订单匹配合适的服务人员。',
      },
      [ServiceOrderStatus.WAITING_DESIGNATED]: {
        type: 'normal',
        title: '等待指定打手确认',
        desc: '指定打手确认后即可进入服务阶段。',
      },
      [ServiceOrderStatus.POOL_PENDING]: {
        type: 'normal',
        title: '订单正在接单大厅等待领取',
        desc: '有打手领取后，订单状态会自动更新。',
      },
      [ServiceOrderStatus.ACCEPTED_PENDING_START]: {
        type: 'normal',
        title: '打手已接单',
        desc: '服务尚未开始，你可以继续关注订单状态。',
      },
      [ServiceOrderStatus.IN_PROGRESS]: {
        type: 'progress',
        title: '服务进行中',
        desc: '可在本页查看最新履约进度和服务凭证。',
      },
      [ServiceOrderStatus.WORKER_SUBMITTED]: {
        type: 'warning',
        title: '等待你的验收',
        desc: '请核对履约进度和服务凭证，确认无误后验收通过；有问题可要求返工。',
      },
      [ServiceOrderStatus.PENDING_VERIFICATION]: {
        type: 'warning',
        title: '等待平台验收',
        desc: '订单正在由平台客服进行核验。',
      },
      [ServiceOrderStatus.COMPLETED]: {
        type: 'success',
        title: '服务已完成',
        desc: '本次服务已经完成，可在有效期内申请售后。',
      },
      [ServiceOrderStatus.AFTER_SALE]: {
        type: 'warning',
        title: '售后处理中',
        desc: '平台正在处理你的售后申请，请关注最新进度。',
      },
      [ServiceOrderStatus.DISPUTE]: {
        type: 'warning',
        title: '纠纷处理中',
        desc: '平台正在介入处理，请留意消息通知。',
      },
      [ServiceOrderStatus.CANCELED]: {
        type: 'disabled',
        title: '订单已取消',
        desc: '该服务订单已经取消。',
      },
    };
    return (
      map[Number(detail.value.status)] || {
        type: 'normal',
        title: '服务订单',
        desc: '请关注当前履约状态。',
      }
    );
  });

  const detailRows = computed(() => [
    { label: '服务单号', value: detail.value.serviceOrderNo || '-' },
    { label: '商城订单', value: detail.value.tradeOrderNo || '-' },
    { label: '服务名称', value: detail.value.serviceName || detail.value.productName || '-' },
    { label: 'SKU 规格', value: detail.value.skuName || '-' },
    { label: '服务类型', value: getServiceTypeText(detail.value.serviceType) },
    { label: '设备类型', value: getDeviceTypeText(detail.value.deviceType) },
    { label: '购买数量', value: detail.value.count ?? '-' },
    { label: '服务金额', value: formatDeltaOptionalAmount(detail.value.serviceAmount) },
    { label: '创建时间', value: formatDeltaTime(detail.value.createTime) },
    { label: '更新时间', value: formatDeltaTime(detail.value.updateTime) },
  ]);

  async function refresh() {
    if (!id.value || loading.value) return;

    loading.value = true;
    error.value = '';
    sectionWarning.value = '';

    const requests = [
      ServiceOrderApi.getDetail(id.value, { showError: false }),
      ServiceOrderApi.getTimeline(id.value, { showError: false }),
      ServiceOrderApi.getProgressList(id.value, { showError: false }),
      ServiceOrderApi.getEvidenceList(id.value, { showError: false }),
      ServiceOrderApi.getAcceptanceList(id.value, { showError: false }),
      ServiceOrderApi.getReworkList(id.value, { showError: false }),
    ];

    try {
      const results = await Promise.allSettled(requests);
      const values = results.map((item) =>
        item.status === 'fulfilled' ? item.value : null,
      );

      const [
        detailRes,
        timelineRes,
        progressRes,
        evidenceRes,
        acceptanceRes,
        reworkRes,
      ] = values;

      let warning = false;

      const resolveList = (response) => {
        if (response?.code === 0 && Array.isArray(response.data)) {
          return response.data;
        }

        warning = true;
        return [];
      };

      if (detailRes?.code === 0 && detailRes.data?.id) {
        detail.value = detailRes.data;
      } else {
        detail.value = {};
        clearSectionData();
        error.value = detailRes?.msg || '详情加载失败';
        return;
      }

      timeline.value = resolveList(timelineRes);
      progressList.value = resolveList(progressRes);
      evidenceList.value = resolveList(evidenceRes);
      acceptances.value = resolveList(acceptanceRes);
      reworks.value = resolveList(reworkRes);

      sectionWarning.value = warning ? '部分履约记录加载失败' : '';
    } catch (err) {
      detail.value = {};
      clearSectionData();
      sectionWarning.value = '';
      error.value = err?.msg || err?.message || '详情加载失败';
    } finally {
      loading.value = false;
    }
  }

  function go(url) {
    sheep.$router.go(url, { id: id.value });
  }

  function previewImages(urls) {
    if (!Array.isArray(urls) || urls.length === 0) return;
    uni.previewImage({
      current: urls[0],
      urls,
    });
  }

  onLoad((options = {}) => {
    id.value = options.id || '';
  });

  onShow(() => {
    if (!id.value) {
      error.value = '服务单 ID 不存在';
      return;
    }
    refresh();
  });
</script>

<style lang="scss" scoped>
  .page {
    min-height: 100vh;
    padding: 24rpx 24rpx 50rpx;
    box-sizing: border-box;
    background: #f4f6f8;
  }

  .guide-card,
  .card,
  .error {
    margin-bottom: 18rpx;
    padding: 24rpx;
    border-radius: 18rpx;
    background: #ffffff;
  }

  .guide-card.normal {
    color: #44505f;
    background: #eef4fb;
  }

  .guide-card.progress {
    color: #075d38;
    background: #eaf8f1;
  }

  .guide-card.warning {
    color: #8a4d00;
    background: #fff6e6;
  }

  .guide-card.success {
    color: #075d38;
    background: #eaf8f1;
  }

  .guide-card.disabled {
    color: #6d737c;
    background: #eceff2;
  }

  .guide-title {
    font-size: 29rpx;
    font-weight: 800;
  }

  .guide-desc {
    margin-top: 8rpx;
    font-size: 24rpx;
    line-height: 38rpx;
  }

  .card {
    padding: 28rpx;
  }

  .head,
  .section-head,
  .record-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .head {
    margin-bottom: 16rpx;
  }

  .title {
    flex: 1;
    min-width: 0;
    margin-right: 16rpx;
    font-size: 32rpx;
    font-weight: 800;
  }

  .product-image {
    width: 100%;
    height: 260rpx;
    margin-bottom: 16rpx;
    border-radius: 14rpx;
  }

  .row {
    display: flex;
    justify-content: space-between;
    padding: 15rpx 0;
    border-top: 1rpx solid #eeeeee;
    color: #333333;
    font-size: 24rpx;
  }

  .row text {
    color: #999999;
  }

  .row view {
    max-width: 70%;
    text-align: right;
    word-break: break-all;
  }

  .section-warning {
    margin-bottom: 18rpx;
    padding: 20rpx 24rpx;
    border-radius: 14rpx;
    color: #8a4d00;
    background: #fff6e6;
    font-size: 24rpx;
  }

  .section-warning text {
    float: right;
    color: #e60012;
    font-weight: 600;
  }

  .action-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16rpx;
    margin-bottom: 22rpx;
  }

  .action-grid button {
    height: 76rpx;
    border-radius: 999rpx;
    font-size: 25rpx;
    line-height: 76rpx;
  }

  .ghost {
    color: #333333;
    background: #ffffff;
  }

  .primary {
    color: #ffffff;
    background: #e60012;
  }

  .warning {
    color: #e60012;
    background: #fff0f1;
  }

  .section {
    margin-top: 22rpx;
  }

  .section-head {
    margin-bottom: 12rpx;
  }

  .section-head text {
    color: #e60012;
    font-size: 23rpx;
  }

  .section-title {
    font-size: 28rpx;
    font-weight: 800;
  }

  .record {
    padding: 16rpx 0;
    border-top: 1rpx solid #eeeeee;
    color: #333333;
    font-size: 24rpx;
  }

  .record-head {
    font-weight: 700;
  }

  .record-head text,
  .record > text {
    color: #999999;
    font-size: 22rpx;
  }

  .record-content {
    margin: 10rpx 0;
    color: #50555f;
    font-size: 24rpx;
    line-height: 38rpx;
  }

  .evidence-thumb {
    width: 180rpx;
    height: 180rpx;
    margin-top: 12rpx;
    border-radius: 12rpx;
  }

  .evidence-video {
    width: 100%;
    margin-top: 12rpx;
  }

  .error {
    color: #999999;
  }

  .error text {
    float: right;
    color: #e60012;
  }
</style>
