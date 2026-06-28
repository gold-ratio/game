(function () {
  const { UI } = window.CampusGame;

  class SettingsModal {
    constructor(scene, config, actions) {
      this.scene = scene;
      this.config = config;
      this.actions = actions;
      this.container = scene.add.container(0, 0).setDepth(1200);
      this.container.setVisible(false);
    }

    show(saveInfo) {
      const view = this.scene.cameras.main.worldView;

      this.container.removeAll(true);
      this.container.setPosition(view.x, view.y);
      this.container.setVisible(true);

      this.container.add(this.scene.add.rectangle(0, 0, 960, 640, 0x000000, 0.5).setOrigin(0));
      this.container.add(this.scene.add.rectangle(480, 320, 520, 360, 0x17202a, 0.98));
      this.container.add(this.scene.add.rectangle(480, 320, 520, 360).setStrokeStyle(2, 0xffffff, 0.3));
      this.container.add(this.createText(260, 170, this.config.title, 25, 440, "#f7f3c7"));
      this.container.add(this.createText(260, 220, this.formatInfo(saveInfo), 17, 440, "#ffffff"));

      this.createButton(360, 350, this.config.buttons.resetGame, this.actions.resetGame);
      this.createButton(600, 350, this.config.buttons.clearDiaries, this.actions.clearDiaries);
      this.createButton(480, 420, this.config.buttons.close, this.actions.close);
    }

    formatInfo(saveInfo) {
      return [
        `当前地点：${saveInfo.location}`,
        `日期时间：第 ${saveInfo.day} 天 ${saveInfo.period}`,
        `金钱：${saveInfo.money}`,
        `已保存日记：${saveInfo.diaryCount} 篇`
      ].join("\n");
    }

    createButton(x, y, label, action) {
      const button = this.scene.add.rectangle(x, y, 190, 44, 0x253446, 1)
        .setInteractive({ useHandCursor: true });
      const text = this.createText(x - 70, y - 11, label, 16, 150, "#ffffff");

      button.on("pointerover", function () {
        button.setFillStyle(0x2f4964, 1);
      });
      button.on("pointerout", function () {
        button.setFillStyle(0x253446, 1);
      });
      button.on("pointerdown", action);

      this.container.add(button);
      this.container.add(text);
    }

    hide() {
      this.container.setVisible(false);
      this.container.removeAll(true);
    }

    isOpen() {
      return this.container.visible;
    }

    createText(x, y, text, fontSize, width, color) {
      return this.scene.add.text(x, y, text, {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: `${fontSize}px`,
        color,
        lineSpacing: 9,
        wordWrap: { width }
      });
    }
  }

  UI.SettingsModal = SettingsModal;
})();
