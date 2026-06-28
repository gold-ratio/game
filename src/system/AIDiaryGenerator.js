(function () {
  const { Systems } = window.CampusGame;

  Systems.AIDiaryGenerator = {
    generate(context) {
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
