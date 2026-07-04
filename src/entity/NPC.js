(function () {
  const { Entities } = window.CampusGame;

  class NPC {
    constructor(scene, data) {
      this.scene = scene;
      this.data = data;

      this.sprite = this.createSprite();
      scene.physics.add.existing(this.sprite, true);
      this.sprite.body.setSize(data.size.width, data.size.height, true);

      this.label = scene.add.text(data.x, this.getLabelY(), data.name, {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 6, y: 3 }
      }).setOrigin(0.5);
    }

    createSprite() {
      const imageKey = `npc:${this.data.id}`;
      if (!this.data.image || !this.scene.textures.exists(imageKey)) {
        return this.scene.add.rectangle(
          this.data.x,
          this.data.y,
          this.data.size.width,
          this.data.size.height,
          Phaser.Display.Color.HexStringToColor(this.data.color).color
        );
      }

      return this.scene.add.image(this.data.x, this.data.y, imageKey)
        .setScale(this.data.imageScale || 0.055)
        .setOrigin(0.5, 0.72);
    }

    getLabelY() {
      if (this.sprite.type === "Image") {
        return this.sprite.y - this.sprite.displayHeight * this.sprite.originY - 18;
      }

      return this.data.y - this.data.size.height / 2 - 22;
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
