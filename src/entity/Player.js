(function () {
  const { Entities } = window.CampusGame;

  class Player {
    constructor(scene, config, spawnPoint) {
      this.scene = scene;
      this.config = config;
      this.speed = config.speed;
      this.spawnPoint = spawnPoint || config.start;
      this.facing = "down";
      this.usesSprite = scene.textures.exists("playerWalk");

      this.createSprite();

      scene.physics.add.existing(this.sprite);
      this.sprite.body.setCollideWorldBounds(true);
      this.sprite.body.setSize(config.size.width, config.size.height, true);

      this.cursors = scene.input.keyboard.createCursorKeys();
      this.keys = scene.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
      });
    }

    createSprite() {
      if (!this.usesSprite) {
        this.sprite = this.scene.add.rectangle(
          this.spawnPoint.x,
          this.spawnPoint.y,
          this.config.size.width,
          this.config.size.height,
          Phaser.Display.Color.HexStringToColor(this.config.color).color
        );
        return;
      }

      this.createAnimations();
      this.sprite = this.scene.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "playerWalk", 0);
      this.sprite.setScale(0.24);
      this.sprite.setOrigin(0.5, 0.72);
    }

    createAnimations() {
      if (this.scene.anims.exists("player-down")) {
        return;
      }

      [
        ["player-down", [0, 1, 2, 3]],
        ["player-left", [4, 5, 4, 7]],
        ["player-right", [8, 9, 8, 11]],
        ["player-up", [12, 13, 14, 15]]
      ].forEach(([key, frames]) => {
        this.scene.anims.create({
          key,
          frames: frames.map((frame) => ({ key: "playerWalk", frame })),
          frameRate: 8,
          repeat: -1
        });
      });
    }

    update() {
      const velocity = new Phaser.Math.Vector2(0, 0);
      const movingLeft = this.cursors.left.isDown || this.keys.left.isDown;
      const movingRight = this.cursors.right.isDown || this.keys.right.isDown;
      const movingUp = this.cursors.up.isDown || this.keys.up.isDown;
      const movingDown = this.cursors.down.isDown || this.keys.down.isDown;

      if (movingLeft) {
        velocity.x = -1;
      } else if (movingRight) {
        velocity.x = 1;
      }

      if (movingUp) {
        velocity.y = -1;
      } else if (movingDown) {
        velocity.y = 1;
      }

      if (velocity.x < 0) {
        this.facing = "left";
      } else if (velocity.x > 0) {
        this.facing = "right";
      } else if (velocity.y < 0) {
        this.facing = "up";
      } else if (velocity.y > 0) {
        this.facing = "down";
      }

      velocity.normalize().scale(this.speed);
      this.sprite.body.setVelocity(velocity.x, velocity.y);
      this.updateAnimation(velocity);
    }

    updateAnimation(velocity) {
      if (!this.usesSprite) {
        return;
      }

      if (velocity.lengthSq() > 0) {
        this.sprite.anims.play(`player-${this.facing}`, true);
        return;
      }

      this.sprite.anims.stop();
      this.sprite.setFrame(this.getIdleFrame());
    }

    getIdleFrame() {
      return {
        down: 0,
        left: 4,
        right: 8,
        up: 12
      }[this.facing] || 0;
    }

    stop() {
      this.sprite.body.setVelocity(0, 0);
      this.updateAnimation(new Phaser.Math.Vector2(0, 0));
    }
  }

  Entities.Player = Player;
})();
