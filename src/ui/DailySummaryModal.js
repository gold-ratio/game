(function () {
  const { UI } = window.CampusGame;

  class DailySummaryModal {
    constructor(scene) {
      this.scene = scene;
      this.container = scene.add.container(0, 0).setDepth(1100);
      this.container.setVisible(false);
    }

    show(summary, state, onClose) {
      const view = this.scene.cameras.main.worldView;

      this.onClose = onClose || null;
      this.container.removeAll(true);
      this.container.setPosition(view.x, view.y);
      this.container.setVisible(true);

      this.container.add(this.scene.add.rectangle(0, 0, 960, 640, 0x000000, 0.55).setOrigin(0));
      this.container.add(this.scene.add.rectangle(480, 320, 620, 420, 0x17202a, 0.97));
      this.container.add(this.scene.add.rectangle(480, 320, 620, 420).setStrokeStyle(2, 0xffffff, 0.3));

      this.container.add(this.createText(210, 140, summary.title, 26, 540, "#f7f3c7"));
      this.container.add(this.createText(210, 190, summary.content, 17, 540, "#ffffff"));
      this.container.add(this.createText(210, 315, summary.endingNote, 16, 540, "#dce8ff"));
      this.container.add(this.createText(210, 360, `新的一天：第 ${state.day} 天 ${state.periods[state.periodIndex]}`, 16, 540, "#ffffff"));

      this.createCloseButton();
    }

    createCloseButton() {
      const button = this.scene.add.rectangle(480, 455, 220, 46, 0x253446, 1)
        .setInteractive({ useHandCursor: true });
      const label = this.createText(420, 442, "开始新的一天", 16, 180, "#ffffff");

      button.on("pointerover", function () {
        button.setFillStyle(0x2f4964, 1);
      });
      button.on("pointerout", function () {
        button.setFillStyle(0x253446, 1);
      });
      button.on("pointerdown", () => this.hide());

      this.container.add(button);
      this.container.add(label);
    }

    hide() {
      this.container.setVisible(false);
      this.container.removeAll(true);
      if (this.onClose) {
        const callback = this.onClose;
        this.onClose = null;
        callback();
      }
    }

    isOpen() {
      return this.container.visible;
    }

    createText(x, y, text, fontSize, width, color) {
      return this.scene.add.text(x, y, text, {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: `${fontSize}px`,
        color,
        lineSpacing: 8,
        wordWrap: { width }
      });
    }
  }

  UI.DailySummaryModal = DailySummaryModal;
})();
