(function () {
  const { UI } = window.CampusGame;

  class HUD {
    constructor(scene, stateManager, config) {
      this.scene = scene;
      this.stateManager = stateManager;
      this.config = config;
      this.elements = {};

      this.createTopBar();
      this.createAttributesPanel();
      this.createHintPanel();
      this.refresh();
    }

    createTopBar() {
      this.topBackground = this.scene.add.rectangle(0, 0, 960, 48, 0x111820, 0.78)
        .setOrigin(0)
        .setScrollFactor(0);

      this.elements.location = this.createText(18, 13, "", 16);
      this.elements.time = this.createText(245, 13, "", 15, 170);
      this.elements.date = this.createText(430, 13, "", 16, 170);
      this.elements.money = this.createText(720, 13, "", 16, 170);
    }

    createAttributesPanel() {
      this.attributeBackground = this.scene.add.rectangle(16, 390, 210, 224, 0x111820, 0.72)
        .setOrigin(0)
        .setScrollFactor(0);

      this.elements.attributeTitle = this.createText(30, 405, this.config.labels.attributesTitle, 16);
      this.elements.attributes = this.createText(30, 436, "", 15);
    }

    createHintPanel() {
      this.hintBackground = this.scene.add.rectangle(680, 490, 264, 132, 0x111820, 0.72)
        .setOrigin(0)
        .setScrollFactor(0);

      this.elements.taskTitle = this.createText(696, 506, this.config.labels.taskTitle, 16, 230);
      this.elements.taskHint = this.createText(696, 534, this.config.defaultTaskHint, 14, 230);
      this.elements.eventHint = this.createText(696, 584, this.config.defaultEventHint, 14, 230);
    }

    refresh() {
      const state = this.stateManager.getState();
      const labels = this.config.labels;
      const period = state.periods[state.periodIndex];
      const timeInfo = window.CampusGame.Systems.TimeSystem.getCurrentTime();

      this.elements.location.setText(`${labels.location}: ${state.currentLocation}`);
      this.elements.time.setText(`${labels.time}: ${period} ${this.formatRemaining(timeInfo.remainingMs)}`);
      this.elements.date.setText(`${labels.date}: 第 ${state.day} 天`);
      this.elements.money.setText(`${labels.money}: ${state.money}`);

      this.elements.attributes.setText([
        `${labels.health}: ${state.attributes.health}`,
        `${labels.energy}: ${state.attributes.energy}`,
        `${labels.knowledge}: ${state.attributes.knowledge}`,
        `${labels.mood}: ${state.attributes.mood}`,
        `${labels.relationship}: ${state.attributes.relationship}`,
        `${labels.money}: ${state.money}`,
        this.buildGoalText(state)
      ].join("\n"));
    }

    buildGoalText(state) {
      const task = this.getCurrentTask(state);
      return `目标: ${task.title}\n判定: ${task.done ? "已完成" : task.requirement}`;
    }

    getCurrentTask(state) {
      const flags = state.flags || {};
      const progress = state.progress || {};
      if (state.day <= 2) {
        const done = flags.club_intro_done || flags.helped_freshman || flags.lecture_seen || flags.volunteer_signed;
        return {
          title: "熟悉校园",
          done,
          requirement: "完成社团/新生/公告栏任一事件"
        };
      }
      if (state.day <= 4) {
        const completedTracks = [
          progress.research >= 1,
          progress.assignment >= 1,
          progress.training >= 1,
          progress.roommate >= 1
        ].filter(Boolean).length;
        return {
          title: "建立学习生活节奏",
          done: completedTracks >= 2,
          requirement: "学习/运动/宿舍/研究进度达到 2 项"
        };
      }
      if (state.day <= 6) {
        const done = flags.presentation_done || flags.club_showcase_done || flags.research_done || flags.sports_day_done;
        return {
          title: "准备一次展示或成果",
          done,
          requirement: "完成课堂展示/社团展示/资料突破/运动日之一"
        };
      }
      return {
        title: "完成第一周总结",
        done: false,
        requirement: "等待今天结束后生成结局"
      };
    }

    formatRemaining(ms) {
      const totalSeconds = Math.max(0, Math.ceil((ms || 0) / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }

    setEventHint(message) {
      this.elements.eventHint.setText(message);
    }

    createText(x, y, text, fontSize, width) {
      return this.scene.add.text(x, y, text, {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: `${fontSize}px`,
        color: "#ffffff",
        lineSpacing: 5,
        wordWrap: {
          width: width || 210
        }
      }).setScrollFactor(0);
    }
  }

  UI.HUD = HUD;
})();
