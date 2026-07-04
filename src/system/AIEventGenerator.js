(function () {
  const { Systems } = window.CampusGame;
  const CACHE_KEY = "campusAIEvents";

  function getConfig() {
    return (window.CampusGame.GameSettings && window.CampusGame.GameSettings.ai) || {};
  }

  function withTimeout(ms) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), ms);
    return { controller, timer };
  }

  Systems.AIEventGenerator = {
    isEnabled() {
      return getConfig().enabled !== false && typeof window.fetch === "function";
    },

    shouldTry() {
      const config = getConfig();
      return this.isEnabled() && Math.random() < (config.eventChance || 0);
    },

    async generate(context) {
      if (!this.isEnabled()) {
        return null;
      }

      const config = getConfig();
      const timeout = withTimeout(config.requestTimeoutMs || 12000);

      try {
        const response = await fetch(`${config.endpoint || "http://localhost:8765"}/api/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(context),
          signal: timeout.controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn("AI event generation failed:", response.status, errorText);
          return null;
        }

        const payload = await response.json();
        const event = this.normalizeEvent(payload.event || payload, context);
        if (event) {
          this.remember(event);
        }
        return event;
      } catch (error) {
        console.warn("AI event generation failed:", error);
        return null;
      } finally {
        window.clearTimeout(timeout.timer);
      }
    },

    normalizeEvent(event, context) {
      if (!event || !event.title || !event.description || !Array.isArray(event.choices)) {
        return null;
      }

      const choices = event.choices
        .filter((choice) => choice && choice.text)
        .slice(0, 3)
        .map((choice) => ({
          text: String(choice.text),
          effects: this.normalizeEffects(choice.effects),
          next_event: choice.next_event || null
        }));

      if (choices.length < 2) {
        return null;
      }

      return {
        id: event.id || `ai_${context.locationId}_${Date.now()}`,
        title: String(event.title),
        location: context.locationId,
        condition: event.condition && typeof event.condition === "object" ? event.condition : {},
        description: String(event.description),
        choices,
        effects: event.effects && typeof event.effects === "object" ? event.effects : {},
        next_event: event.next_event || null,
        weight: Number(event.weight) || 1,
        periodWeights: event.periodWeights || { 上午: 0.34, 下午: 0.33, 晚上: 0.33 },
        generatedBy: event.generatedBy || "ai-qwen-max"
      };
    },

    normalizeEffects(effects) {
      const keys = ["health", "energy", "knowledge", "mood", "relationship", "money"];
      return keys.reduce((result, key) => {
        const value = Number(effects && effects[key]);
        if (Number.isFinite(value) && value !== 0) {
          result[key] = Phaser.Math.Clamp(Math.round(value), key === "money" ? -40 : -15, key === "money" ? 40 : 15);
        }
        return result;
      }, {});
    },

    remember(event) {
      const raw = localStorage.getItem(CACHE_KEY);
      let events = [];
      try {
        events = raw ? JSON.parse(raw) : [];
      } catch (error) {
        events = [];
      }
      events.unshift(event);
      localStorage.setItem(CACHE_KEY, JSON.stringify(events.slice(0, 20)));
    }
  };
})();
