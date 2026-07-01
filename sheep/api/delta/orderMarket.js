import request from '@/sheep/request';

const withAuth = (custom = {}) => ({
  auth: true,
  showLoading: false,
  ...custom,
});

const OrderMarketApi = {
  getAvailablePage: (params, custom) =>
    request({
      url: '/delta/order-market/available-page',
      method: 'GET',
      params,
      custom: withAuth(custom),
    }),
  getAvailableDetail: (id, custom) =>
    request({
      url: '/delta/order-market/available-get',
      method: 'GET',
      params: { id },
      custom: withAuth(custom),
    }),
  claim: (id, custom) =>
    request({
      url: '/delta/order-market/claim',
      method: 'POST',
      data: { id },
      custom: withAuth(custom),
    }),
  getMyClaimedPage: (params, custom) =>
    request({
      url: '/delta/order-market/my-claimed-page',
      method: 'GET',
      params,
      custom: withAuth(custom),
    }),
};

export default OrderMarketApi;
