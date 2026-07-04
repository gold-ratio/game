(function () {
  const { Managers } = window.CampusGame;
  const STORAGE_KEY = "campusGameState";

  Managers.GameStateManager = {
    initialize(defaultState) {
      if (this.state) {
        return;
      }

      const savedState = this.load();
      this.state = savedState || this.clone(defaultState);
      this.normalizeState(defaultState);
      this.save();
    },

    getState() {
      return this.clone(this.state);
    },

    setLocation(locationName) {
      this.state.currentLocation = locationName;
      this.save();
    },

    setTime(day, periodIndex) {
      this.state.day = day;
      this.state.periodIndex = periodIndex;
      this.save();
    },

    setDayStartedAt(timestamp) {
      this.state.dayStartedAt = timestamp;
      this.save();
    },

    reset(defaultState) {
      this.state = this.clone(defaultState);
      this.normalizeState(defaultState);
      this.save();
    },

    applyEffects(effects) {
      Object.keys(effects || {}).forEach((key) => {
        if (key === "money") {
          this.state.money = Math.max(0, this.state.money + effects[key]);
          return;
        }

        if (key === "flags") {
          this.applyFlags(effects[key]);
          return;
        }

        if (key === "npcFavor") {
          this.applyNpcFavor(effects[key]);
          return;
        }

        if (key === "progress") {
          this.applyProgress(effects[key]);
          return;
        }

        if (Object.prototype.hasOwnProperty.call(this.state.attributes, key)) {
          const nextValue = this.state.attributes[key] + effects[key];
          this.state.attributes[key] = Phaser.Math.Clamp(nextValue, 0, 100);
        }
      });

      this.save();
    },

    addNpcFavor(npcId, amount) {
      this.state.npcFavor[npcId] = Phaser.Math.Clamp((this.state.npcFavor[npcId] || 0) + amount, 0, 100);
      this.save();
      return this.state.npcFavor[npcId];
    },

    getNpcFavor(npcId) {
      return (this.state.npcFavor && this.state.npcFavor[npcId]) || 0;
    },

    hasFlag(flag) {
      return Boolean(this.state.flags && this.state.flags[flag]);
    },

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    },

    load() {
      const rawState = localStorage.getItem(STORAGE_KEY);
      if (!rawState) {
        return null;
      }

      try {
        return JSON.parse(rawState);
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    },

    clone(value) {
      return JSON.parse(JSON.stringify(value));
    },

    normalizeState(defaultState) {
      this.state.periods = this.state.periods || this.clone(defaultState.periods || ["上午", "下午", "晚上"]);
      this.state.attributes = Object.assign({}, defaultState.attributes || {}, this.state.attributes || {});
      this.state.flags = this.state.flags || {};
      this.state.npcFavor = this.state.npcFavor || {};
      this.state.progress = this.state.progress || {};
      this.state.eventCooldowns = this.state.eventCooldowns || {};
      this.state.dayStartedAt = this.state.dayStartedAt || Date.now();
    },

    applyFlags(flags) {
      Object.keys(flags || {}).forEach((flag) => {
        this.state.flags[flag] = Boolean(flags[flag]);
      });
    },

    applyNpcFavor(favor) {
      Object.keys(favor || {}).forEach((npcId) => {
        this.state.npcFavor[npcId] = Phaser.Math.Clamp((this.state.npcFavor[npcId] || 0) + favor[npcId], 0, 100);
      });
    },

    applyProgress(progress) {
      Object.keys(progress || {}).forEach((key) => {
        this.state.progress[key] = Math.max(0, (this.state.progress[key] || 0) + progress[key]);
      });
    },

    markEventCooldown(eventId, cooldownMs) {
      this.state.eventCooldowns[eventId] = Date.now() + cooldownMs;
      this.save();
    },

    clearExpiredEventCooldowns() {
      const now = Date.now();
      Object.keys(this.state.eventCooldowns || {}).forEach((eventId) => {
        if (this.state.eventCooldowns[eventId] <= now) {
          delete this.state.eventCooldowns[eventId];
        }
      });
    }
  };
})();
