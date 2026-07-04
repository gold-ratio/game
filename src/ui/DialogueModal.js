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
      this.container.add(this.createText(150, 462, this.npcData.name, 20, 660, "#f7f3c7", { maxLines: 1 }));
      this.container.add(this.createText(150, 500, line, 17, 660, "#ffffff", { maxLines: 3 }));
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

    createText(x, y, text, fontSize, width, color, options) {
      const wrappedText = this.wrapText(text, fontSize, width, options && options.maxLines);
      return this.scene.add.text(x, y, wrappedText, {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: `${fontSize}px`,
        color,
        lineSpacing: 8,
        wordWrap: { width, useAdvancedWrap: true }
      });
    }

    wrapText(text, fontSize, width, maxLines) {
      const maxUnits = Math.max(8, Math.floor(width / (fontSize * 1.05)));
      const lines = [];
      String(text || "").split("\n").forEach((paragraph) => {
        let line = "";
        let units = 0;
        Array.from(paragraph).forEach((char) => {
          const charUnits = /[\x00-\xff]/.test(char) ? 0.55 : 1;
          if (line && units + charUnits > maxUnits) {
            lines.push(line);
            line = char;
            units = charUnits;
          } else {
            line += char;
            units += charUnits;
          }
        });
        if (line) {
          lines.push(line);
        }
      });

      if (maxLines && lines.length > maxLines) {
        const clipped = lines.slice(0, maxLines);
        clipped[maxLines - 1] = `${clipped[maxLines - 1].replace(/[。！？,.，；;：:、\s]*$/, "")}...`;
        return clipped.join("\n");
      }

      return lines.join("\n");
    }
  }

  UI.DialogueModal = DialogueModal;
})();
