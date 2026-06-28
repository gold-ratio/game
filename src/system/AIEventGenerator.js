(function () {
  const { Systems } = window.CampusGame;

  Systems.AIEventGenerator = {
    isEnabled() {
      return false;
    },

    generate() {
      return Promise.resolve(null);
    }
  };
})();
