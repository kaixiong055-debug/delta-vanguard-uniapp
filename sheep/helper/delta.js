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
};

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
