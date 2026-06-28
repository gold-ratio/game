(function () {
  const { Scenes } = window.CampusGame;

  class LibraryScene extends Scenes.BaseMapScene {
    constructor() {
      super("LibraryScene", "libraryMap", "assets/json/maps/library.json");
    }
  }

  Scenes.LibraryScene = LibraryScene;
})();
