(function () {
  const { Managers } = window.CampusGame;

  Managers.SceneTransitionManager = {
    fadeTo(scene, targetScene, data) {
      scene.cameras.main.fadeOut(300, 0, 0, 0);
      scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, function () {
        scene.scene.start(targetScene, data || {});
      });
    }
  };
})();
