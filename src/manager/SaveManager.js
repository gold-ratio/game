(function () {
  const { Managers } = window.CampusGame;

  Managers.SaveManager = {
    getSaveInfo(stateManager, diaryManager) {
      const state = stateManager.getState();
      return {
        day: state.day,
        period: state.periods[state.periodIndex],
        location: state.currentLocation,
        money: state.money,
        diaryCount: diaryManager.getDiaryCount()
      };
    },

    resetGame(stateManager, defaultState) {
      stateManager.reset(defaultState);
    },

    clearDiaries(diaryManager) {
      diaryManager.clearAll();
    }
  };
})();
