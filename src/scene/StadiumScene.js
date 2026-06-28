(function () {
  const { Scenes } = window.CampusGame;

  class StadiumScene extends Scenes.BaseMapScene {
    constructor() {
      super("StadiumScene", "stadiumMap", "assets/json/maps/stadium.json");
    }
  }

  Scenes.StadiumScene = StadiumScene;
})();
