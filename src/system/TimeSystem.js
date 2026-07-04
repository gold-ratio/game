(function () {
  const { Systems } = window.CampusGame;

  Systems.TimeSystem = {
    initialize(stateManager, config) {
      this.stateManager = stateManager;
      this.config = config;
      this.dayDurationMs = Number(config.realTimeDayMs) || 300000;
      this.ensureClock();
    },

    ensureClock() {
      const state = this.stateManager.getState();
      if (!state.dayStartedAt) {
        this.stateManager.setDayStartedAt(Date.now());
      }
    },

    syncTime() {
      const state = this.stateManager.getState();
      const now = Date.now();
      const startedAt = state.dayStartedAt || now;
      const elapsed = Math.max(0, now - startedAt);
      const previousDay = state.day;

      if (elapsed >= this.dayDurationMs) {
        const skippedDays = Math.max(1, Math.floor(elapsed / this.dayDurationMs));
        const nextDay = state.day + skippedDays;
        this.stateManager.setTime(nextDay, 0);
        this.stateManager.setDayStartedAt(now);
        const allowance = this.applyAllowance(nextDay);
        return {
          day: nextDay,
          previousDay,
          period: state.periods[0],
          periodIndex: 0,
          dayChanged: true,
          allowance,
          remainingMs: this.dayDurationMs
        };
      }

      const periodDuration = this.dayDurationMs / state.periods.length;
      const periodIndex = Math.min(state.periods.length - 1, Math.floor(elapsed / periodDuration));
      const periodChanged = periodIndex !== state.periodIndex;
      if (periodIndex !== state.periodIndex) {
        this.stateManager.setTime(state.day, periodIndex);
      }

      const syncedState = this.stateManager.getState();
      return {
        day: syncedState.day,
        previousDay,
        period: syncedState.periods[syncedState.periodIndex],
        periodIndex: syncedState.periodIndex,
        dayChanged: false,
        periodChanged,
        allowance: null,
        remainingMs: Math.max(0, this.dayDurationMs - elapsed)
      };
    },

    advanceTime() {
      const state = this.stateManager.getState();
      const nextPeriodIndex = state.periodIndex + 1;
      let nextDay = state.day;
      let dayChanged = false;
      const previousDay = state.day;
      let allowance = null;

      if (nextPeriodIndex >= state.periods.length) {
        nextDay += 1;
        dayChanged = true;
        this.stateManager.setTime(nextDay, 0);
        this.stateManager.setDayStartedAt(Date.now());
        allowance = this.applyAllowance(nextDay);
      } else {
        this.stateManager.setTime(nextDay, nextPeriodIndex);
        const periodDuration = this.dayDurationMs / state.periods.length;
        this.stateManager.setDayStartedAt(Date.now() - nextPeriodIndex * periodDuration);
      }

      const nextState = this.stateManager.getState();
      return {
        day: nextState.day,
        previousDay,
        period: nextState.periods[nextState.periodIndex],
        periodIndex: nextState.periodIndex,
        dayChanged,
        allowance
      };
    },

    applyAllowance(day) {
      const allowance = this.config.allowance;
      if (!allowance || day % allowance.intervalDays !== 0) {
        return null;
      }

      this.stateManager.applyEffects({ money: allowance.amount });
      return {
        amount: allowance.amount,
        day
      };
    },

    getCurrentTime() {
      const state = this.stateManager.getState();
      const elapsed = Math.max(0, Date.now() - (state.dayStartedAt || Date.now()));
      return {
        day: state.day,
        period: state.periods[state.periodIndex],
        periodIndex: state.periodIndex,
        remainingMs: Math.max(0, this.dayDurationMs - elapsed),
        dayDurationMs: this.dayDurationMs
      };
    }
  };
})();
