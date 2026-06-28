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
      this.topBackground = this.scene.add.rectangle(0, 0, 960, 44, 0x111820, 0.78)
        .setOrigin(0)
        .setScrollFactor(0);

      this.elements.location = this.createText(18, 13, "", 16);
      this.elements.time = this.createText(245, 13, "", 16);
      this.elements.date = this.createText(430, 13, "", 16);
      this.elements.money = this.createText(720, 13, "", 16);
    }

    createAttributesPanel() {
      this.attributeBackground = this.scene.add.rectangle(16, 430, 190, 184, 0x111820, 0.72)
        .setOrigin(0)
        .setScrollFactor(0);

      this.elements.attributeTitle = this.createText(30, 445, this.config.labels.attributesTitle, 16);
      this.elements.attributes = this.createText(30, 476, "", 15);
    }

    createHintPanel() {
      this.hintBackground = this.scene.add.rectangle(700, 506, 244, 108, 0x111820, 0.72)
        .setOrigin(0)
        .setScrollFactor(0);

      this.elements.taskTitle = this.createText(716, 522, this.config.labels.taskTitle, 16);
      this.elements.taskHint = this.createText(716, 552, this.config.defaultTaskHint, 15);
      this.elements.eventHint = this.createText(716, 580, this.config.defaultEventHint, 15);
    }

    refresh() {
      const state = this.stateManager.getState();
      const labels = this.config.labels;
      const period = state.periods[state.periodIndex];

      this.elements.location.setText(`${labels.location}: ${state.currentLocation}`);
      this.elements.time.setText(`${labels.time}: ${period}`);
      this.elements.date.setText(`${labels.date}: 第 ${state.day} 天`);
      this.elements.money.setText(`${labels.money}: ${state.money}`);

      this.elements.attributes.setText([
        `${labels.health}: ${state.attributes.health}`,
        `${labels.energy}: ${state.attributes.energy}`,
        `${labels.knowledge}: ${state.attributes.knowledge}`,
        `${labels.mood}: ${state.attributes.mood}`,
        `${labels.relationship}: ${state.attributes.relationship}`,
        `${labels.money}: ${state.money}`
      ].join("\n"));
    }

    setEventHint(message) {
      this.elements.eventHint.setText(message);
    }

    createText(x, y, text, fontSize) {
      return this.scene.add.text(x, y, text, {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: `${fontSize}px`,
        color: "#ffffff",
        lineSpacing: 7,
        wordWrap: {
          width: 210
        }
      }).setScrollFactor(0);
    }
  }

  UI.HUD = HUD;
})();
