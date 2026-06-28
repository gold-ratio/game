(function () {
  const { Scenes } = window.CampusGame;

  class CampusScene extends Scenes.BaseMapScene {
    constructor() {
      super("CampusScene", "campusMap", "assets/json/maps/campus.json");
    }
  }

  Scenes.CampusScene = CampusScene;
})();
