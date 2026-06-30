<!-- 服务分类列表 -->
<template>
  <s-layout :bgStyle="{ color: '#f3f4f6' }" tabbar="/pages/index/category" title="服务分类">
    <view class="s-category">
      <view class="three-level-wrap ss-flex ss-col-top">
        <!-- 服务分类（左） -->
        <view class="side-menu-wrap" :style="[{ top: Number(statusBarHeight + 88) + 'rpx' }]">
          <scroll-view scroll-y :style="[{ height: pageHeight + 'px' }]">
            <view
              class="menu-item ss-flex ss-col-center"
              v-for="(item, index) in state.categoryList"
              :key="item.id"
              :class="[{ 'menu-item-active': index === state.activeMenu }]"
              @tap="onMenu(index)"
            >
              <view class="menu-title">
                {{ item.name }}
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 服务分类（右） -->
        <view class="goods-list-box" v-if="state.categoryList?.length">
          <scroll-view
            scroll-y
            :style="[{ height: pageHeight + 'px' }]"
            @scrolltolower="handleScrollToLower"
          >
            <view class="category-content">
              <view class="banner-card">
                <image
                  class="banner-img"
                  :src="resolveImage(activeCategory.picUrl, 'banner', activeCategory.id)"
                  mode="aspectFill"
                  @error="markImageError('banner', activeCategory.id)"
                />
                <view class="banner-mask" />
                <view class="banner-brand">
                  <view class="brand-name">Delta 先锋俱乐部</view>
                  <view class="brand-subtitle">专业服务 · 快速响应</view>
                </view>
              </view>

              <view class="category-title-card">
                <view class="category-name">{{ activeCategory.name || '服务分类' }}</view>
                <view class="category-desc">轻松组队｜娱乐体验｜客服确认</view>
              </view>

              <second-one
                v-if="state.style === 'second_one'"
                :data="state.categoryList"
                :activeMenu="state.activeMenu"
              />

              <first-one v-if="state.style === 'first_one'" :pagination="state.pagination" />
              <first-two v-if="state.style === 'first_two'" :pagination="state.pagination" />

              <view v-if="state.style === 'second_one'" class="recommend-section">
                <view class="section-head">
                  <view>
                    <view class="section-title">推荐服务</view>
                    <view class="section-desc">下单前请先联系客服确认需求</view>
                  </view>
                </view>

                <view v-if="state.pagination.list.length" class="service-goods-grid">
                  <view
                    class="service-goods-card"
                    v-for="item in state.pagination.list"
                    :key="item.id"
                    @tap="goGoodsDetail(item.id)"
                  >
                    <view class="goods-image-wrap">
                      <image
                        class="goods-image"
                        :src="resolveImage(item.picUrl || item.image, 'goods', item.id)"
                        mode="aspectFill"
                        @error="markImageError('goods', item.id)"
                      />
                    </view>
                    <view class="goods-card-content">
                      <view class="goods-title ss-line-2">{{ item.name }}</view>
                      <view class="service-tags">
                        <text class="service-tag">绿色组队</text>
                        <text class="service-tag">客服确认</text>
                        <text class="service-tag">售后有据</text>
                      </view>
                      <view class="goods-card-footer">
                        <view class="goods-price">
                          <text class="price-unit">￥</text>{{ formatServicePrice(item) }}
                        </view>
                        <button
                          class="ss-reset-button order-btn"
                          hover-class="none"
                          @tap.stop="goGoodsDetail(item.id)"
                        >
                          立即下单
                        </button>
                      </view>
                    </view>
                  </view>
                </view>

                <view
                  v-else-if="state.loadStatus === 'noMore'"
                  class="service-empty ss-flex-col ss-col-center ss-row-center"
                >
                  <image class="empty-icon" src="/static/goods-empty.png" mode="aspectFit" />
                  <view class="empty-title">当前分类服务正在整理中</view>
                  <button
                    class="ss-reset-button contact-btn"
                    hover-class="none"
                    @tap="goCustomerService"
                  >
                    联系客服
                  </button>
                </view>
              </view>

              <uni-load-more
                v-if="state.pagination.total > 0"
                :status="state.loadStatus"
                :content-text="{
                  contentdown: '查看更多服务',
                  contentrefresh: '服务加载中',
                  contentnomore: '没有更多服务了',
                }"
                @tap="loadMore"
              />
            </view>
          </scroll-view>
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
  import secondOne from './components/second-one.vue';
  import firstOne from './components/first-one.vue';
  import firstTwo from './components/first-two.vue';
  import sheep from '@/sheep';
  import CategoryApi from '@/sheep/api/product/category';
  import SpuApi from '@/sheep/api/product/spu';
  import { onShow } from '@dcloudio/uni-app';
  import { computed, reactive } from 'vue';
  import { concat } from 'lodash-es';
  import { handleTree } from '@/sheep/helper/utils';
  import { fen2yuan } from '@/sheep/hooks/useGoods';

  const FALLBACK_IMAGE = '/static/img/shop/empty_network.png';

  const state = reactive({
    style: 'second_one', // first_one：一级服务；first_two：二级服务；second_one：二级分类
    categoryList: [], // 服务分类树
    activeMenu: 0, // 选中的一级菜单，在 categoryList 的下标
    pagination: {
      // 服务分页
      list: [],
      total: 0,
      pageNo: 1,
      pageSize: 8,
    },
    loadStatus: '',
    imageErrorMap: {},
  });

  const { safeArea } = sheep.$platform.device;
  const pageHeight = computed(() => safeArea.height - 44 - 50);
  const statusBarHeight = sheep.$platform.device.statusBarHeight * 2;
  const activeCategory = computed(() => state.categoryList[state.activeMenu] || {});

  function imageKey(scope, id) {
    return `${scope}_${id || 'empty'}`;
  }

  function markImageError(scope, id) {
    state.imageErrorMap[imageKey(scope, id)] = true;
  }

  function resolveImage(url, scope, id) {
    if (!url || state.imageErrorMap[imageKey(scope, id)]) {
      return FALLBACK_IMAGE;
    }
    return sheep.$url.cdn(url);
  }

  function resetGoodsPagination() {
    state.pagination.pageNo = 1;
    state.pagination.list = [];
    state.pagination.total = 0;
    state.loadStatus = '';
  }

  // 加载服务分类
  async function getList() {
    const { code, data } = await CategoryApi.getCategoryList();
    if (code !== 0) {
      return;
    }
    state.categoryList = handleTree(data);
    if (state.activeMenu >= state.categoryList.length) {
      state.activeMenu = 0;
    }
  }

  // 选中菜单
  const onMenu = (val) => {
    state.activeMenu = val;
    resetGoodsPagination();
    getGoodsList();
  };

  // 加载服务列表
  async function getGoodsList() {
    const categoryId = activeCategory.value?.id;
    if (!categoryId || state.loadStatus === 'loading') {
      return;
    }
    state.loadStatus = 'loading';
    const res = await SpuApi.getSpuPage({
      categoryId,
      pageNo: state.pagination.pageNo,
      pageSize: state.pagination.pageSize,
    });
    if (res.code !== 0) {
      state.loadStatus = 'more';
      return;
    }
    if (activeCategory.value?.id !== categoryId) {
      return;
    }
    state.pagination.list = concat(state.pagination.list, res.data.list || []);
    state.pagination.total = res.data.total || 0;
    state.loadStatus = state.pagination.list.length < state.pagination.total ? 'more' : 'noMore';
  }

  // 加载更多服务
  function loadMore() {
    if (state.loadStatus === 'noMore' || state.loadStatus === 'loading') {
      return;
    }
    state.pagination.pageNo++;
    getGoodsList();
  }

  function findTopCategoryIndex(id) {
    if (!id) {
      return -1;
    }
    return state.categoryList.findIndex(
      (category) =>
        category.id === Number(id) || category.children?.some((child) => child.id === Number(id)),
    );
  }

  function initMenuIndex() {
    const appStore = sheep.$store('app');
    const tabbarParams = appStore.paramsForTabbar || {};
    const id = tabbarParams.id;
    appStore.clearParamsForTabbar();
    const foundIndex = findTopCategoryIndex(id);
    onMenu(foundIndex >= 0 ? foundIndex : 0);
  }

  function handleScrollToLower() {
    loadMore();
  }

  function goGoodsDetail(id) {
    sheep.$router.go('/pages/goods/index', { id });
  }

  function goCustomerService() {
    sheep.$router.go('/pages/chat/index');
  }

  function formatServicePrice(item) {
    const price =
      item?.promotionPrice > 0
        ? item.promotionPrice
        : Array.isArray(item?.price)
        ? item.price[0]
        : item?.price;
    return fen2yuan(Number(price) || 0);
  }

  onShow(async () => {
    await getList();
    if (state.categoryList.length) {
      initMenuIndex();
    }
  });
</script>

<style lang="scss" scoped>
  .s-category {
    min-height: 100%;
    background: #f3f4f6;
  }

  .three-level-wrap {
    background: #f3f4f6;
  }

  .side-menu-wrap {
    width: 180rpx;
    height: 100%;
    padding: 12rpx 0 24rpx 10rpx;
    box-sizing: border-box;
    background: #f7f7f7;
    position: fixed;
    left: 0;
    z-index: 2;

    .menu-item {
      width: 100%;
      min-height: 96rpx;
      padding: 0 14rpx 0 18rpx;
      margin-bottom: 8rpx;
      box-sizing: border-box;
      position: relative;
      border-radius: 0 22rpx 22rpx 0;
      transition: all 0.18s ease;

      &::before {
        content: '';
        width: 6rpx;
        height: 44rpx;
        border-radius: 999rpx;
        background: transparent;
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
      }

      .menu-title {
        width: 100%;
        line-height: 34rpx;
        font-size: 26rpx;
        font-weight: 400;
        color: #333333;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      &.menu-item-active {
        background: #ffffff;
        box-shadow: 0 8rpx 22rpx rgba(17, 17, 17, 0.06);

        &::before {
          background: #e60012;
        }

        .menu-title {
          color: #e60012;
          font-weight: 700;
        }
      }
    }
  }

  .goods-list-box {
    width: calc(100vw - 180rpx);
    margin-left: 180rpx;
    padding: 16rpx 18rpx 28rpx;
    box-sizing: border-box;
    background: #f3f4f6;
  }

  .category-content {
    padding-bottom: 24rpx;
  }

  .banner-card {
    width: 100%;
    height: 260rpx;
    border-radius: 24rpx;
    overflow: hidden;
    position: relative;
    background: #111111;
  }

  .banner-img {
    width: 100%;
    height: 260rpx;
    display: block;
  }

  .banner-mask {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: linear-gradient(120deg, rgba(0, 0, 0, 0.54), rgba(230, 0, 18, 0.1));
  }

  .banner-brand {
    position: absolute;
    left: 22rpx;
    bottom: 20rpx;
    color: #ffffff;
  }

  .brand-name {
    font-size: 30rpx;
    font-weight: 800;
    line-height: 40rpx;
  }

  .brand-subtitle {
    margin-top: 4rpx;
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.82);
  }

  .category-title-card {
    margin: 16rpx 0;
    padding: 20rpx 20rpx 20rpx 22rpx;
    border-radius: 20rpx;
    background: #ffffff;
    border-left: 6rpx solid #e60012;
    box-sizing: border-box;
  }

  .category-name {
    font-size: 34rpx;
    font-weight: 800;
    color: #111111;
    line-height: 44rpx;
  }

  .category-desc {
    margin-top: 6rpx;
    font-size: 24rpx;
    color: #999999;
    line-height: 32rpx;
  }

  .recommend-section {
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

  .service-goods-grid {
    display: flex;
    flex-wrap: wrap;
  }

  .service-goods-card {
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

  .goods-image-wrap {
    width: 100%;
    padding-top: 100%;
    position: relative;
    overflow: hidden;
    background: #f1f2f4;
  }

  .goods-image {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    display: block;
  }

  .goods-card-content {
    padding: 14rpx;
  }

  .goods-title {
    min-height: 68rpx;
    font-size: 26rpx;
    line-height: 34rpx;
    font-weight: 700;
    color: #111111;
  }

  .service-tags {
    display: flex;
    flex-wrap: wrap;
    margin-top: 10rpx;
  }

  .service-tag {
    margin-right: 6rpx;
    margin-bottom: 6rpx;
    padding: 3rpx 8rpx;
    border-radius: 999rpx;
    background: #eefaf1;
    color: #159947;
    font-size: 18rpx;
    line-height: 26rpx;
  }

  .goods-card-footer {
    margin-top: 10rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .goods-price {
    color: #e60012;
    font-size: 30rpx;
    line-height: 42rpx;
    font-weight: 800;
    font-family: OPPOSANS;
  }

  .price-unit {
    font-size: 22rpx;
    margin-right: 1rpx;
  }

  .order-btn {
    height: 48rpx;
    min-width: 112rpx;
    padding: 0 16rpx;
    border-radius: 999rpx;
    background: #e60012;
    color: #ffffff;
    font-size: 22rpx;
    font-weight: 700;
    line-height: 48rpx;
  }

  .service-empty {
    min-height: 300rpx;
    padding: 34rpx 20rpx;
    border-radius: 20rpx;
    background: #ffffff;
    box-sizing: border-box;
  }

  .empty-icon {
    width: 150rpx;
    height: 150rpx;
    opacity: 0.86;
  }

  .empty-title {
    margin: 16rpx 0 20rpx;
    font-size: 26rpx;
    color: #666666;
  }

  .contact-btn {
    height: 56rpx;
    padding: 0 34rpx;
    border-radius: 999rpx;
    background: #111111;
    color: #ffffff;
    font-size: 24rpx;
    line-height: 56rpx;
  }
</style>
