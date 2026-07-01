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
  getProgressList: (serviceOrderId, custom) => {
    return request({
      url: '/delta/service-order/progress-list',
      method: 'GET',
      params: { serviceOrderId },
      custom: withAuth(custom),
    });
  },
  getEvidenceList: (serviceOrderId, custom) => {
    return request({
      url: '/delta/service-order/evidence-list',
      method: 'GET',
      params: { serviceOrderId },
      custom: withAuth(custom),
    });
  },
  getTimeline: (serviceOrderId, custom) => {
    return request({
      url: '/delta/service-order/timeline',
      method: 'GET',
      params: { serviceOrderId },
      custom: withAuth(custom),
    });
  },
  accept: (data) => {
    return request({
      url: '/delta/service-order/accept',
      method: 'POST',
      data,
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '验收成功',
      }),
    });
  },
  requestRework: (data) =>
    request({
      url: '/delta/service-order/request-rework',
      method: 'POST',
      data,
      custom: withAuth({ showLoading: true, showSuccess: true, successMsg: '返工要求已提交' }),
    }),
  getAcceptanceList: (serviceOrderId, custom) =>
    request({
      url: '/delta/service-order/acceptance-list',
      method: 'GET',
      params: { serviceOrderId },
      custom: withAuth(custom),
    }),
  getReworkList: (serviceOrderId, custom) =>
    request({
      url: '/delta/service-order/rework-list',
      method: 'GET',
      params: { serviceOrderId },
      custom: withAuth(custom),
    }),
  applyCancel: (data) =>
    request({
      url: '/delta/service-order/cancel-apply',
      method: 'POST',
      data,
      custom: withAuth({ showLoading: true, showSuccess: true, successMsg: '取消申请已提交' }),
    }),
  getCancelPage: (params, custom) =>
    request({
      url: '/delta/service-order/cancel-list',
      method: 'GET',
      params,
      custom: withAuth(custom),
    }),
  getCancelDetail: (id, custom) =>
    request({
      url: '/delta/service-order/cancel-get',
      method: 'GET',
      params: { id },
      custom: withAuth(custom),
    }),
  applyAfterSale: (data) =>
    request({
      url: '/delta/service-order/after-sale-apply',
      method: 'POST',
      data,
      custom: withAuth({ showLoading: true, showSuccess: true, successMsg: '售后申请已提交' }),
    }),
  getAfterSalePage: (params, custom) =>
    request({
      url: '/delta/service-order/after-sale-page',
      method: 'GET',
      params,
      custom: withAuth(custom),
    }),
  getAfterSaleDetail: (id, custom) =>
    request({
      url: '/delta/service-order/after-sale-get',
      method: 'GET',
      params: { id },
      custom: withAuth(custom),
    }),
  getRefundPage: (params, custom) =>
    request({
      url: '/delta/service-order/refund-list',
      method: 'GET',
      params,
      custom: withAuth(custom),
    }),
  getRefundDetail: (id, custom) =>
    request({
      url: '/delta/service-order/refund-get',
      method: 'GET',
      params: { id },
      custom: withAuth(custom),
    }),
};

export default ServiceOrderApi;
