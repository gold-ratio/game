(function () {
  const { Scenes } = window.CampusGame;

  class CafeteriaScene extends Scenes.BaseMapScene {
    constructor() {
      super("CafeteriaScene", "cafeteriaMap", "assets/json/maps/cafeteria.json");
    }
  }

  Scenes.CafeteriaScene = CafeteriaScene;
})();
