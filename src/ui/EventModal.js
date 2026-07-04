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
      this.container.add(this.scene.add.rectangle(480, 320, 680, 460, 0x17202a, 0.96));
      this.container.add(this.scene.add.rectangle(480, 320, 680, 460).setStrokeStyle(2, 0xffffff, 0.28));

      this.container.add(this.createText(160, 120, eventData.title, 24, 640, "#ffffff", { maxLines: 2 }));
      const description = this.createText(160, 175, eventData.description, 17, 640, "#ffffff", { maxLines: 7 });
      this.container.add(description);

      const choiceStartY = Phaser.Math.Clamp(210 + description.height, 300, 430);
      eventData.choices.forEach((choice, index) => {
        this.createChoiceButton(choice, choiceStartY + index * 66);
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
      const button = this.scene.add.rectangle(480, y, 620, 54, 0x253446, 1)
        .setInteractive({ useHandCursor: true });
      const label = this.createText(185, y - 18, choice.text, 16, 590, "#ffffff", { maxLines: 2 });

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

    createText(x, y, text, fontSize, width, color, options) {
      const wrappedText = this.wrapText(text, fontSize, width, options && options.maxLines);
      return this.scene.add.text(x, y, wrappedText, {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: `${fontSize}px`,
        color: color || "#ffffff",
        lineSpacing: 6,
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

  UI.EventModal = EventModal;
})();
