(function () {
  const { Managers } = window.CampusGame;

  Managers.EventManager = {
    initialize(stateManager, timeSystem) {
      this.stateManager = stateManager;
      this.timeSystem = timeSystem;
    },

    pickRandomEvent(eventsData, state) {
      const events = (eventsData && eventsData.events) || [];
      const availableEvents = events.filter((event) => (
        !this.isOnCooldown(event, state) && this.meetsCondition(event.condition, state)
      ));
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

    findEventById(eventsData, eventId, state, options) {
      const events = (eventsData && eventsData.events) || [];
      const event = events.find((item) => item.id === eventId);
      const ignoreCooldown = options && options.ignoreCooldown;
      if (!event || (!ignoreCooldown && this.isOnCooldown(event, state)) || !this.meetsCondition(event.condition, state)) {
        return null;
      }

      return event;
    },

    isOnCooldown(event, state) {
      const cooldownUntil = state.eventCooldowns && state.eventCooldowns[event.id];
      return Boolean(cooldownUntil && cooldownUntil > Date.now());
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
        if (key === "dayMin") {
          return state.day >= required;
        }

        if (key === "dayMax") {
          return state.day <= required;
        }

        if (key === "periods") {
          return required.indexOf(state.periods[state.periodIndex]) !== -1;
        }

        if (key === "flags") {
          return Object.keys(required || {}).every((flag) => Boolean(state.flags && state.flags[flag]) === Boolean(required[flag]));
        }

        if (key === "npcFavor") {
          return Object.keys(required || {}).every((npcId) => ((state.npcFavor && state.npcFavor[npcId]) || 0) >= required[npcId]);
        }

        if (key === "progress") {
          return Object.keys(required || {}).every((progressId) => ((state.progress && state.progress[progressId]) || 0) >= required[progressId]);
        }

        if (key === "max") {
          return Object.keys(required || {}).every((attr) => {
            const value = attr === "money" ? state.money : state.attributes[attr];
            return typeof value === "number" && value <= required[attr];
          });
        }

        const current = key === "money" ? state.money : state.attributes[key];
        return typeof current === "number" && current >= required;
      });
    }
  };
})();
