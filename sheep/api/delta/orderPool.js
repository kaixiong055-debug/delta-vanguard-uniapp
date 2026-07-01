import request from '@/sheep/request';

const withAuth = (custom = {}) => ({
  auth: true,
  showLoading: false,
  ...custom,
});

const OrderPoolApi = {
  getPage: (params, custom) => {
    return request({
      url: '/delta/order-pool/page',
      method: 'GET',
      params,
      custom: withAuth(custom),
    });
  },
  getDetail: (id, custom) => {
    return request({
      url: '/delta/order-pool/get',
      method: 'GET',
      params: { id },
      custom: withAuth(custom),
    });
  },
  claimOrder: (serviceOrderId) => {
    return request({
      url: '/delta/order-pool/claim',
      method: 'POST',
      data: { serviceOrderId },
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '接单成功',
      }),
    });
  },
};

export default OrderPoolApi;
