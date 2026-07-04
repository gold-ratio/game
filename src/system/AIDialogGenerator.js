(function () {
  const { Systems } = window.CampusGame;

  function getConfig() {
    return (window.CampusGame.GameSettings && window.CampusGame.GameSettings.ai) || {};
  }

  function withTimeout(ms) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), ms);
    return { controller, timer };
  }

  Systems.AIDialogGenerator = {
    isEnabled() {
      return getConfig().enabled !== false && typeof window.fetch === "function";
    },

    shouldTry() {
      const config = getConfig();
      return this.isEnabled() && Math.random() < (config.dialogueChance || 0);
    },

    async generate(context) {
      if (!this.isEnabled()) {
        return null;
      }

      const config = getConfig();
      const timeout = withTimeout(config.requestTimeoutMs || 12000);

      try {
        const response = await fetch(`${config.endpoint || "http://localhost:8765"}/api/dialogue`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(context),
          signal: timeout.controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn("AI dialogue generation failed:", response.status, errorText);
          return null;
        }

        const payload = await response.json();
        const lines = this.normalizeLines(payload.lines || payload.dialogues);
        if (!lines) {
          return null;
        }

        return Object.assign({}, context.npc, {
          dialogues: lines,
          generatedBy: payload.generatedBy || "ai-qwen-max"
        });
      } catch (error) {
        console.warn("AI dialogue generation failed:", error);
        return null;
      } finally {
        window.clearTimeout(timeout.timer);
      }
    },

    normalizeLines(lines) {
      if (!Array.isArray(lines)) {
        return null;
      }

      const normalized = lines
        .map((line) => String(line || "").trim())
        .filter(Boolean)
        .slice(0, 4);

      return normalized.length > 0 ? normalized : null;
    }
  };
})();
