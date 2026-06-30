<!-- 二级服务入口 -->
<template>
  <view v-if="activeChildren.length" class="service-entry-section">
    <view class="section-head">
      <view class="section-title">服务入口</view>
      <view class="section-desc">选择细分服务，进入后查看可下单项目</view>
    </view>
    <view class="service-entry-grid">
      <view
        class="service-entry-card"
        v-for="(item, index) in activeChildren"
        :key="item.id"
        @tap="goCategory(item.id)"
      >
        <view class="service-image-wrap">
          <image
            class="service-image"
            :src="resolveImage(item.picUrl, item.id)"
            mode="aspectFill"
            @error="markImageError(item.id)"
          />
          <view class="service-badge">{{ serviceBadge(index) }}</view>
        </view>
        <view class="service-content">
          <view class="service-title ss-line-1">{{ item.name }}</view>
          <view class="service-subtitle ss-line-1">{{ serviceSubtitle(index) }}</view>
          <button
            class="ss-reset-button service-btn"
            hover-class="none"
            @tap.stop="goCategory(item.id)"
          >
            查看服务
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import { computed, reactive } from 'vue';
  import sheep from '@/sheep';

  const FALLBACK_IMAGE = '/static/img/shop/empty_network.png';
  const subtitleList = ['绿色组队｜娱乐体验', '客服确认｜流程清晰'];
  const badgeList = ['推荐', '热门', '新人可看'];

  const props = defineProps({
    data: {
      type: [Array, Object],
      default: () => [],
    },
    activeMenu: [Number, String],
  });

  const state = reactive({
    imageErrorMap: {},
  });

  const activeCategory = computed(() => {
    if (!Array.isArray(props.data)) {
      return {};
    }
    return props.data[Number(props.activeMenu)] || {};
  });

  const activeChildren = computed(() => activeCategory.value.children || []);

  function markImageError(id) {
    state.imageErrorMap[id || 'empty'] = true;
  }

  function resolveImage(url, id) {
    if (!url || state.imageErrorMap[id || 'empty']) {
      return FALLBACK_IMAGE;
    }
    return sheep.$url.cdn(url);
  }

  function serviceSubtitle(index) {
    return subtitleList[index % subtitleList.length];
  }

  function serviceBadge(index) {
    return badgeList[index % badgeList.length];
  }

  function goCategory(categoryId) {
    sheep.$router.go('/pages/goods/list', {
      categoryId,
    });
  }
</script>

<style lang="scss" scoped>
  .service-entry-section {
    margin-top: 18rpx;
  }

  .section-head {
    margin-bottom: 14rpx;
  }

  .section-title {
    font-size: 32rpx;
    line-height: 42rpx;
    font-weight: 800;
    color: #111111;
  }

  .section-desc {
    margin-top: 2rpx;
    font-size: 24rpx;
    line-height: 32rpx;
    color: #999999;
  }

  .service-entry-grid {
    display: flex;
    flex-wrap: wrap;
  }

  .service-entry-card {
    width: calc((100% - 16rpx) / 2);
    margin-right: 16rpx;
    margin-bottom: 16rpx;
    overflow: hidden;
    border-radius: 20rpx;
    background: #ffffff;
    box-shadow: 0 8rpx 24rpx rgba(17, 17, 17, 0.04);

    &:nth-child(2n) {
      margin-right: 0;
    }
  }

  .service-image-wrap {
    width: 100%;
    padding-top: 100%;
    position: relative;
    overflow: hidden;
    background: #f1f2f4;
  }

  .service-image {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    display: block;
  }

  .service-badge {
    position: absolute;
    left: 12rpx;
    top: 12rpx;
    height: 34rpx;
    padding: 0 12rpx;
    border-radius: 999rpx;
    background: #e60012;
    color: #ffffff;
    font-size: 20rpx;
    line-height: 34rpx;
    font-weight: 700;
  }

  .service-content {
    padding: 14rpx;
  }

  .service-title {
    text-align: left;
    font-size: 28rpx;
    font-weight: 800;
    color: #111111;
    line-height: 38rpx;
  }

  .service-subtitle {
    margin-top: 6rpx;
    font-size: 22rpx;
    line-height: 30rpx;
    color: #999999;
  }

  .service-btn {
    width: 100%;
    height: 52rpx;
    margin-top: 14rpx;
    border-radius: 999rpx;
    background: #e60012;
    color: #ffffff;
    font-size: 24rpx;
    font-weight: 700;
    line-height: 52rpx;
  }
</style>
