(function () {
  const { UI } = window.CampusGame;

  class EndingModal {
    constructor(scene, actions) {
      this.scene = scene;
      this.actions = actions;
      this.container = scene.add.container(0, 0).setDepth(1300);
      this.container.setVisible(false);
    }

    show(ending, state) {
      const view = this.scene.cameras.main.worldView;

      this.container.removeAll(true);
      this.container.setPosition(view.x, view.y);
      this.container.setVisible(true);

      this.container.add(this.scene.add.rectangle(0, 0, 960, 640, 0x000000, 0.68).setOrigin(0));
      this.container.add(this.scene.add.rectangle(480, 320, 650, 430, 0x111820, 0.98));
      this.container.add(this.scene.add.rectangle(480, 320, 650, 430).setStrokeStyle(2, 0xf7f3c7, 0.5));
      this.container.add(this.createText(200, 135, "最终结局", 22, 560, "#f7f3c7"));
      this.container.add(this.createText(200, 180, ending.title, 28, 560, "#ffffff", { maxLines: 2 }));
      this.container.add(this.createText(200, 235, ending.description, 17, 560, "#dce8ff", { maxLines: 5 }));
      this.container.add(this.createText(200, 335, this.formatAttributes(state), 15, 560, "#ffffff"));

      this.createButton(480, 465, "重新开始", this.actions.resetGame);
    }

    formatAttributes(state) {
      const attributes = state.attributes;
      return [
        `体力 ${attributes.health}  精力 ${attributes.energy}`,
        `学业 ${attributes.knowledge}  心情 ${attributes.mood}`,
        `社交 ${attributes.relationship}  金钱 ${state.money}`
      ].join("\n");
    }

    createButton(x, y, label, action) {
      const button = this.scene.add.rectangle(x, y, 220, 46, 0x253446, 1)
        .setInteractive({ useHandCursor: true });
      const text = this.createText(x - 45, y - 11, label, 16, 120, "#ffffff");

      button.on("pointerover", function () {
        button.setFillStyle(0x2f4964, 1);
      });
      button.on("pointerout", function () {
        button.setFillStyle(0x253446, 1);
      });
      button.on("pointerdown", () => {
        this.hide();
        action();
      });

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

    createText(x, y, text, fontSize, width, color, options) {
      const wrappedText = this.wrapText(text, fontSize, width, options && options.maxLines);
      return this.scene.add.text(x, y, wrappedText, {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: `${fontSize}px`,
        color,
        lineSpacing: 9,
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

  UI.EndingModal = EndingModal;
})();
