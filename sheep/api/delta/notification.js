import request from '@/sheep/request';

const withAuth = (custom = {}) => ({ auth: true, showLoading: false, ...custom });

const NotificationApi = {
  getPage: (params, custom) =>
    request({ url: '/delta/notification/page', method: 'GET', params, custom: withAuth(custom) }),
  getDetail: (id, custom) =>
    request({
      url: '/delta/notification/get',
      method: 'GET',
      params: { id },
      custom: withAuth(custom),
    }),
  getUnreadCount: (custom) =>
    request({ url: '/delta/notification/unread-count', method: 'GET', custom: withAuth(custom) }),
  markRead: (id, custom) =>
    request({
      url: '/delta/notification/read',
      method: 'PUT',
      data: { id },
      custom: withAuth(custom),
    }),
  markAllRead: (custom) =>
    request({
      url: '/delta/notification/read-all',
      method: 'PUT',
      custom: withAuth(custom),
    }),
};

export default NotificationApi;
