(function () {
  const { Scenes } = window.CampusGame;

  class DormScene extends Scenes.BaseMapScene {
    constructor() {
      super("DormScene", "dormMap", "assets/json/maps/dorm.json");
    }
  }

  Scenes.DormScene = DormScene;
})();
