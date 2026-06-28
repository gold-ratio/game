(function () {
  const { Managers } = window.CampusGame;
  const STORAGE_KEY = "campusEnding";

  Managers.EndingManager = {
    initialize(config) {
      this.config = config;
    },

    evaluate(state, finishedDay) {
      if (finishedDay !== this.config.targetDay || this.getSavedEnding()) {
        return null;
      }

      const ending = this.pickEnding(state);
      this.saveEnding(ending);
      return ending;
    },

    pickEnding(state) {
      const matched = this.config.endings.find((ending) => this.meetsRequirements(state, ending.requirements));
      return matched || this.config.endings.find((ending) => ending.id === this.config.defaultEndingId);
    },

    meetsRequirements(state, requirements) {
      return Object.keys(requirements || {}).every((key) => {
        const value = key === "money" ? state.money : state.attributes[key];
        return typeof value === "number" && value >= requirements[key];
      });
    },

    saveEnding(ending) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ending));
    },

    getSavedEnding() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw);
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    },

    clearEnding() {
      localStorage.removeItem(STORAGE_KEY);
    }
  };
})();
