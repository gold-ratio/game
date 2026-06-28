(function () {
  const { Core, GameSettings, Scenes } = window.CampusGame;

  Core.createGame = function createGame() {
    return new Phaser.Game({
      type: Phaser.AUTO,
      parent: GameSettings.parent,
      width: GameSettings.width,
      height: GameSettings.height,
      backgroundColor: GameSettings.backgroundColor,
      physics: {
        default: "arcade",
        arcade: {
          debug: false
        }
      },
      scene: [
        Scenes.BootScene,
        Scenes.CampusScene,
        Scenes.DormScene,
        Scenes.ClassroomScene,
        Scenes.CafeteriaScene,
        Scenes.LibraryScene,
        Scenes.StadiumScene
      ],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    });
  };
})();
