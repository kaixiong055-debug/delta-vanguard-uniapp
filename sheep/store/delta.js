import { defineStore } from 'pinia';
import WorkerApi from '@/sheep/api/delta/worker';
import $router from '@/sheep/router';
import {
  DELTA_APP_MODE_KEY,
  DeltaAppMode,
  DeltaAuditStatus,
  DeltaRoute,
  DeltaWorkStatus,
  getWorkerStatusInfo,
  getWorkStatusText,
  isApprovedWorker,
  isBlockedWorker,
} from '@/sheep/helper/delta';

const identityThrottleTime = 3000;

const delta = defineStore('delta', {
  state: () => ({
    identity: null,
    application: null,
    profile: null,
    loading: false,
    identityLoaded: false,
    identityError: '',
    currentMode: uni.getStorageSync(DELTA_APP_MODE_KEY) || DeltaAppMode.SHOP,
    lastIdentityFetchTime: 0,
    identityPromise: null,

    workerProfile: null,
    applyStatus: null,
    online: false,
  }),
  getters: {
    statusInfo: (state) => getWorkerStatusInfo(state.identity || state.application || {}),
    workStatusText: (state) =>
      getWorkStatusText(
        state.profile?.workStatus ?? state.identity?.workStatus ?? DeltaWorkStatus.OFFLINE,
      ),
    canEnterWorker: (state) => isApprovedWorker(state.identity || {}),
    isBlocked: (state) => isBlockedWorker(state.identity || {}),
  },
  actions: {
    setAppMode(mode = DeltaAppMode.SHOP) {
      const nextMode = mode === DeltaAppMode.WORKER ? DeltaAppMode.WORKER : DeltaAppMode.SHOP;
      this.currentMode = nextMode;
      uni.setStorageSync(DELTA_APP_MODE_KEY, nextMode);
    },
    async fetchWorkerIdentity(options = {}) {
      const { force = false, showError = false } = options;
      const now = Date.now();
      if (
        !force &&
        this.identityLoaded &&
        now - this.lastIdentityFetchTime < identityThrottleTime
      ) {
        return {
          code: 0,
          data: this.identity,
        };
      }
      if (this.identityPromise) {
        return this.identityPromise;
      }
      this.loading = true;
      this.identityError = '';
      this.identityPromise = WorkerApi.getWorkerIdentity({
        showError,
        showLoading: false,
      })
        .then((res) => {
          if (res?.code === 0) {
            this.identity = res.data || null;
            this.identityLoaded = true;
            this.lastIdentityFetchTime = Date.now();
            this.online = Number(res.data?.workStatus) === DeltaWorkStatus.ONLINE;
            if (isBlockedWorker(res.data || {})) {
              this.setAppMode(DeltaAppMode.SHOP);
            }
          } else {
            this.identityError = res?.msg || '身份查询失败';
          }
          return res;
        })
        .catch((error) => {
          this.identityError = error?.msg || '身份查询失败';
          return false;
        })
        .finally(() => {
          this.loading = false;
          this.identityPromise = null;
        });
      return this.identityPromise;
    },
    async fetchWorkerApplication(custom = {}) {
      const res = await WorkerApi.getWorkerApplication({
        showError: false,
        showLoading: false,
        ...custom,
      });
      if (res?.code === 0) {
        this.application = res.data || null;
        this.applyStatus = res.data || null;
      }
      return res;
    },
    async fetchWorkerProfile(custom = {}) {
      const res = await WorkerApi.getWorkerProfile({
        showError: false,
        showLoading: false,
        ...custom,
      });
      if (res?.code === 0) {
        this.profile = res.data || null;
        this.workerProfile = res.data || null;
        this.online = Number(res.data?.workStatus) === DeltaWorkStatus.ONLINE;
      }
      return res;
    },
    async submitWorkerApply(data) {
      const res = await WorkerApi.applyWorker(data);
      if (res?.code === 0) {
        await this.fetchWorkerIdentity({ force: true, showError: false });
        await this.fetchWorkerApplication({ showError: false });
      }
      return res;
    },
    async updateWorkerProfile(data) {
      const res = await WorkerApi.updateWorkerProfile(data);
      if (res?.code === 0) {
        await this.fetchWorkerProfile({ showError: false });
      }
      return res;
    },
    async updateWorkerWorkStatus(workStatus) {
      const res = await WorkerApi.updateWorkerWorkStatus({ workStatus });
      if (res?.code === 0) {
        if (this.identity) {
          this.identity.workStatus = workStatus;
        }
        if (this.profile) {
          this.profile.workStatus = workStatus;
        }
        this.online = Number(workStatus) === DeltaWorkStatus.ONLINE;
      }
      return res;
    },
    resolveWorkerRoute(identity = this.identity) {
      const status = Number(identity?.auditStatus ?? identity?.applicationStatus);
      if (status === DeltaAuditStatus.APPROVED && isApprovedWorker(identity || {})) {
        return DeltaRoute.WORKER_HOME;
      }
      if (status === DeltaAuditStatus.PENDING || status === DeltaAuditStatus.REJECTED) {
        return DeltaRoute.WORKER_APPLY_STATUS;
      }
      if (status === DeltaAuditStatus.DISABLED || status === DeltaAuditStatus.BLACKLISTED) {
        return DeltaRoute.SHOP_USER;
      }
      return DeltaRoute.WORKER_APPLY;
    },
    async enterWorkerMode(options = {}) {
      const { redirect = true } = options;
      const res = await this.fetchWorkerIdentity({ force: true, showError: false });
      if (res?.code !== 0) {
        uni.showToast({
          title: this.identityError || '身份查询失败，请稍后重试',
          icon: 'none',
        });
        return false;
      }
      if (isBlockedWorker(this.identity || {})) {
        this.setAppMode(DeltaAppMode.SHOP);
        uni.showToast({
          title: getWorkerStatusInfo(this.identity).desc,
          icon: 'none',
        });
        return false;
      }
      const route = this.resolveWorkerRoute(this.identity);
      if (route === DeltaRoute.WORKER_HOME) {
        this.setAppMode(DeltaAppMode.WORKER);
        await this.fetchWorkerProfile({ showError: false });
      }
      if (redirect) {
        $router.redirect(route);
      }
      return route;
    },
    exitWorkerMode(route = DeltaRoute.SHOP_USER) {
      this.setAppMode(DeltaAppMode.SHOP);
      $router.go(route);
    },
    clearWorkerState() {
      this.identity = null;
      this.application = null;
      this.profile = null;
      this.loading = false;
      this.identityLoaded = false;
      this.identityError = '';
      this.lastIdentityFetchTime = 0;
      this.identityPromise = null;
      this.workerProfile = null;
      this.applyStatus = null;
      this.online = false;
      this.setAppMode(DeltaAppMode.SHOP);
    },

    loadWorkerProfile(custom) {
      return this.fetchWorkerProfile(custom);
    },
    loadApplyStatus(custom) {
      return this.fetchWorkerApplication(custom);
    },
    setOnlineStatus(online) {
      return this.updateWorkerWorkStatus(online ? DeltaWorkStatus.ONLINE : DeltaWorkStatus.OFFLINE);
    },
    clearDeltaData() {
      this.clearWorkerState();
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'delta-store',
      },
    ],
  },
});

export default delta;
