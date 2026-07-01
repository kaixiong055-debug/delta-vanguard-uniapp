export const DELTA_APP_MODE_KEY = 'delta_app_mode';

export const DeltaAppMode = {
  SHOP: 'shop',
  WORKER: 'worker',
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

export function formatDeltaAmount(amount) {
  const value = Number(amount || 0);
  return `¥${(value / 100).toFixed(2)}`;
}

export function formatDeltaTime(value) {
  return value ? String(value).replace('T', ' ').slice(0, 19) : '-';
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
