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
      this.container.add(this.scene.add.rectangle(480, 320, 660, 470, 0x17202a, 0.97));
      this.container.add(this.scene.add.rectangle(480, 320, 660, 470).setStrokeStyle(2, 0xffffff, 0.3));

      const title = this.createText(180, 105, summary.title, 26, 600, "#f7f3c7", { maxLines: 2 });
      this.container.add(title);

      const contentY = title.y + title.height + 24;
      const content = this.createText(180, contentY, summary.content, 17, 600, "#ffffff", { maxLines: 8 });
      this.container.add(content);

      const endingY = Math.min(content.y + content.height + 22, 390);
      const endingNote = this.createText(180, endingY, summary.endingNote, 16, 600, "#dce8ff", { maxLines: 2 });
      this.container.add(endingNote);

      const nextDayY = Math.min(endingNote.y + endingNote.height + 18, 440);
      this.container.add(this.createText(180, nextDayY, `新的一天：第 ${state.day} 天 ${state.periods[state.periodIndex]}`, 16, 600, "#ffffff", { maxLines: 1 }));

      this.createCloseButton(500);
    }

    createCloseButton(y) {
      const button = this.scene.add.rectangle(480, y, 220, 46, 0x253446, 1)
        .setInteractive({ useHandCursor: true });
      const label = this.createText(420, y - 13, "开始新的一天", 16, 180, "#ffffff");

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

  UI.DailySummaryModal = DailySummaryModal;
})();
