(function () {
  const { Scenes } = window.CampusGame;

  class ClassroomScene extends Scenes.BaseMapScene {
    constructor() {
      super("ClassroomScene", "classroomMap", "assets/json/maps/classroom.json");
    }
  }

  Scenes.ClassroomScene = ClassroomScene;
})();
