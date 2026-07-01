import { defineStore } from 'pinia';
import WorkerApi from '@/sheep/api/delta/worker';
import ClubApi from '@/sheep/api/delta/club';
import $router from '@/sheep/router';
import userStore from '@/sheep/store/user';
import {
  DELTA_APP_MODE_KEY,
  DeltaAppMode,
  DeltaAuditStatus,
  DeltaClubApplicationStatus,
  DeltaClubBusinessStatus,
  DeltaRoute,
  DeltaWorkStatus,
  getWorkerStatusInfo,
  getClubApplicationStatusInfo,
  getEnabledClubServiceScopes,
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

    clubIdentity: null,
    clubApplication: null,
    clubIdentityLoading: false,
    clubIdentityLoaded: false,
    clubIdentityError: '',
    clubIdentityPromise: null,
    lastClubIdentityFetchTime: 0,

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
    clubStatusInfo: (state) => getClubApplicationStatusInfo(state.clubIdentity || {}),
    isClubOwner: (state) => state.clubIdentity?.isClubOwner === true,
    clubBusinessEnabled: (state) =>
      Number(state.clubIdentity?.businessStatus) === DeltaClubBusinessStatus.ENABLED,
    enabledClubServiceScopes: (state) => getEnabledClubServiceScopes(state.clubIdentity || {}),
    hasEnabledClubServiceScope: (state) =>
      getEnabledClubServiceScopes(state.clubIdentity || {}).length > 0,
    canEnterClub: (state) => state.clubIdentity?.isClubOwner === true,
    canUseClubMarket: (state) =>
      state.clubIdentity?.isClubOwner === true &&
      state.clubIdentity?.canUseOrderMarket === true &&
      Number(state.clubIdentity?.businessStatus) === DeltaClubBusinessStatus.ENABLED,
  },
  actions: {
    setAppMode(mode = DeltaAppMode.SHOP) {
      const allowedModes = [DeltaAppMode.SHOP, DeltaAppMode.WORKER, DeltaAppMode.CLUB];
      const nextMode = allowedModes.includes(mode) ? mode : DeltaAppMode.SHOP;
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
    async guardWorkerPage() {
      const res = await this.fetchWorkerIdentity({ force: true, showError: false });
      if (res?.code !== 0 || !this.canEnterWorker || this.isBlocked) {
        this.setAppMode(DeltaAppMode.SHOP);
        uni.showToast({
          title: this.identityError || this.statusInfo.desc || '当前无法进入打手模式',
          icon: 'none',
        });
        $router.redirect(this.resolveWorkerRoute(this.identity));
        return false;
      }
      this.setAppMode(DeltaAppMode.WORKER);
      await this.fetchWorkerProfile({ showError: false, showLoading: false });
      return true;
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

    async fetchClubIdentity(options = {}) {
      const { force = false, showError = false } = options;
      const now = Date.now();
      if (
        !force &&
        this.clubIdentityLoaded &&
        now - this.lastClubIdentityFetchTime < identityThrottleTime
      ) {
        return { code: 0, data: this.clubIdentity };
      }
      if (this.clubIdentityPromise) return this.clubIdentityPromise;
      this.clubIdentityLoading = true;
      this.clubIdentityError = '';
      this.clubIdentityPromise = ClubApi.getIdentity({ showError, showLoading: false })
        .then((res) => {
          if (res?.code === 0) {
            this.clubIdentity = res.data || null;
            this.clubIdentityLoaded = true;
            this.lastClubIdentityFetchTime = Date.now();
          } else {
            this.clubIdentityError = res?.msg || '俱乐部身份查询失败';
          }
          return res;
        })
        .catch((error) => {
          this.clubIdentityError = error?.msg || error?.message || '俱乐部身份查询失败';
          return false;
        })
        .finally(() => {
          this.clubIdentityLoading = false;
          this.clubIdentityPromise = null;
        });
      return this.clubIdentityPromise;
    },
    async fetchClubApplication(custom = {}) {
      try {
        const res = await ClubApi.getApplication({
          showError: false,
          showLoading: false,
          ...custom,
        });
        if (res?.code === 0) this.clubApplication = res.data || null;
        return res;
      } catch (error) {
        return { code: -1, msg: error?.msg || error?.message || '申请详情查询失败' };
      }
    },
    async submitClubApplication(data) {
      const res = await ClubApi.submitApplication(data);
      if (res?.code === 0) {
        await this.fetchClubIdentity({ force: true, showError: false });
        await this.fetchClubApplication({ showError: false });
      }
      return res;
    },
    async cancelClubApplication() {
      const res = await ClubApi.cancelApplication({ showError: false, showLoading: false });
      if (res?.code === 0) {
        await this.fetchClubIdentity({ force: true, showError: false });
        await this.fetchClubApplication({ showError: false });
      }
      return res;
    },
    resolveClubRoute(identity = this.clubIdentity) {
      if (identity?.isClubOwner === true) return DeltaRoute.CLUB_HOME;
      if (identity?.hasApplication !== true) return DeltaRoute.CLUB_APPLY;
      const status = Number(identity?.applicationStatus);
      if (
        status === DeltaClubApplicationStatus.PENDING ||
        status === DeltaClubApplicationStatus.APPROVED ||
        status === DeltaClubApplicationStatus.REJECTED ||
        status === DeltaClubApplicationStatus.CANCELED
      ) {
        return DeltaRoute.CLUB_APPLY_STATUS;
      }
      return DeltaRoute.CLUB_APPLY_STATUS;
    },
    async enterClubMode(options = {}) {
      const { redirect = true } = options;
      const res = await this.fetchClubIdentity({ force: true, showError: false });
      if (res?.code !== 0) {
        uni.showToast({
          title: this.clubIdentityError || '身份查询失败，请稍后重试',
          icon: 'none',
        });
        return false;
      }
      const route = this.resolveClubRoute(this.clubIdentity);
      if (!this.isClubOwner) {
        if (redirect) $router.redirect(route);
        return route;
      }
      this.setAppMode(DeltaAppMode.CLUB);
      if (redirect) $router.redirect(DeltaRoute.CLUB_HOME);
      return DeltaRoute.CLUB_HOME;
    },
    async guardClubOwnerPage() {
      if (!userStore().isLogin) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return false;
      }
      const res = await this.fetchClubIdentity({ force: true, showError: false });
      if (res?.code !== 0) {
        uni.showToast({
          title: this.clubIdentityError || '身份查询失败，请稍后重试',
          icon: 'none',
        });
        return false;
      }
      if (!this.isClubOwner) {
        $router.redirect(this.resolveClubRoute(this.clubIdentity));
        return false;
      }
      this.setAppMode(DeltaAppMode.CLUB);
      return true;
    },
    async guardClubMarketPage(options = {}) {
      const { requireServiceScope = true } = options;
      if (!(await this.guardClubOwnerPage())) return false;
      if (!this.canUseClubMarket) {
        uni.showToast({ title: '当前俱乐部已停用，暂不能进入订单市场', icon: 'none' });
        $router.redirect(DeltaRoute.CLUB_HOME);
        return false;
      }
      if (requireServiceScope && !this.hasEnabledClubServiceScope) {
        uni.showToast({ title: '当前未配置可经营服务范围，请联系平台管理员', icon: 'none' });
        $router.redirect(DeltaRoute.CLUB_HOME);
        return false;
      }
      return true;
    },
    exitClubMode(route = DeltaRoute.SHOP_USER) {
      this.setAppMode(DeltaAppMode.SHOP);
      $router.go(route);
    },
    clearClubState() {
      this.clubIdentity = null;
      this.clubApplication = null;
      this.clubIdentityLoading = false;
      this.clubIdentityLoaded = false;
      this.clubIdentityError = '';
      this.clubIdentityPromise = null;
      this.lastClubIdentityFetchTime = 0;
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
      this.clearClubState();
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
