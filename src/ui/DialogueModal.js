(function () {
  const { UI } = window.CampusGame;

  class DialogueModal {
    constructor(scene) {
      this.scene = scene;
      this.index = 0;
      this.lines = [];
      this.container = scene.add.container(0, 0).setDepth(1000);
      this.container.setVisible(false);
    }

    show(npcData) {
      this.npcData = npcData;
      this.index = 0;
      this.lines = npcData.dialogues || [];
      this.render();
    }

    render() {
      const view = this.scene.cameras.main.worldView;
      const line = this.lines[this.index] || "今天也要好好生活。";

      this.container.removeAll(true);
      this.container.setPosition(view.x, view.y);
      this.container.setVisible(true);

      this.container.add(this.scene.add.rectangle(0, 0, 960, 640, 0x000000, 0.28).setOrigin(0));
      this.container.add(this.scene.add.rectangle(480, 520, 720, 150, 0x17202a, 0.96));
      this.container.add(this.scene.add.rectangle(480, 520, 720, 150).setStrokeStyle(2, 0xffffff, 0.28));
      this.container.add(this.createText(150, 462, this.npcData.name, 20, 660, "#f7f3c7"));
      this.container.add(this.createText(150, 500, line, 17, 660, "#ffffff"));
      this.container.add(this.createText(150, 590, "点击继续", 14, 660, "#c8d5e8"));

      this.container.each((child) => {
        child.setInteractive && child.setInteractive({ useHandCursor: true });
        child.on && child.on("pointerdown", () => this.next());
      });
    }

    next() {
      this.index += 1;
      if (this.index >= this.lines.length) {
        this.hide();
        return;
      }

      this.render();
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
        lineSpacing: 8,
        wordWrap: { width }
      });
    }
  }

  UI.DialogueModal = DialogueModal;
})();
