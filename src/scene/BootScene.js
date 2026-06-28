(function () {
  const { Scenes } = window.CampusGame;

  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    create() {
      const { width, height } = this.scale;

      this.add.rectangle(0, 0, width, height, 0x1f2430).setOrigin(0);

      this.add.text(width / 2, height / 2 - 48, "今天在大学会发生什么？", {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: "34px",
        color: "#ffffff"
      }).setOrigin(0.5);

      this.add.text(width / 2, height / 2, "What Happens on Campus Today?", {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#dce8ff"
      }).setOrigin(0.5);

      this.add.text(width / 2, height / 2 + 62, "正在进入校园...", {
        fontFamily: "Arial, Microsoft YaHei, sans-serif",
        fontSize: "18px",
        color: "#f7f3c7"
      }).setOrigin(0.5);

      this.time.delayedCall(500, function () {
        this.scene.start("CampusScene");
      }, [], this);
    }
  }

  Scenes.BootScene = BootScene;
})();
