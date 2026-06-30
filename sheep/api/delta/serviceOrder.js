import request from '@/sheep/request';

const withAuth = (custom = {}) => ({
  auth: true,
  showLoading: false,
  ...custom,
});

const ServiceOrderApi = {
  getPage: (params, custom) => {
    return request({
      url: '/delta/service-order/page',
      method: 'GET',
      params,
      custom: withAuth(custom),
    });
  },
  getDetail: (id, custom) => {
    return request({
      url: '/delta/service-order/get',
      method: 'GET',
      params: { id },
      custom: withAuth(custom),
    });
  },
  getProgressList: (id, custom) => {
    return request({
      url: '/delta/service-order/progress-list',
      method: 'GET',
      params: { id },
      custom: withAuth(custom),
    });
  },
  getWorkerCandidatePage: (params, custom) => {
    return request({
      url: '/delta/service-order/worker-candidate-page',
      method: 'GET',
      params,
      custom: withAuth(custom),
    });
  },
  assignWorker: (data) => {
    return request({
      url: '/delta/service-order/assign-worker',
      method: 'POST',
      data,
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '指派成功',
      }),
    });
  },
};

export default ServiceOrderApi;
