import { DeltaAppMode, DeltaRoute } from '@/sheep/helper/delta';

export const DeltaNotificationBizType = {
  SERVICE_ORDER: 'SERVICE_ORDER',
  SETTLEMENT: 'SETTLEMENT',
  ORDER_MARKET_LISTING: 'ORDER_MARKET_LISTING',
  AFTER_SALE: 'AFTER_SALE',
  REFUND: 'REFUND',
};

const notificationTypeMap = {
  SYSTEM: '系统通知',
  ORDER: '订单通知',
  SETTLEMENT: '结算通知',
  REFUND: '退款通知',
  REMINDER: '提醒通知',
};

const workerOrderDetailTitles = new Set([
  '订单已派给你',
  '你已成功接单',
  '老板要求返工',
  '打手待开始提醒',
  '服务无进度提醒',
]);

const workerOrderListTitles = new Set(['订单已改派']);

const buyerOrderDetailTitles = new Set([
  '打手已开始服务',
  '打手已提交完成',
  '待验收提醒',
  '取消申请已通过',
  '取消申请已驳回',
  '售后仲裁已完成',
]);

function normalizeBizType(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function hasBizId(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function createTarget(url, params, guard, actionText) {
  return { url, params: params || {}, guard, actionText };
}

export function getDeltaNotificationTypeText(type) {
  return notificationTypeMap[String(type || '').toUpperCase()] || '站内通知';
}

/**
 * 后端通知未返回 route、payload 或 recipientType。
 * 这里仅使用真实 bizType、bizId，并用稳定的后端模板标题区分买家与打手页面。
 */
export function resolveDeltaNotificationTarget(notification = {}, currentMode = DeltaAppMode.SHOP) {
  const bizType = normalizeBizType(notification.bizType);
  const bizId = notification.bizId;
  const title = String(notification.title || '').trim();

  if (bizType === DeltaNotificationBizType.SETTLEMENT) {
    return hasBizId(bizId)
      ? createTarget(
          '/pages-worker/income/detail',
          { id: bizId },
          'worker',
          '查看结算详情',
        )
      : createTarget(DeltaRoute.WORKER_INCOME, {}, 'worker', '查看收入结算');
  }

  if (bizType === DeltaNotificationBizType.ORDER_MARKET_LISTING) {
    return hasBizId(bizId)
      ? createTarget(
          DeltaRoute.CLUB_ORDER_DETAIL,
          { listingId: bizId },
          'club',
          '查看俱乐部订单',
        )
      : createTarget(DeltaRoute.CLUB_CLAIMED, {}, 'club', '查看已接挂牌');
  }

  if (bizType === DeltaNotificationBizType.AFTER_SALE) {
    return hasBizId(bizId)
      ? createTarget(
          '/pages-delta/after-sale/detail',
          { id: bizId },
          'buyer',
          '查看售后详情',
        )
      : createTarget(DeltaRoute.DELTA_AFTER_SALES, {}, 'buyer', '查看售后记录');
  }

  if (bizType === DeltaNotificationBizType.REFUND) {
    return hasBizId(bizId)
      ? createTarget(
          '/pages-delta/refund/detail',
          { id: bizId },
          'buyer',
          '查看退款详情',
        )
      : createTarget(DeltaRoute.DELTA_REFUNDS, {}, 'buyer', '查看退款记录');
  }

  if (bizType !== DeltaNotificationBizType.SERVICE_ORDER) return null;

  if (title === '服务已验收完成') {
    // 该通知的 bizId 是服务订单 ID，不是结算 ID，只能安全进入收入列表。
    return createTarget(DeltaRoute.WORKER_INCOME, {}, 'worker', '查看收入结算');
  }

  if (workerOrderDetailTitles.has(title)) {
    return hasBizId(bizId)
      ? createTarget(
          '/pages-worker/order/detail',
          { id: bizId },
          'worker',
          '查看任务详情',
        )
      : createTarget(DeltaRoute.WORKER_ORDERS, {}, 'worker', '查看我的任务');
  }

  if (workerOrderListTitles.has(title)) {
    return createTarget(DeltaRoute.WORKER_ORDERS, {}, 'worker', '查看我的任务');
  }

  if (buyerOrderDetailTitles.has(title)) {
    return hasBizId(bizId)
      ? createTarget(
          '/pages-delta/service-order/detail',
          { id: bizId },
          'buyer',
          '查看服务订单',
        )
      : createTarget(DeltaRoute.DELTA_SERVICE_ORDERS, {}, 'buyer', '查看服务订单');
  }

  if (currentMode === DeltaAppMode.WORKER) {
    return hasBizId(bizId)
      ? createTarget(
          '/pages-worker/order/detail',
          { id: bizId },
          'worker',
          '查看任务详情',
        )
      : createTarget(DeltaRoute.WORKER_ORDERS, {}, 'worker', '查看我的任务');
  }

  if (currentMode === DeltaAppMode.SHOP) {
    return hasBizId(bizId)
      ? createTarget(
          '/pages-delta/service-order/detail',
          { id: bizId },
          'buyer',
          '查看服务订单',
        )
      : createTarget(DeltaRoute.DELTA_SERVICE_ORDERS, {}, 'buyer', '查看服务订单');
  }

  return null;
}
