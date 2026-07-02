import request from '@/sheep/request';

const withAuth = (custom = {}) => ({
  auth: true,
  showLoading: false,
  ...custom,
});

const ClubOrderApi = {
  getPage: (params, custom) =>
    request({
      url: '/delta/club-order/page',
      method: 'GET',
      params,
      custom: withAuth(custom),
    }),

  getDetail: (listingId, custom) =>
    request({
      url: '/delta/club-order/get',
      method: 'GET',
      params: { listingId },
      custom: withAuth(custom),
    }),

  getAvailableWorkerPage: (params, custom) =>
    request({
      url: '/delta/club-order/available-worker-page',
      method: 'GET',
      params,
      custom: withAuth(custom),
    }),

  assignWorker: (data, custom) =>
    request({
      url: '/delta/club-order/assign-worker',
      method: 'POST',
      data,
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '打手分派成功',
        ...custom,
      }),
    }),
};

export default ClubOrderApi;
