(function () {
  const { Systems } = window.CampusGame;

  Systems.TimeSystem = {
    initialize(stateManager, config) {
      this.stateManager = stateManager;
      this.config = config;
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
        allowance = this.applyAllowance(nextDay);
      } else {
        this.stateManager.setTime(nextDay, nextPeriodIndex);
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
      return {
        day: state.day,
        period: state.periods[state.periodIndex],
        periodIndex: state.periodIndex
      };
    }
  };
})();
