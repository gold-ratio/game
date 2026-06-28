(function () {
  const { Managers } = window.CampusGame;

  Managers.EventManager = {
    initialize(stateManager, timeSystem) {
      this.stateManager = stateManager;
      this.timeSystem = timeSystem;
    },

    pickRandomEvent(eventsData, state) {
      const events = (eventsData && eventsData.events) || [];
      const availableEvents = events.filter((event) => this.meetsCondition(event.condition, state));
      const period = state.periods[state.periodIndex];
      const totalWeight = availableEvents.reduce((sum, event) => sum + this.getPeriodWeight(event, period), 0);
      if (totalWeight <= 0) {
        return availableEvents[0] || null;
      }

      let roll = Math.random() * totalWeight;

      for (let index = 0; index < availableEvents.length; index += 1) {
        roll -= this.getPeriodWeight(availableEvents[index], period);
        if (roll <= 0) {
          return availableEvents[index];
        }
      }

      return availableEvents[0] || null;
    },

    getPeriodWeight(event, period) {
      if (event.periodWeights && Object.prototype.hasOwnProperty.call(event.periodWeights, period)) {
        return Number(event.periodWeights[period]) || 0;
      }

      return Number(event.weight) || 1;
    },

    resolveChoice(choice) {
      this.stateManager.applyEffects(choice.effects || {});
      return {
        effects: choice.effects || {},
        time: this.timeSystem.advanceTime()
      };
    },

    meetsCondition(condition, state) {
      if (!condition || Object.keys(condition).length === 0) {
        return true;
      }

      return Object.keys(condition).every((key) => {
        const required = condition[key];
        const current = key === "money" ? state.money : state.attributes[key];
        return typeof current === "number" && current >= required;
      });
    }
  };
})();
