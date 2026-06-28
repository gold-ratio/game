(function () {
  const { Systems } = window.CampusGame;

  Systems.AIDialogGenerator = {
    isEnabled() {
      return false;
    },

    generate() {
      return Promise.resolve(null);
    }
  };
})();
