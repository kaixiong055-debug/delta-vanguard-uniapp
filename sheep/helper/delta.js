export const DELTA_APP_MODE_KEY = 'delta_app_mode';

export const DeltaAppMode = {
  SHOP: 'shop',
  WORKER: 'worker',
  CLUB: 'club',
};

export const DeltaClubApplicationStatus = {
  NOT_APPLIED: -1,
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  CANCELED: 3,
};

export const DeltaClubBusinessStatus = {
  DISABLED: 0,
  ENABLED: 1,
};

export const DeltaAuditStatus = {
  NOT_APPLIED: 0,
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  DISABLED: 4,
  BLACKLISTED: 5,
};

export const DeltaWorkStatus = {
  OFFLINE: 0,
  ONLINE: 1,
  BUSY: 2,
  PAUSED: 3,
};

export const DeltaDispatchMode = {
  DESIGNATED: 1,
  ADMIN_ASSIGN: 2,
  PUBLIC_CLAIM: 3,
  CLUB_ASSIGN: 4,
};

export const dispatchModeMap = {
  [DeltaDispatchMode.DESIGNATED]: '客户指定',
  [DeltaDispatchMode.ADMIN_ASSIGN]: '客服派单',
  [DeltaDispatchMode.PUBLIC_CLAIM]: '接单大厅',
  [DeltaDispatchMode.CLUB_ASSIGN]: '俱乐部分派',
};

export const DeltaRoute = {
  SHOP_USER: '/pages/index/user',
  WORKER_HOME: '/pages-worker/home/index',
  WORKER_APPLY: '/pages-worker/apply/index',
  WORKER_APPLY_STATUS: '/pages-worker/apply/status',
  WORKER_PROFILE: '/pages-worker/profile/index',
  WORKER_PROFILE_EDIT: '/pages-worker/profile/edit',
  WORKER_POOL: '/pages-worker/pool/index',
  WORKER_ORDERS: '/pages-worker/order/index',
  WORKER_INCOME: '/pages-worker/income/index',
  DELTA_SERVICE_ORDERS: '/pages-delta/service-order/index',
  DELTA_CANCELS: '/pages-delta/cancel/index',
  DELTA_AFTER_SALES: '/pages-delta/after-sale/index',
  DELTA_REFUNDS: '/pages-delta/refund/index',
  DELTA_NOTIFICATIONS: '/pages-delta/notification/index',
  CLUB_APPLY: '/pages-delta/club/apply/index',
  CLUB_APPLY_STATUS: '/pages-delta/club/apply/status',
  CLUB_HOME: '/pages-delta/club/home/index',
  CLUB_MARKET: '/pages-delta/club/market/index',
  CLUB_MARKET_DETAIL: '/pages-delta/club/market/detail',
  CLUB_CLAIMED: '/pages-delta/club/claimed/index',
  CLUB_ORDER_DETAIL: '/pages-delta/club/order/detail',
  CLUB_ORDER_WORKER_SELECT: '/pages-delta/club/order/worker-select',
};

export const ServiceOrderStatus = {
  PENDING_DISPATCH: 10,
  WAITING_DESIGNATED: 20,
  POOL_PENDING: 30,
  ACCEPTED_PENDING_START: 40,
  IN_PROGRESS: 50,
  WORKER_SUBMITTED: 60,
  PENDING_VERIFICATION: 70,
  COMPLETED: 80,
  AFTER_SALE: 90,
  DISPUTE: 100,
  CANCELED: 110,
};

export const serviceOrderStatusMap = {
  10: '待派单',
  20: '等待指定打手确认',
  30: '接单大厅待领取',
  40: '已接单待开始',
  50: '服务进行中',
  60: '打手已提交完成',
  70: '待客户或客服验收',
  80: '已完成',
  90: '售后处理中',
  100: '纠纷处理中',
  110: '已取消',
};

export const serviceTypeMap = { 1: '陪玩', 2: '护航', 3: '趣味单' };
export const deviceTypeMap = { 1: '手机', 2: '平板', 3: 'PC' };
export const progressTypeMap = { 1: '开始服务', 2: '进度更新', 3: '异常报告', 4: '提交完成' };
export const evidenceTypeMap = { 1: '截图', 2: '视频', 3: '文字说明', 4: '文件' };

export const cancelableStatuses = [10, 30, 40];
export const afterSaleStatuses = [50, 60, 70, 80];
export const acceptableStatuses = [60];

export function getServiceOrderStatusText(status) {
  return serviceOrderStatusMap[Number(status)] || '-';
}

export function getServiceTypeText(type) {
  return serviceTypeMap[Number(type)] || '-';
}

export function getDeviceTypeText(type) {
  return deviceTypeMap[Number(type)] || '-';
}

export function getDispatchModeText(mode) {
  return dispatchModeMap[Number(mode)] || '-';
}

export function formatDeltaAmount(amount) {
  const value = Number(amount || 0);
  return `¥${(value / 100).toFixed(2)}`;
}

export function formatDeltaTime(value) {
  return value ? String(value).replace('T', ' ').slice(0, 19) : '-';
}

export function getClubApplicationStatusInfo(identity = {}) {
  let info;
  if (identity.hasApplication !== true) {
    info = {
      status: DeltaClubApplicationStatus.NOT_APPLIED,
      title: '未申请',
      entryText: '申请入驻',
      desc: '提交资料后等待平台审核',
    };
  } else {
    const status = Number(identity.applicationStatus);
    const statusMap = {
      [DeltaClubApplicationStatus.PENDING]: {
        status,
        title: '待审核',
        entryText: '查看审核',
        desc: '平台正在审核你的入驻申请',
      },
      [DeltaClubApplicationStatus.APPROVED]: {
        status,
        title: '已通过',
        entryText: '查看审核',
        desc: '审核已通过，俱乐部资料正在生成',
      },
      [DeltaClubApplicationStatus.REJECTED]: {
        status,
        title: '已拒绝',
        entryText: '查看原因',
        desc: identity.rejectReason || '可根据审核意见重新提交申请',
      },
      [DeltaClubApplicationStatus.CANCELED]: {
        status,
        title: '已撤销',
        entryText: '重新申请',
        desc: '本次申请已撤销，可重新提交资料',
      },
    };
    info = statusMap[status] || {
      status,
      title: identity.applicationStatusName || '申请状态未知',
      entryText: '查看审核',
      desc: '请查看最新审核状态',
    };
  }
  if (identity.isClubOwner === true) {
    return {
      ...info,
      entryText:
        Number(identity.businessStatus) === DeltaClubBusinessStatus.ENABLED
          ? '进入俱乐部'
          : '查看俱乐部',
      desc:
        Number(identity.businessStatus) === DeltaClubBusinessStatus.ENABLED
          ? '管理俱乐部并查看平台挂牌'
          : '当前俱乐部已停用',
    };
  }
  return info;
}

export function getClubBusinessStatusText(status) {
  if (Number(status) === DeltaClubBusinessStatus.ENABLED) return '启用';
  if (Number(status) === DeltaClubBusinessStatus.DISABLED) return '停用';
  return '-';
}

export function getEnabledClubServiceScopes(identity = {}) {
  const scopes = Array.isArray(identity.serviceScopes) ? identity.serviceScopes : [];
  return scopes.filter((scope) => scope.enabled === true || Number(scope.enabled) === 1);
}

export function formatCommissionRate(rate) {
  if (rate === null || rate === undefined || rate === '') return '-';
  const value = Number(rate);
  return Number.isFinite(value) ? `${(value / 100).toFixed(2)}%` : '-';
}

export const workerStatusMap = {
  [DeltaAuditStatus.NOT_APPLIED]: {
    key: 'notApplied',
    title: '未申请',
    entryText: '申请成为打手',
    desc: '提交资料后等待平台审核',
  },
  [DeltaAuditStatus.PENDING]: {
    key: 'pending',
    title: '审核中',
    entryText: '查看审核状态',
    desc: '平台正在审核你的打手申请',
  },
  [DeltaAuditStatus.APPROVED]: {
    key: 'approved',
    title: '审核已通过',
    entryText: '进入打手工作台',
    desc: '身份校验通过后可进入打手端',
  },
  [DeltaAuditStatus.REJECTED]: {
    key: 'rejected',
    title: '审核未通过',
    entryText: '查看驳回原因',
    desc: '可根据原因重新提交申请',
  },
  [DeltaAuditStatus.DISABLED]: {
    key: 'disabled',
    title: '已停用',
    entryText: '查看账号状态',
    desc: '当前打手账号已停用',
  },
  [DeltaAuditStatus.BLACKLISTED]: {
    key: 'blacklisted',
    title: '已拉黑',
    entryText: '查看账号状态',
    desc: '当前账号暂不可进入打手端',
  },
};

export const workStatusMap = {
  [DeltaWorkStatus.OFFLINE]: '离线',
  [DeltaWorkStatus.ONLINE]: '在线',
  [DeltaWorkStatus.BUSY]: '忙碌',
  [DeltaWorkStatus.PAUSED]: '暂停接单',
};

export function getWorkerAuditStatus(source = {}) {
  const status =
    source.auditStatus ??
    source.applicationStatus ??
    source.status ??
    (source.isWorker ? DeltaAuditStatus.APPROVED : DeltaAuditStatus.NOT_APPLIED);
  return Number(status);
}

export function getWorkerStatusInfo(source = {}) {
  return (
    workerStatusMap[getWorkerAuditStatus(source)] || workerStatusMap[DeltaAuditStatus.NOT_APPLIED]
  );
}

export function getWorkStatusText(status) {
  return workStatusMap[Number(status)] || '-';
}

export function isApprovedWorker(identity = {}) {
  return (
    Number(identity.auditStatus) === DeltaAuditStatus.APPROVED &&
    identity.isWorker === true &&
    Number(identity.enabledStatus ?? 0) === 0
  );
}

export function isBlockedWorker(identity = {}) {
  const status = Number(identity.auditStatus ?? identity.applicationStatus);
  return (
    status === DeltaAuditStatus.DISABLED ||
    status === DeltaAuditStatus.BLACKLISTED ||
    Number(identity.enabledStatus) === 1
  );
}
