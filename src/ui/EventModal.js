(function () {
  const { UI } = window.CampusGame;

  class EventModal {
    constructor(scene, onChoiceSelected) {
      this.scene = scene;
      this.onChoiceSelected = onChoiceSelected;
      this.container = scene.add.container(0, 0).setDepth(1000);
      this.container.setVisible(false);
    }

    show(eventData) {
      const view = this.scene.cameras.main.worldView;

      this.container.removeAll(true);
      this.container.setPosition(view.x, view.y);
      this.container.setVisible(true);

      this.container.add(this.scene.add.rectangle(0, 0, 960, 640, 0x000000, 0.45).setOrigin(0));
      this.container.add(this.scene.add.rectangle(480, 320, 560, 360, 0x17202a, 0.96));
      this.container.add(this.scene.add.rectangle(480, 320, 560, 360).setStrokeStyle(2, 0xffffff, 0.28));

      this.container.add(this.createText(240, 172, eventData.title, 24, 500));
      this.container.add(this.createText(240, 218, eventData.description, 17, 500));

      eventData.choices.forEach((choice, index) => {
        this.createChoiceButton(choice, 260 + index * 74);
      });
    }

    hide() {
      this.container.setVisible(false);
      this.container.removeAll(true);
    }

    isOpen() {
      return this.container.visible;
    }

    createChoiceButton(choice, y) {
      const button = this.scene.add.rectangle(480, y, 500, 48, 0x253446, 1)
        .setInteractive({ useHandCursor: true });
      const label = this.createText(250, y - 12, choice.text, 16, 460);

      button.on("pointerover", function () {
        button.setFillStyle(0x2f4964, 1);
      });
      button.on("pointerout", function () {
        button.setFillStyle(0x253446, 1);
      });
      button.on("pointerdown", () => {
        this.hide();
        this.onChoiceSelected(choice);
      });

      this.container.add(button);
      this.container.add(label);
    }

    createText(x, y, text, fontSize, width) {
      return this.scene.add.text(x, y, text, {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: `${fontSize}px`,
        color: "#ffffff",
        lineSpacing: 8,
        wordWrap: { width }
      });
    }
  }

  UI.EventModal = EventModal;
})();
