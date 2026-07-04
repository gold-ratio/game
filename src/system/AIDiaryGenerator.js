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

  Systems.AIDiaryGenerator = {
    async generate(context) {
      const aiSummary = await this.generateWithAI(context);
      return aiSummary || this.generateLocal(context);
    },

    async generateWithAI(context) {
      const config = getConfig();
      if (config.enabled === false || typeof window.fetch !== "function") {
        return null;
      }

      const timeout = withTimeout((config.requestTimeoutMs || 12000) + 6000);
      try {
        const response = await fetch(`${config.endpoint || "http://localhost:8765"}/api/diary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(context),
          signal: timeout.controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn("AI diary generation failed:", response.status, errorText);
          return null;
        }

        const payload = await response.json();
        return this.normalizeSummary(payload.diary || payload, context);
      } catch (error) {
        console.warn("AI diary generation failed:", error);
        return null;
      } finally {
        window.clearTimeout(timeout.timer);
      }
    },

    generateLocal(context) {
      const records = context.records || [];
      const config = context.diaryConfig || {};
      const state = context.state;
      const lines = records.length > 0
        ? records.map((record) => `${record.location}：${record.title}，你选择了“${record.choice}”。`)
        : [config.emptyDayText || "今天没有记录到特别事件，但你仍然在校园里度过了一天。"];

      return {
        day: context.finishedDay,
        title: `${config.titlePrefix || "校园日记"} 第 ${context.finishedDay} 天`,
        content: lines.join("\n"),
        endingNote: this.buildEndingNote(state),
        generatedBy: "local-template"
      };
    },

    normalizeSummary(summary, context) {
      if (!summary || !summary.title || !summary.content) {
        return null;
      }

      return {
        day: context.finishedDay,
        title: String(summary.title),
        content: String(summary.content),
        endingNote: String(summary.endingNote || this.buildEndingNote(context.state)),
        generatedBy: summary.generatedBy || "ai-qwen-max"
      };
    },

    buildEndingNote(state) {
      const attributes = state.attributes;
      if (attributes.knowledge >= attributes.mood && attributes.knowledge >= attributes.relationship) {
        return "今天的关键词是学习。你离更从容的自己近了一点。";
      }

      if (attributes.relationship >= attributes.mood) {
        return "今天的关键词是连接。校园因为遇见的人变得更具体。";
      }

      return "今天的关键词是心情。照顾自己也是大学生活的重要课程。";
    }
  };
})();
