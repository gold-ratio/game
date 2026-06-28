(function () {
  const { Entities } = window.CampusGame;

  class Player {
    constructor(scene, config, spawnPoint) {
      this.scene = scene;
      this.config = config;
      this.speed = config.speed;
      this.spawnPoint = spawnPoint || config.start;

      this.sprite = scene.add.rectangle(
        this.spawnPoint.x,
        this.spawnPoint.y,
        config.size.width,
        config.size.height,
        Phaser.Display.Color.HexStringToColor(config.color).color
      );

      scene.physics.add.existing(this.sprite);
      this.sprite.body.setCollideWorldBounds(true);
      this.sprite.body.setSize(config.size.width, config.size.height);

      this.cursors = scene.input.keyboard.createCursorKeys();
      this.keys = scene.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
      });
    }

    update() {
      const velocity = new Phaser.Math.Vector2(0, 0);

      if (this.cursors.left.isDown || this.keys.left.isDown) {
        velocity.x = -1;
      } else if (this.cursors.right.isDown || this.keys.right.isDown) {
        velocity.x = 1;
      }

      if (this.cursors.up.isDown || this.keys.up.isDown) {
        velocity.y = -1;
      } else if (this.cursors.down.isDown || this.keys.down.isDown) {
        velocity.y = 1;
      }

      velocity.normalize().scale(this.speed);
      this.sprite.body.setVelocity(velocity.x, velocity.y);
    }

    stop() {
      this.sprite.body.setVelocity(0, 0);
    }
  }

  Entities.Player = Player;
})();
