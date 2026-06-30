<!-- FAQ 常见问题 / Delta 说明页 -->
<template>
  <s-layout
    :bgStyle="{ color: isIntro ? '#050507' : '#FFF' }"
    :class="['set-wrap', { 'intro-mode': isIntro }]"
    :title="pageTitle"
  >
    <view v-if="isIntro" class="delta-intro">
      <view class="intro-banner">
        <image
          v-if="currentIntro.banner"
          class="banner-img"
          :src="sheep.$url.cdn(currentIntro.banner)"
          mode="aspectFill"
        />
        <view v-else class="banner-placeholder">
          <view class="banner-kicker">Delta 先锋俱乐部</view>
          <view class="banner-title">{{ currentIntro.title }}</view>
          <view class="banner-subtitle">{{ currentIntro.subtitle }}</view>
        </view>
      </view>

      <view class="intro-title-card">
        <view class="intro-title">{{ currentIntro.title }}</view>
        <view class="intro-subtitle">{{ currentIntro.subtitle }}</view>
      </view>

      <view class="intro-tags">
        <text class="intro-tag" v-for="tag in currentIntro.tags" :key="tag">{{ tag }}</text>
      </view>

      <view class="intro-card">
        <view class="card-title">服务说明</view>
        <view class="card-text">{{ currentIntro.overview }}</view>
      </view>

      <view class="intro-card">
        <view class="card-title">适合人群</view>
        <view class="list-item" v-for="item in currentIntro.suitableFor" :key="item">
          {{ item }}
        </view>
      </view>

      <view class="intro-card">
        <view class="card-title">服务内容</view>
        <view class="item-grid">
          <view class="grid-item" v-for="item in currentIntro.serviceItems" :key="item">
            {{ item }}
          </view>
        </view>
      </view>

      <view class="intro-card">
        <view class="card-title">服务流程</view>
        <view class="step-item" v-for="(step, index) in currentIntro.steps" :key="step.title">
          <view class="step-no">{{ formatIndex(index) }}</view>
          <view class="step-content">
            <view class="step-title">{{ step.title }}</view>
            <view class="step-desc">{{ step.desc }}</view>
          </view>
        </view>
      </view>

      <view class="intro-card">
        <view class="card-title">下单须知</view>
        <view class="list-item" v-for="item in currentIntro.notices" :key="item">
          {{ item }}
        </view>
      </view>

      <view class="intro-card">
        <view class="card-title">常见问题</view>
        <view class="faq-item" v-for="item in currentIntro.faqs" :key="item.question">
          <view class="faq-question">Q：{{ item.question }}</view>
          <view class="faq-answer">A：{{ item.answer }}</view>
        </view>
      </view>

      <view class="intro-actions">
        <button class="ss-reset-button action-btn contact" @tap="goContact">联系客服</button>
        <button class="ss-reset-button action-btn order" @tap="goOrder">去下单</button>
      </view>
    </view>

    <block v-else>
      <uni-collapse>
        <uni-collapse-item v-for="(item, index) in state.list" :key="item">
          <template v-slot:title>
            <view class="ss-flex ss-col-center header">
              <view class="ss-m-l-20 ss-m-r-20 icon">
                <view class="rectangle">
                  <view class="num ss-flex ss-row-center ss-col-center">
                    {{ index + 1 < 10 ? '0' + (index + 1) : index + 1 }}
                  </view>
                </view>
                <view class="triangle"> </view>
              </view>
              <view class="title ss-m-t-36 ss-m-b-36">
                {{ item.title }}
              </view>
            </view>
          </template>
          <view class="content ss-p-l-78 ss-p-r-40 ss-p-b-50 ss-p-t-20">
            <text class="text">{{ item.content }}</text>
          </view>
        </uni-collapse-item>
      </uni-collapse>
      <s-empty
        v-if="state.list.length === 0 && !state.loading"
        text="暂无常见问题"
        icon="/static/collect-empty.png"
      />
    </block>
  </s-layout>
</template>

<script setup>
  import { onLoad } from '@dcloudio/uni-app';
  import { computed, reactive } from 'vue';
  import sheep from '@/sheep';

  const introMap = {
    process: {
      title: '服务流程介绍',
      subtitle: '下单清晰｜过程透明｜售后保障',
      banner: '',
      tags: ['价格透明', '流程清晰', '售后有据'],
      overview:
        'Delta 先锋俱乐部采用先咨询、再确认、后下单的服务流程，帮助用户明确需求、减少误解，并保留必要的服务记录。',
      suitableFor: [
        '第一次了解 Delta 先锋服务的用户',
        '不确定应该选择哪个套餐的用户',
        '希望下单流程更清楚的用户',
      ],
      serviceItems: [
        '客服确认需求',
        '推荐合适套餐',
        '协助完成下单',
        '服务过程跟进',
        '完成后进行验收',
        '异常问题售后处理',
      ],
      steps: [
        {
          title: '联系客服',
          desc: '下单前先确认区服、模式、时间和服务需求。',
        },
        {
          title: '确认套餐',
          desc: '客服根据需求推荐对应服务套餐。',
        },
        {
          title: '下单支付',
          desc: '选择商品规格并完成下单。',
        },
        {
          title: '安排服务',
          desc: '客服根据订单内容安排服务。',
        },
        {
          title: '完成验收',
          desc: '服务完成后进行确认。',
        },
        {
          title: '售后处理',
          desc: '如有问题，第一时间联系客服反馈。',
        },
      ],
      notices: [
        '下单前请先联系客服确认需求。',
        '不同套餐服务内容不同，请以商品详情页说明为准。',
        '服务过程中请保持联系方式畅通。',
        '禁止未成年人下单。',
        '拒绝外挂、脚本、黑号等违规行为。',
      ],
      faqs: [
        {
          question: '不确定买哪个套餐怎么办？',
          answer: '建议先联系客服，说明你的需求后再选择套餐。',
        },
        {
          question: '下单后多久开始？',
          answer: '以客服实际安排为准，具体时间下单前可先确认。',
        },
        {
          question: '服务过程中有问题怎么办？',
          answer: '请第一时间联系客服，客服会根据订单和沟通记录处理。',
        },
      ],
    },
    promise: {
      title: '服务保障承诺',
      subtitle: '价格透明｜流程清晰｜售后有据',
      banner: '',
      tags: ['拒绝外挂', '拒绝脚本', '售后有据'],
      overview:
        'Delta 先锋俱乐部坚持绿色组队和正规流程，所有服务以商品详情、客服确认和订单记录为准。',
      suitableFor: ['重视流程安全的用户', '希望下单前明确规则的用户', '需要售后说明的用户'],
      serviceItems: [
        '拒绝外挂',
        '拒绝脚本',
        '拒绝黑号',
        '禁止未成年人下单',
        '流程留痕',
        '售后有据',
      ],
      steps: [
        {
          title: '先行咨询',
          desc: '下单前确认服务范围、规则边界和注意事项。',
        },
        {
          title: '明确规则',
          desc: '客服说明可支持内容和禁止事项。',
        },
        {
          title: '订单留痕',
          desc: '以商品详情、客服确认和订单记录作为服务依据。',
        },
        {
          title: '售后反馈',
          desc: '如遇异常，按沟通记录和订单内容协助处理。',
        },
      ],
      notices: [
        '平台不支持任何外挂、脚本、黑号相关需求。',
        '禁止未成年人下单。',
        '售后处理以订单记录和沟通记录为准。',
        '下单前请先联系客服确认需求。',
      ],
      faqs: [
        {
          question: '可以提出特殊服务要求吗？',
          answer: '可以先联系客服确认，但违规需求不会受理。',
        },
        {
          question: '售后以什么为准？',
          answer: '以商品详情、客服确认内容和订单记录为准。',
        },
      ],
    },
    newUser: {
      title: '新人专区介绍',
      subtitle: '第一次下单推荐先看这里',
      banner: '',
      tags: ['新人可看', '低门槛体验', '客服确认'],
      overview: '新人专区适合第一次了解 Delta 先锋俱乐部的用户，建议先选择低门槛体验服务。',
      suitableFor: ['第一次下单的用户', '不确定服务流程的用户', '想先体验再决定的用户'],
      serviceItems: ['新人体验服务', '客服需求确认', '推荐合适套餐', '下单流程说明'],
      steps: [
        {
          title: '了解服务',
          desc: '先浏览新人专区和服务说明，确认基本流程。',
        },
        {
          title: '联系客服',
          desc: '说明区服、时间、模式和体验需求。',
        },
        {
          title: '选择套餐',
          desc: '优先选择低门槛体验服务，避免盲目下单。',
        },
        {
          title: '完成体验',
          desc: '服务结束后再决定是否选择更完整套餐。',
        },
      ],
      notices: ['新人建议先联系客服。', '不确定买哪个套餐时，不要盲目下单。', '禁止未成年人下单。'],
      faqs: [
        {
          question: '第一次下单应该买什么？',
          answer: '建议先选新人体验或联系客服推荐低门槛服务。',
        },
        {
          question: '可以先问清楚再下单吗？',
          answer: '可以，Delta 先锋俱乐部建议先咨询、再确认、后下单。',
        },
      ],
    },
    play: {
      title: '陪玩服务介绍',
      subtitle: '轻松组队｜娱乐体验｜客服确认',
      banner: '',
      tags: ['娱乐体验', '轻松组队', '客服确认'],
      overview:
        '陪玩服务适合想轻松组队、娱乐体验的用户。下单前建议说明区服、时间、模式和服务要求。',
      suitableFor: ['想轻松组队的用户', '想娱乐体验的用户', '不想单排的用户'],
      serviceItems: ['娱乐陪玩', '组队体验', '过程沟通', '客服确认'],
      steps: [
        {
          title: '说明需求',
          desc: '联系客服确认区服、模式、时间和偏好。',
        },
        {
          title: '选择套餐',
          desc: '根据体验时长和服务内容选择对应套餐。',
        },
        {
          title: '安排陪玩',
          desc: '客服根据订单内容安排服务。',
        },
        {
          title: '体验反馈',
          desc: '服务完成后可反馈体验或咨询后续服务。',
        },
      ],
      notices: ['不同陪玩套餐服务内容不同。', '下单前请说明需求。', '特殊需求请先联系客服确认。'],
      faqs: [
        {
          question: '可以指定时间吗？',
          answer: '建议下单前先联系客服确认可安排时间。',
        },
        {
          question: '陪玩套餐内容一样吗？',
          answer: '不同套餐内容不同，请以商品详情和客服确认为准。',
        },
      ],
    },
    escort: {
      title: '护航服务介绍',
      subtitle: '稳定安排｜流程清晰｜售后有据',
      banner: '',
      tags: ['护航服务', '稳定安排', '售后有据'],
      overview: '护航服务适合需要更高强度陪同的用户，服务内容以商品详情和客服确认为准。',
      suitableFor: ['需要更高强度陪同的用户', '希望有人协助组队的用户', '对流程和售后有要求的用户'],
      serviceItems: ['护航服务', '客服确认', '过程跟进', '完成验收'],
      steps: [
        {
          title: '确认目标',
          desc: '先与客服确认服务目标、时间和可支持范围。',
        },
        {
          title: '匹配套餐',
          desc: '根据需求选择对应护航服务。',
        },
        {
          title: '过程跟进',
          desc: '服务过程中保持沟通，异常情况及时反馈。',
        },
        {
          title: '完成验收',
          desc: '服务结束后按订单内容进行确认。',
        },
      ],
      notices: [
        '下单前请确认需求和时间。',
        '服务过程中如遇异常，请及时联系客服。',
        '拒绝外挂、脚本、黑号等违规行为。',
      ],
      faqs: [
        {
          question: '护航和陪玩有什么区别？',
          answer: '护航通常更强调目标和过程跟进，具体以商品详情和客服确认为准。',
        },
        {
          question: '遇到异常怎么办？',
          answer: '请及时联系客服，客服会结合订单和沟通记录处理。',
        },
      ],
    },
    fun: {
      title: '趣味单介绍',
      subtitle: '娱乐玩法｜趣味体验｜先问客服',
      banner: '',
      tags: ['趣味玩法', '娱乐体验', '先问客服'],
      overview: '趣味单适合想体验特殊玩法的用户，不同趣味玩法规则不同，建议下单前先联系客服确认。',
      suitableFor: ['想体验特殊玩法的用户', '想尝试娱乐玩法的用户', '对玩法有明确需求的用户'],
      serviceItems: ['趣味玩法说明', '客服规则确认', '服务安排', '售后反馈'],
      steps: [
        {
          title: '描述玩法',
          desc: '先向客服说明想体验的趣味玩法。',
        },
        {
          title: '确认规则',
          desc: '客服确认玩法是否可安排以及注意事项。',
        },
        {
          title: '下单安排',
          desc: '选择对应服务后完成下单。',
        },
        {
          title: '反馈体验',
          desc: '服务结束后可反馈体验或咨询其他玩法。',
        },
      ],
      notices: ['不同趣味玩法规则不同。', '特殊玩法以客服确认结果为准。', '禁止未成年人下单。'],
      faqs: [
        {
          question: '趣味玩法都能安排吗？',
          answer: '不一定，特殊玩法需要先联系客服确认。',
        },
        {
          question: '可以临时改玩法吗？',
          answer: '请先联系客服确认，实际以订单内容和服务安排为准。',
        },
      ],
    },
    afterSale: {
      title: '售后说明',
      subtitle: '问题反馈｜订单记录｜客服处理',
      banner: '',
      tags: ['售后处理', '订单留痕', '客服反馈'],
      overview:
        '售后说明用于帮助用户了解服务过程中遇到问题时应该如何反馈、如何处理，以及处理依据是什么。Delta 先锋俱乐部的售后处理以订单记录、商品详情、客服确认内容和沟通记录为主要依据。',
      suitableFor: [
        '服务过程中遇到问题的用户',
        '想了解售后规则的用户',
        '下单前想确认售后保障的用户',
        '对订单处理有疑问的用户',
      ],
      serviceItems: [
        '订单问题反馈',
        '服务过程异常反馈',
        '商品详情说明核对',
        '客服沟通记录核对',
        '售后方案沟通',
        '异常情况处理',
      ],
      steps: [
        {
          title: '提交反馈',
          desc: '发现问题后第一时间联系客服。',
        },
        {
          title: '说明情况',
          desc: '提供订单信息、问题描述和相关截图。',
        },
        {
          title: '核对记录',
          desc: '客服根据订单记录、商品详情和沟通记录进行核对。',
        },
        {
          title: '沟通方案',
          desc: '客服根据实际情况给出处理建议。',
        },
        {
          title: '结果确认',
          desc: '双方确认处理结果。',
        },
        {
          title: '后续跟进',
          desc: '如仍有问题，可继续联系客服反馈。',
        },
      ],
      notices: [
        '售后处理以订单记录、商品详情和客服确认内容为准。',
        '服务过程中请保留必要沟通记录。',
        '如遇异常情况，请第一时间联系客服，不要拖延。',
        '因用户未提前说明特殊需求导致的问题，需要根据实际情况协商处理。',
        '禁止未成年人下单。',
        '拒绝外挂、脚本、黑号等违规行为。',
      ],
      faqs: [
        {
          question: '服务过程中有问题怎么办？',
          answer: '请第一时间联系客服，并说明订单信息和具体问题。',
        },
        {
          question: '售后处理依据是什么？',
          answer: '主要依据订单记录、商品详情、客服确认内容和沟通记录。',
        },
        {
          question: '如果我没有提前说明特殊需求怎么办？',
          answer: '需要根据实际情况和服务进度协商处理。',
        },
        {
          question: '售后一定能退款吗？',
          answer: '售后结果需要根据订单情况、服务进度、商品说明和沟通记录综合判断，不能一概而论。',
        },
      ],
    },
  };

  const state = reactive({
    list: [],
    loading: true,
    type: '',
  });

  const isIntro = computed(() => Boolean(state.type && introMap[state.type]));
  const currentIntro = computed(() => introMap[state.type] || {});
  const pageTitle = computed(() => (isIntro.value ? currentIntro.value.title : '常见问题'));

  async function getFaqList() {
    const { error, data } = await sheep.$api.data.faq();
    if (error === 0) {
      state.list = data;
      state.loading = false;
    }
  }

  function formatIndex(index) {
    return index + 1 < 10 ? `0${index + 1}` : index + 1;
  }

  function goContact() {
    sheep.$router.go('/pages/chat/index');
  }

  function goOrder() {
    sheep.$router.go('/pages/index/category');
  }

  onLoad((options = {}) => {
    if (options.type && introMap[options.type]) {
      state.type = options.type;
      state.loading = false;
      return;
    }

    // 保留原 FAQ 默认逻辑：无 type 时继续跳转到常见问题富文本页。
    if (true) {
      sheep.$router.go('/pages/public/richtext', {
        title: '常见问题',
      });
      return;
    }
    getFaqList();
  });
</script>

<style lang="scss" scoped>
  .delta-intro {
    min-height: 100vh;
    padding: 24rpx 24rpx 36rpx;
    box-sizing: border-box;
    background: #050507;
  }

  .intro-banner {
    min-height: 320rpx;
    border-radius: 24rpx;
    overflow: hidden;
    border: 1rpx solid rgba(230, 0, 18, 0.35);
    background: #101014;
  }

  .banner-img {
    width: 100%;
    height: 320rpx;
    display: block;
  }

  .banner-placeholder {
    min-height: 320rpx;
    padding: 40rpx 32rpx;
    box-sizing: border-box;
    background: linear-gradient(135deg, rgba(230, 0, 18, 0.75), rgba(5, 5, 7, 0.15) 45%),
      radial-gradient(circle at 85% 18%, rgba(255, 59, 48, 0.42), transparent 28%),
      linear-gradient(145deg, #15151b 0%, #050507 100%);
  }

  .banner-kicker {
    display: inline-flex;
    padding: 8rpx 16rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.1);
    border: 1rpx solid rgba(255, 255, 255, 0.18);
    color: #ffffff;
    font-size: 22rpx;
    line-height: 30rpx;
  }

  .banner-title {
    margin-top: 46rpx;
    color: #ffffff;
    font-size: 44rpx;
    line-height: 58rpx;
    font-weight: 800;
  }

  .banner-subtitle {
    margin-top: 12rpx;
    color: #d6d6d6;
    font-size: 26rpx;
    line-height: 36rpx;
  }

  .intro-title-card,
  .intro-card {
    margin-top: 24rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: #101014;
    border: 1rpx solid rgba(230, 0, 18, 0.35);
    box-sizing: border-box;
  }

  .intro-title {
    color: #ffffff;
    font-size: 38rpx;
    line-height: 52rpx;
    font-weight: 800;
  }

  .intro-subtitle {
    margin-top: 8rpx;
    color: #b6b6b6;
    font-size: 24rpx;
    line-height: 34rpx;
  }

  .intro-tags {
    display: flex;
    flex-wrap: wrap;
    margin-top: 20rpx;
  }

  .intro-tag {
    margin: 0 12rpx 12rpx 0;
    padding: 8rpx 18rpx;
    border-radius: 999rpx;
    background: rgba(230, 0, 18, 0.14);
    border: 1rpx solid rgba(230, 0, 18, 0.42);
    color: #ff5a52;
    font-size: 22rpx;
    line-height: 30rpx;
    font-weight: 700;
  }

  .card-title {
    position: relative;
    padding-left: 18rpx;
    color: #ffffff;
    font-size: 30rpx;
    line-height: 40rpx;
    font-weight: 800;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8rpx;
      width: 6rpx;
      height: 24rpx;
      border-radius: 999rpx;
      background: #e60012;
    }
  }

  .card-text,
  .list-item,
  .step-desc,
  .faq-answer {
    color: #b6b6b6;
    font-size: 26rpx;
    line-height: 42rpx;
  }

  .card-text {
    margin-top: 18rpx;
  }

  .list-item {
    margin-top: 16rpx;
    padding-left: 24rpx;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 17rpx;
      width: 8rpx;
      height: 8rpx;
      border-radius: 50%;
      background: #e60012;
    }
  }

  .item-grid {
    display: flex;
    flex-wrap: wrap;
    margin-top: 18rpx;
  }

  .grid-item {
    width: calc((100% - 14rpx) / 2);
    margin: 0 14rpx 14rpx 0;
    padding: 18rpx 16rpx;
    border-radius: 18rpx;
    background: rgba(255, 255, 255, 0.05);
    border: 1rpx solid rgba(255, 255, 255, 0.08);
    box-sizing: border-box;
    color: #ffffff;
    font-size: 24rpx;
    line-height: 34rpx;

    &:nth-child(2n) {
      margin-right: 0;
    }
  }

  .step-item {
    display: flex;
    margin-top: 22rpx;
  }

  .step-no {
    width: 56rpx;
    height: 56rpx;
    flex-shrink: 0;
    border-radius: 18rpx;
    background: #e60012;
    color: #ffffff;
    font-size: 24rpx;
    line-height: 56rpx;
    text-align: center;
    font-weight: 800;
  }

  .step-content {
    flex: 1;
    min-width: 0;
    margin-left: 18rpx;
  }

  .step-title {
    color: #ffffff;
    font-size: 27rpx;
    line-height: 38rpx;
    font-weight: 800;
  }

  .faq-item {
    margin-top: 20rpx;
    padding: 18rpx;
    border-radius: 18rpx;
    background: rgba(255, 255, 255, 0.05);
  }

  .faq-question {
    color: #ffffff;
    font-size: 26rpx;
    line-height: 38rpx;
    font-weight: 800;
  }

  .faq-answer {
    margin-top: 8rpx;
  }

  .intro-actions {
    display: flex;
    margin-top: 28rpx;
    padding-bottom: 18rpx;
  }

  .action-btn {
    flex: 1;
    height: 76rpx;
    border-radius: 999rpx;
    font-size: 28rpx;
    line-height: 76rpx;
    font-weight: 800;
  }

  .action-btn.contact {
    margin-right: 18rpx;
    background: #19191f;
    border: 1rpx solid rgba(255, 255, 255, 0.18);
    color: #ffffff;
  }

  .action-btn.order {
    background: #e60012;
    color: #ffffff;
  }

  .header {
    .title {
      font-size: 28rpx;
      font-weight: 500;
      color: #333333;
      line-height: 30rpx;
      max-width: 688rpx;
    }

    .icon {
      position: relative;
      width: 40rpx;
      height: 40rpx;

      .rectangle {
        position: absolute;
        left: 0;
        top: 0;
        width: 40rpx;
        height: 36rpx;
        background: var(--ui-BG-Main);
        border-radius: 4px;

        .num {
          width: 100%;
          height: 100%;
          font-size: 24rpx;
          font-weight: 500;
          color: var(--ui-BG);
          line-height: 32rpx;
        }
      }

      .triangle {
        width: 0;
        height: 0;
        border-left: 4rpx solid transparent;
        border-right: 4rpx solid transparent;
        border-top: 8rpx solid var(--ui-BG-Main);
        position: absolute;
        left: 16rpx;
        bottom: -4rpx;
      }
    }
  }

  .content {
    border-bottom: 1rpx solid #dfdfdf;

    .text {
      font-size: 26rpx;
      color: #666666;
    }
  }
</style>
