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

    reset(defaultState) {
      this.state = this.clone(defaultState);
      this.save();
    },

    applyEffects(effects) {
      Object.keys(effects || {}).forEach((key) => {
        if (key === "money") {
          this.state.money = Math.max(0, this.state.money + effects[key]);
          return;
        }

        if (Object.prototype.hasOwnProperty.call(this.state.attributes, key)) {
          const nextValue = this.state.attributes[key] + effects[key];
          this.state.attributes[key] = Phaser.Math.Clamp(nextValue, 0, 100);
        }
      });

      this.save();
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
    }
  };
})();
