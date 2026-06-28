(function () {
  const { Entities } = window.CampusGame;

  class NPC {
    constructor(scene, data) {
      this.scene = scene;
      this.data = data;

      this.sprite = scene.add.rectangle(
        data.x,
        data.y,
        data.size.width,
        data.size.height,
        Phaser.Display.Color.HexStringToColor(data.color).color
      );
      scene.physics.add.existing(this.sprite, true);

      this.label = scene.add.text(data.x, data.y - data.size.height / 2 - 22, data.name, {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 6, y: 3 }
      }).setOrigin(0.5);
    }

    isNear(target) {
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        target.x,
        target.y
      );
      return distance <= this.data.interactionRange;
    }

    destroy() {
      this.label.destroy();
      this.sprite.destroy();
    }
  }

  Entities.NPC = NPC;
})();
