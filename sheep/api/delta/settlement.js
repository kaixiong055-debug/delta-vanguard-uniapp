import request from '@/sheep/request';

const withAuth = (custom = {}) => ({
  auth: true,
  showLoading: false,
  ...custom,
});

const SettlementApi = {
  getSummary: (custom) => {
    return request({
      url: '/delta/settlement/summary',
      method: 'GET',
      custom: withAuth(custom),
    });
  },
  getRecordPage: (params, custom) => {
    return request({
      url: '/delta/settlement/record-page',
      method: 'GET',
      params,
      custom: withAuth(custom),
    });
  },
};

export default SettlementApi;
