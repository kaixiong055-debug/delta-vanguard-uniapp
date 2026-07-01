import request from '@/sheep/request';

const withAuth = (custom = {}) => ({
  auth: true,
  showLoading: false,
  ...custom,
});

const SettlementApi = {
  getSummary: (custom) => {
    return request({
      url: '/delta/worker-settlement/summary',
      method: 'GET',
      custom: withAuth(custom),
    });
  },
  getPage: (params, custom) => {
    return request({
      url: '/delta/worker-settlement/page',
      method: 'GET',
      params,
      custom: withAuth(custom),
    });
  },
  getDetail: (id, custom) => {
    return request({
      url: '/delta/worker-settlement/get',
      method: 'GET',
      params: { id },
      custom: withAuth(custom),
    });
  },
};

export default SettlementApi;
