import request from '@/sheep/request';

const withAuth = (custom = {}) => ({
  auth: true,
  showLoading: false,
  ...custom,
});

const WorkerOrderApi = {
  getPage: (params, custom) => {
    return request({
      url: '/delta/worker-order/page',
      method: 'GET',
      params,
      custom: withAuth(custom),
    });
  },
  getDetail: (id, custom) => {
    return request({
      url: '/delta/worker-order/get',
      method: 'GET',
      params: { id },
      custom: withAuth(custom),
    });
  },
  startOrder: (serviceOrderId) => {
    return request({
      url: '/delta/worker-order/start',
      method: 'POST',
      params: { serviceOrderId },
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '已开始服务',
      }),
    });
  },
  submitCompletion: (data) => {
    return request({
      url: '/delta/worker-order/submit-completion',
      method: 'POST',
      data,
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '已提交完成',
      }),
    });
  },
  submitProgress: (data) => {
    return request({
      url: '/delta/worker-order/progress',
      method: 'POST',
      data,
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '进度已提交',
      }),
    });
  },
  getProgressList: (serviceOrderId, custom) => {
    return request({
      url: '/delta/worker-order/progress-list',
      method: 'GET',
      params: { serviceOrderId },
      custom: withAuth(custom),
    });
  },
  createEvidence: (data) => {
    return request({
      url: '/delta/worker-order/evidence',
      method: 'POST',
      data,
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '凭证已登记',
      }),
    });
  },
  deleteEvidence: (id) => {
    return request({
      url: '/delta/worker-order/evidence/delete',
      method: 'DELETE',
      params: { id },
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '凭证已删除',
      }),
    });
  },
  getEvidenceList: (serviceOrderId, custom) => {
    return request({
      url: '/delta/worker-order/evidence-list',
      method: 'GET',
      params: { serviceOrderId },
      custom: withAuth(custom),
    });
  },
};

export default WorkerOrderApi;
