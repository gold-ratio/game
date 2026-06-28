(function () {
  const { Entities, Managers, Scenes, Systems, UI } = window.CampusGame;

  class BaseMapScene extends Phaser.Scene {
    constructor(sceneKey, mapKey, mapPath) {
      super(sceneKey);
      this.mapKey = mapKey;
      this.mapPath = mapPath;
      this.activeDoor = null;
      this.eventHintLocked = false;
    }

    init(data) {
      this.spawnId = data && data.spawnId ? data.spawnId : "default";
    }

    preload() {
      this.load.json(this.mapKey, this.mapPath);
      this.load.json("playerConfig", "assets/json/player.json");
      this.load.json("gameStateDefaults", "assets/json/game_state.json");
      this.load.json("hudConfig", "assets/json/ui/hud.json");
      this.load.json("timeConfig", "assets/json/system/time.json");
      this.load.json("diaryConfig", "assets/json/system/diary.json");
      this.load.json("endingConfig", "assets/json/endings.json");
      this.load.json("settingsConfig", "assets/json/ui/settings.json");
      this.load.json(`${this.mapKey}Events`, `assets/json/events/${this.mapKey.replace("Map", "")}.json`);
      this.load.json(`${this.mapKey}NPC`, `assets/json/npc/${this.mapKey.replace("Map", "")}.json`);
    }

    create() {
      this.mapData = this.cache.json.get(this.mapKey);
      this.playerData = this.cache.json.get("playerConfig");
      this.stateDefaults = this.cache.json.get("gameStateDefaults");
      this.hudConfig = this.cache.json.get("hudConfig");
      this.timeConfig = this.cache.json.get("timeConfig");
      this.diaryConfig = this.cache.json.get("diaryConfig");
      this.endingConfig = this.cache.json.get("endingConfig");
      this.settingsConfig = this.cache.json.get("settingsConfig");
      this.eventsData = this.cache.json.get(`${this.mapKey}Events`);
      this.npcData = this.cache.json.get(`${this.mapKey}NPC`);
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.eventKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
      this.dialogueKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
      this.advanceTimeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
      this.settingsKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      Managers.GameStateManager.initialize(this.stateDefaults);
      Managers.GameStateManager.setLocation(this.mapData.name);
      Systems.TimeSystem.initialize(Managers.GameStateManager, this.timeConfig);
      Managers.EventManager.initialize(Managers.GameStateManager, Systems.TimeSystem);
      Managers.DiaryManager.initialize();
      Managers.EndingManager.initialize(this.endingConfig);

      this.createMap();
      this.createNpcs();
      this.createPlayer();
      this.createCamera();
      this.createHud();
      this.createEventModal();
      this.createDialogueModal();
      this.createDailySummaryModal();
      this.createEndingModal();
      this.createSettingsModal();

      this.cameras.main.fadeIn(300, 0, 0, 0);
    }

    update() {
      if (this.endingModal.isOpen()) {
        this.player.stop();
        return;
      }

      if (this.settingsModal.isOpen()) {
        this.player.stop();
        if (Phaser.Input.Keyboard.JustDown(this.settingsKey)) {
          this.settingsModal.hide();
        }
        return;
      }

      if (this.eventModal.isOpen() || this.dialogueModal.isOpen() || this.dailySummaryModal.isOpen()) {
        this.player.stop();
        return;
      }

      this.player.update();
      this.updateActiveDoor();
      this.updateActiveNpc();
      this.updateInteractionHint();

      if (this.activeDoor && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        Managers.SceneTransitionManager.fadeTo(this, this.activeDoor.targetScene, {
          spawnId: this.activeDoor.targetSpawn
        });
      }

      if (Phaser.Input.Keyboard.JustDown(this.advanceTimeKey)) {
        this.advanceTimeForTest();
      }

      if (Phaser.Input.Keyboard.JustDown(this.eventKey)) {
        this.openRandomEvent();
      }

      if (this.activeNpc && Phaser.Input.Keyboard.JustDown(this.dialogueKey)) {
        this.openDialogue();
      }

      if (Phaser.Input.Keyboard.JustDown(this.settingsKey)) {
        this.openSettings();
      }
    }

    createMap() {
      const world = this.mapData.world;
      const backgroundColor = this.toColor(this.mapData.backgroundColor);

      this.physics.world.setBounds(0, 0, world.width, world.height);
      this.add.rectangle(0, 0, world.width, world.height, backgroundColor).setOrigin(0);

      this.createObstacles();
      this.createDoors();
    }

    createObstacles() {
      this.obstacles = this.physics.add.staticGroup();
      (this.mapData.obstacles || []).forEach((obstacle) => {
        const block = this.add.rectangle(
          obstacle.x,
          obstacle.y,
          obstacle.width,
          obstacle.height,
          this.toColor(obstacle.color)
        );
        this.physics.add.existing(block, true);
        this.obstacles.add(block);
      });
    }

    createDoors() {
      this.doors = (this.mapData.doors || []).map((door) => {
        const area = this.add.rectangle(
          door.x,
          door.y,
          door.width,
          door.height,
          this.toColor(door.color || "#ffffff"),
          0.42
        );
        area.setStrokeStyle(2, 0xffffff, 0.8);

        this.add.text(door.x, door.y - door.height / 2 - 20, door.label, {
          fontFamily: "Arial, Microsoft YaHei, sans-serif",
          fontSize: "15px",
          color: "#ffffff",
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          padding: { x: 6, y: 3 }
        }).setOrigin(0.5);

        return Object.assign({}, door, { area });
      });
    }

    createPlayer() {
      const spawn = this.findSpawnPoint();
      this.player = new Entities.Player(this, this.playerData, spawn);
      this.physics.add.collider(this.player.sprite, this.obstacles);
      this.npcColliders = Managers.NPCManager.addPlayerColliders(this, this.player.sprite, this.npcs);
    }

    createNpcs() {
      this.npcs = Managers.NPCManager.createNpcs(this, this.npcData, Managers.GameStateManager.getState());
    }

    refreshNpcs() {
      Managers.NPCManager.clearNpcs(this.npcs, this.npcColliders);
      this.activeNpc = null;
      this.createNpcs();
      this.npcColliders = Managers.NPCManager.addPlayerColliders(this, this.player.sprite, this.npcs);
    }

    createCamera() {
      const world = this.mapData.world;

      this.cameras.main.setBounds(0, 0, world.width, world.height);
      this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
      this.cameras.main.setZoom(1);
    }

    createHud() {
      this.hud = new UI.HUD(this, Managers.GameStateManager, this.hudConfig);
    }

    createEventModal() {
      this.eventModal = new UI.EventModal(this, this.handleEventChoice.bind(this));
    }

    createDialogueModal() {
      this.dialogueModal = new UI.DialogueModal(this);
    }

    createDailySummaryModal() {
      this.dailySummaryModal = new UI.DailySummaryModal(this);
    }

    createEndingModal() {
      this.endingModal = new UI.EndingModal(this, {
        resetGame: this.resetGameState.bind(this)
      });
    }

    createSettingsModal() {
      this.settingsModal = new UI.SettingsModal(this, this.settingsConfig, {
        resetGame: this.resetGameState.bind(this),
        clearDiaries: this.clearDiaries.bind(this),
        close: this.closeSettings.bind(this)
      });
    }

    updateActiveDoor() {
      this.activeDoor = null;

      this.doors.forEach((door) => {
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.sprite.getBounds(), door.area.getBounds())) {
          this.activeDoor = door;
        }
      });

    }

    updateActiveNpc() {
      this.activeNpc = Managers.NPCManager.findNearbyNpc(this.player.sprite, this.npcs);
    }

    updateInteractionHint() {
      if (this.activeNpc) {
        this.hud.setEventHint(`按 Q 与 ${this.activeNpc.data.name} 对话。`);
      } else if (this.activeDoor) {
        this.hud.setEventHint(`按 E 进入：${this.activeDoor.label}`);
      } else if (!this.eventHintLocked) {
        this.hud.setEventHint(`${this.hudConfig.defaultEventHint} 按 F 触发事件。`);
      }
    }

    openDialogue() {
      this.dialogueModal.show(this.activeNpc.data);
    }

    openSettings() {
      this.settingsModal.show(Managers.SaveManager.getSaveInfo(Managers.GameStateManager, Managers.DiaryManager));
    }

    closeSettings() {
      this.settingsModal.hide();
    }

    resetGameState() {
      Managers.SaveManager.resetGame(Managers.GameStateManager, this.stateDefaults);
      Managers.SaveManager.clearDiaries(Managers.DiaryManager);
      Managers.GameStateManager.setLocation(this.mapData.name);
      Managers.EndingManager.clearEnding();
      this.hud.refresh();
      this.settingsModal.show(Managers.SaveManager.getSaveInfo(Managers.GameStateManager, Managers.DiaryManager));
      this.setTemporaryEventHint("游戏状态已重置。");
    }

    clearDiaries() {
      Managers.SaveManager.clearDiaries(Managers.DiaryManager);
      this.settingsModal.show(Managers.SaveManager.getSaveInfo(Managers.GameStateManager, Managers.DiaryManager));
      this.setTemporaryEventHint("日记记录已清除。");
    }

    openRandomEvent() {
      const event = Managers.EventManager.pickRandomEvent(this.eventsData, Managers.GameStateManager.getState());
      if (!event) {
        this.setTemporaryEventHint("这里暂时没有可触发的事件。");
        return;
      }

      this.currentEvent = event;
      this.eventModal.show(event);
    }

    handleEventChoice(choice) {
      const eventTitle = this.currentEvent.title;
      Managers.DiaryManager.recordEvent({
        day: Managers.GameStateManager.getState().day,
        location: this.mapData.name,
        title: eventTitle,
        choice: choice.text,
        effects: choice.effects || {}
      });

      const result = Managers.EventManager.resolveChoice(choice);
      const dayText = result.time.dayChanged ? `，进入第 ${result.time.day} 天` : "";
      const allowanceText = result.time.allowance ? `，收到生活费 ${result.time.allowance.amount}` : "";

      this.refreshNpcs();
      this.hud.refresh();
      this.setTemporaryEventHint(`完成事件：${eventTitle}。时间：${result.time.period}${dayText}${allowanceText}`);
      if (result.time.dayChanged) {
        this.showDailySummary(result);
      }
      this.currentEvent = null;
    }

    advanceTimeForTest() {
      const result = Systems.TimeSystem.advanceTime();
      const dayText = result.dayChanged ? `，进入第 ${result.day} 天` : "";
      const allowanceText = result.allowance ? `，收到生活费 ${result.allowance.amount}` : "";

      this.refreshNpcs();
      this.hud.refresh();
      this.setTemporaryEventHint(`时间推进到：${result.period}${dayText}${allowanceText}`);
      if (result.dayChanged) {
        this.showDailySummary(result);
      }
    }

    showDailySummary(timeResult) {
      const summary = Systems.AIDiaryGenerator.generate({
        diaryConfig: this.diaryConfig,
        records: Managers.DiaryManager.getRecordsForDay(timeResult.previousDay),
        state: Managers.GameStateManager.getState(),
        finishedDay: timeResult.previousDay
      });

      Managers.DiaryManager.saveDiary(summary);
      Managers.DiaryManager.clearRecordsForDay(timeResult.previousDay);
      const ending = Managers.EndingManager.evaluate(
        Managers.GameStateManager.getState(),
        timeResult.previousDay
      );

      this.dailySummaryModal.show(summary, Managers.GameStateManager.getState(), () => {
        if (ending) {
          this.endingModal.show(ending, Managers.GameStateManager.getState());
        }
      });
    }

    setTemporaryEventHint(message) {
      this.eventHintLocked = true;
      this.hud.setEventHint(message);
      this.time.delayedCall(1800, function () {
        this.eventHintLocked = false;
      }, [], this);
    }

    findSpawnPoint() {
      const spawns = this.mapData.spawns || {};
      return spawns[this.spawnId] || spawns.default || this.playerData.start;
    }

    toColor(hex) {
      return Phaser.Display.Color.HexStringToColor(hex).color;
    }
  }

  Scenes.BaseMapScene = BaseMapScene;
})();
