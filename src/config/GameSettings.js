(function () {
  window.CampusGame = window.CampusGame || {};

  window.CampusGame.GameSettings = {
    title: "今天在大学会发生什么？",
    englishTitle: "What Happens on Campus Today?",
    width: 960,
    height: 640,
    backgroundColor: "#1f2430",
    parent: "game-root",
    ai: {
      enabled: true,
      endpoint: "http://localhost:8765",
      eventChance: 0.5,
      dialogueChance: 0.7,
      requestTimeoutMs: 120000
    }
  };
})();
