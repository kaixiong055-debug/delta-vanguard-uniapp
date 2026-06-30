import request from '@/sheep/request';

const withAuth = (custom = {}) => ({
  auth: true,
  showLoading: false,
  ...custom,
});

const WorkerApi = {
  getWorkerIdentity: (custom) => {
    return request({
      url: '/delta/worker/identity',
      method: 'GET',
      custom: withAuth(custom),
    });
  },
  applyWorker: (data) => {
    return request({
      url: '/delta/worker/apply',
      method: 'POST',
      data,
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '提交成功',
      }),
    });
  },
  getWorkerApplication: (custom) => {
    return request({
      url: '/delta/worker/application',
      method: 'GET',
      custom: withAuth(custom),
    });
  },
  getWorkerProfile: (custom) => {
    return request({
      url: '/delta/worker/profile',
      method: 'GET',
      custom: withAuth(custom),
    });
  },
  updateWorkerProfile: (data) => {
    return request({
      url: '/delta/worker/profile',
      method: 'PUT',
      data,
      custom: withAuth({
        showLoading: true,
        showSuccess: true,
        successMsg: '保存成功',
      }),
    });
  },
  updateWorkerWorkStatus: (data) => {
    return request({
      url: '/delta/worker/work-status',
      method: 'PUT',
      data,
      custom: withAuth(),
    });
  },

  getProfile: (custom) => WorkerApi.getWorkerProfile(custom),
  getApplyStatus: (custom) => WorkerApi.getWorkerApplication(custom),
  apply: (data) => WorkerApi.applyWorker(data),
  updateProfile: (data) => WorkerApi.updateWorkerProfile(data),
  updateOnlineStatus: (online) =>
    WorkerApi.updateWorkerWorkStatus({
      workStatus: online ? 1 : 0,
    }),
};

export default WorkerApi;
