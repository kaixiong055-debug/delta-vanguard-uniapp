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
  startOrder: (id) => {
    return request({
      url: '/delta/worker-order/start',
      method: 'POST',
      data: { id },
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '已开始服务',
      }),
    });
  },
  finishOrder: (id) => {
    return request({
      url: '/delta/worker-order/finish',
      method: 'POST',
      data: { id },
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
};

export default WorkerOrderApi;
