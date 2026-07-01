import request from '@/sheep/request';

const withAuth = (custom = {}) => ({
  auth: true,
  showLoading: false,
  ...custom,
});

const ClubApi = {
  getIdentity: (custom) =>
    request({
      url: '/delta/club/identity',
      method: 'GET',
      custom: withAuth(custom),
    }),
  submitApplication: (data) =>
    request({
      url: '/delta/club-application/submit',
      method: 'POST',
      data,
      custom: withAuth(),
    }),
  getApplication: (custom) =>
    request({
      url: '/delta/club-application/get',
      method: 'GET',
      custom: withAuth(custom),
    }),
  cancelApplication: (custom) =>
    request({
      url: '/delta/club-application/cancel',
      method: 'POST',
      custom: withAuth(custom),
    }),
};

export default ClubApi;
