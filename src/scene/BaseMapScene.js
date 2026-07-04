(function () {
  const { Entities, Managers, Scenes, Systems, UI } = window.CampusGame;
  const ASSET_VERSION = "20260704-remove-fallback-npcs-1";

  const MAP_IMAGE_ASSETS = {
    campus: [
      "assets/image/campus_2.png"
    ],
    cafeteria: [
      "assets/image/cafeteria.png"
    ],
    classroom: [
      "assets/image/classroom.png"
    ],
    dorm: [
      "assets/image/dorm.png"
    ],
    library: [
      "assets/image/library.png"
    ],
    stadium: [
      "assets/image/stadium.png"
    ]
  };

  const IMAGE_TRIMS = {
    "assets/image/cafeteria.png": {
      sourceWidth: 1578,
      sourceHeight: 997,
      contentX: 43,
      contentY: 233,
      contentWidth: 1489,
      contentHeight: 580
    },
    "assets/image/classroom.png": {
      sourceWidth: 1612,
      sourceHeight: 976,
      contentX: 56,
      contentY: 45,
      contentWidth: 1500,
      contentHeight: 879
    },
    "assets/image/dorm.png": {
      sourceWidth: 1536,
      sourceHeight: 1024,
      contentX: 12,
      contentY: 0,
      contentWidth: 1511,
      contentHeight: 1023
    },
    "assets/image/express_station.png": {
      sourceWidth: 1698,
      sourceHeight: 926,
      contentX: 325,
      contentY: 95,
      contentWidth: 1045,
      contentHeight: 732
    },
    "assets/image/notice_board.png": {
      sourceWidth: 1774,
      sourceHeight: 887,
      contentX: 434,
      contentY: 65,
      contentWidth: 906,
      contentHeight: 755
    },
    "assets/image/stadium.png": {
      sourceWidth: 1774,
      sourceHeight: 887,
      contentX: 46,
      contentY: 34,
      contentWidth: 1682,
      contentHeight: 806
    }
  };

  class BaseMapScene extends Phaser.Scene {
    constructor(sceneKey, mapKey, mapPath) {
      super(sceneKey);
      this.mapKey = mapKey;
      this.mapPath = mapPath;
      this.activeDoor = null;
      this.activeInteraction = null;
      this.eventHintLocked = false;
      this.eventGenerating = false;
      this.dialogueGenerating = false;
      this.summaryGenerating = false;
      this.lastClockRefresh = 0;
    }

    init(data) {
      this.spawnId = data && data.spawnId ? data.spawnId : "default";
    }

    preload() {
      const locationId = this.getLocationId();
      this.load.json(this.mapKey, this.withAssetVersion(this.mapPath));
      this.load.json("playerConfig", this.withAssetVersion("assets/json/player.json"));
      this.load.json("gameStateDefaults", this.withAssetVersion("assets/json/game_state.json"));
      this.load.json("hudConfig", this.withAssetVersion("assets/json/ui/hud.json"));
      this.load.json("timeConfig", this.withAssetVersion("assets/json/system/time.json"));
      this.load.json("diaryConfig", this.withAssetVersion("assets/json/system/diary.json"));
      this.load.json("endingConfig", this.withAssetVersion("assets/json/endings.json"));
      this.load.json("settingsConfig", this.withAssetVersion("assets/json/ui/settings.json"));
      this.load.json(`${this.mapKey}Events`, this.withAssetVersion(`assets/json/events/${locationId}.json`));
      this.load.json(`${this.mapKey}NPC`, this.withAssetVersion(`assets/json/npc/${locationId}.json`));
      if (!this.textures.exists("playerWalk")) {
        this.load.spritesheet("playerWalk", this.withAssetVersion("assets/image/player_walk_sheet.png"), {
          frameWidth: 180,
          frameHeight: 320
        });
      }
      (MAP_IMAGE_ASSETS[locationId] || []).forEach((path) => {
        this.load.image(this.getBackgroundImageKey(), this.withAssetVersion(path));
      });
      this.loadNpcImages(locationId);
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
      this.hud.refresh();

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

      if (
        this.eventGenerating ||
        this.dialogueGenerating ||
        this.summaryGenerating ||
        this.eventModal.isOpen() ||
        this.dialogueModal.isOpen() ||
        this.dailySummaryModal.isOpen()
      ) {
        this.player.stop();
        return;
      }

      if (this.updateRealTimeClock()) {
        this.player.stop();
        return;
      }

      this.player.update();
      this.updateActiveDoor();
      this.updateActiveInteraction();
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
        if (this.activeInteraction) {
          this.openInteractionEvent(this.activeInteraction);
        } else {
          this.openRandomEvent();
        }
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
      this.mapFallbackBackground = this.add.rectangle(0, 0, world.width, world.height, backgroundColor).setOrigin(0);
      if (this.mapData.backgroundImage) {
        const loadingText = this.createFixedDebugText(24, 24, `正在加载背景图：${this.mapData.backgroundImage}`);
        this.loadMapBackgroundImage(this.mapData.backgroundImage, world, loadingText);
      }

      this.createObstacles();
      this.createDoors();
      this.createInteractions();
    }

    createFixedDebugText(x, y, text) {
      return this.add.text(x, y, text, {
            fontFamily: "Arial, Microsoft YaHei, sans-serif",
            fontSize: "18px",
            color: "#ffffff",
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            padding: { x: 8, y: 5 }
          })
        .setScrollFactor(0)
        .setDepth(2000);
    }

    addMapBackgroundImage(world) {
      if (this.mapFallbackBackground && this.mapFallbackBackground.active) {
        this.mapFallbackBackground.destroy();
      }

      const background = this.add.image(0, 0, this.getBackgroundImageKey())
        .setOrigin(0)
        .setDisplaySize(world.width, world.height)
        .setDepth(0);

      this.children.sendToBack(background);
      return background;
    }

    loadMapBackgroundImage(path, world, loadingText) {
      const key = this.getBackgroundImageKey();
      const image = new Image();

      image.onload = () => {
        try {
          if (this.textures.exists(key)) {
            this.textures.remove(key);
          }

          const canvasTexture = this.textures.createCanvas(key, image.naturalWidth, image.naturalHeight);
          canvasTexture.context.drawImage(image, 0, 0);
          canvasTexture.refresh();
          this.addMapBackgroundImage(world);

          if (loadingText && loadingText.active) {
            loadingText.destroy();
          }
        } catch (error) {
          const message = error && error.message ? error.message : String(error);
          if (loadingText && loadingText.active) {
            loadingText.setText(`背景图渲染失败：${message}`);
          } else {
            this.createFixedDebugText(24, 24, `背景图渲染失败：${message}`);
          }
        }
      };

      image.onerror = () => {
        if (loadingText && loadingText.active) {
          loadingText.setText(`背景图加载失败：${path}`);
        }
      };

      image.src = this.withAssetVersion(path);
    }

    createObstacles() {
      this.obstacles = this.physics.add.staticGroup();
      (this.mapData.obstacles || []).forEach((obstacle) => {
        const obstacleAlpha = this.mapData.backgroundImage ? 0 : 1;
        const block = obstacle.image
          ? this.createObstacleImage(obstacle)
          : this.add.rectangle(
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height,
            this.toColor(obstacle.color),
            obstacleAlpha
          );
        this.physics.add.existing(block, true);
        block.body.setSize(obstacle.width, obstacle.height);
        this.obstacles.add(block);
      });
    }

    createObstacleImage(obstacle) {
      const visualScale = Number(obstacle.imageScale) || 1;
      const visualWidth = obstacle.width * visualScale;
      const visualHeight = obstacle.height * visualScale;
      const trim = IMAGE_TRIMS[obstacle.image];
      if (!trim) {
        return this.add.image(obstacle.x, obstacle.y, this.getImageKey(obstacle.image))
          .setDisplaySize(visualWidth, visualHeight);
      }

      const scaleX = visualWidth / trim.contentWidth;
      const scaleY = visualHeight / trim.contentHeight;
      const contentCenterX = trim.contentX + trim.contentWidth / 2;
      const contentCenterY = trim.contentY + trim.contentHeight / 2;
      const sourceCenterX = trim.sourceWidth / 2;
      const sourceCenterY = trim.sourceHeight / 2;
      const imageX = obstacle.x - (contentCenterX - sourceCenterX) * scaleX;
      const imageY = obstacle.y - (contentCenterY - sourceCenterY) * scaleY;

      return this.add.image(imageX, imageY, this.getImageKey(obstacle.image))
        .setDisplaySize(trim.sourceWidth * scaleX, trim.sourceHeight * scaleY);
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

    createInteractions() {
      this.interactions = (this.mapData.interactions || []).map((interaction) => {
        const area = this.add.rectangle(
          interaction.x,
          interaction.y,
          interaction.width,
          interaction.height,
          0x000000,
          0
        );

        return Object.assign({}, interaction, { area });
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

    updateActiveInteraction() {
      this.activeInteraction = null;

      (this.interactions || []).forEach((interaction) => {
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.sprite.getBounds(), interaction.area.getBounds())) {
          this.activeInteraction = interaction;
        }
      });
    }

    updateInteractionHint() {
      if (this.activeInteraction) {
        this.hud.setEventHint(`按 F：${this.activeInteraction.label}`);
      } else if (this.activeNpc) {
        this.hud.setEventHint(`按 Q 与 ${this.activeNpc.data.name} 对话。`);
      } else if (this.activeDoor) {
        this.hud.setEventHint(`按 E 进入：${this.activeDoor.label}`);
      } else if (!this.eventHintLocked) {
        this.hud.setEventHint(`${this.hudConfig.defaultEventHint} 按 F 触发事件。`);
      }
    }

    async openDialogue() {
      if (this.dialogueGenerating || !this.activeNpc) {
        return;
      }

      const npcData = this.activeNpc.data;
      if (npcData.keyNpc) {
        const favorGain = npcData.dialogueFavor || 2;
        const favor = Managers.GameStateManager.addNpcFavor(npcData.id, favorGain);
        this.setTemporaryEventHint(`${npcData.name} 好感度 +${favorGain}（当前 ${favor}）`);
      }

      if (!Systems.AIDialogGenerator.shouldTry()) {
        this.dialogueModal.show(npcData, Managers.GameStateManager.getNpcFavor(npcData.id));
        return;
      }

      this.dialogueGenerating = true;
      this.setTemporaryEventHint(`正在生成 ${npcData.name} 的即时对话...`);
      const aiNpc = await Systems.AIDialogGenerator.generate({
        npc: npcData,
        locationId: this.getLocationId(),
        locationName: this.mapData.name,
        period: this.getCurrentPeriod(),
        state: Managers.GameStateManager.getState(),
        recentRecords: Managers.DiaryManager.getRecordsForDay(Managers.GameStateManager.getState().day).slice(-4)
      });
      this.dialogueGenerating = false;

      if (!aiNpc) {
        this.setTemporaryEventHint("AI 对话生成失败，使用本地对话。");
      }
      this.dialogueModal.show(aiNpc || npcData, Managers.GameStateManager.getNpcFavor(npcData.id));
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

    async openRandomEvent() {
      if (this.eventGenerating) {
        return;
      }

      this.eventGenerating = true;
      let event = null;
      let triedAI = false;

      if (Systems.AIEventGenerator.shouldTry()) {
        triedAI = true;
        this.setTemporaryEventHint("正在生成一件临时校园事件...");
        event = await Systems.AIEventGenerator.generate({
          locationId: this.getLocationId(),
          locationName: this.mapData.name,
          period: this.getCurrentPeriod(),
          state: Managers.GameStateManager.getState(),
          existingEvents: (this.eventsData.events || []).map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description
          })),
          recentRecords: Managers.DiaryManager.getRecordsForDay(Managers.GameStateManager.getState().day).slice(-4)
        });
      }

      if (!event) {
        if (triedAI) {
          this.setTemporaryEventHint("AI 事件生成失败，使用本地事件。");
        }
        event = Managers.EventManager.pickRandomEvent(this.eventsData, Managers.GameStateManager.getState());
      }

      this.eventGenerating = false;
      if (!event) {
        this.setTemporaryEventHint("这里暂时没有可触发的事件。");
        return;
      }

      this.currentEvent = event;
      this.eventModal.show(event);
    }

    openInteractionEvent(interaction) {
      const event = Managers.EventManager.findEventById(
        this.eventsData,
        interaction.eventId,
        Managers.GameStateManager.getState()
      );
      if (!event) {
        this.setTemporaryEventHint(`${interaction.label} 现在没有新的事情发生。`);
        return;
      }

      this.currentEvent = event;
      this.eventModal.show(event);
    }

    handleEventChoice(choice) {
      const eventTitle = this.currentEvent.title;
      const eventId = this.currentEvent.id;
      const effects = choice.effects || {};
      Managers.DiaryManager.recordEvent({
        day: Managers.GameStateManager.getState().day,
        location: this.mapData.name,
        title: eventTitle,
        choice: choice.text,
        effects
      });

      Managers.EventManager.stateManager.applyEffects(effects);
      Managers.GameStateManager.markEventCooldown(eventId, this.currentEvent.cooldownMs || 120000);

      if (choice.next_event) {
        const nextEvent = Managers.EventManager.findEventById(
          this.eventsData,
          choice.next_event,
          Managers.GameStateManager.getState(),
          { ignoreCooldown: true }
        );
        if (nextEvent) {
          this.hud.refresh();
          this.currentEvent = nextEvent;
          this.eventModal.show(nextEvent);
          return;
        }
      }

      const timeResult = this.timeConfig.advanceOnEventComplete === false
        ? null
        : Systems.TimeSystem.advanceTime();
      const timeText = timeResult ? ` 时间：${timeResult.period}${timeResult.dayChanged ? `，进入第 ${timeResult.day} 天` : ""}` : "";
      const allowanceText = timeResult && timeResult.allowance ? `，收到生活费 ${timeResult.allowance.amount}` : "";

      this.refreshNpcs();
      this.hud.refresh();
      this.setTemporaryEventHint(`完成：${eventTitle}。${this.formatEffectSummary(effects)}${timeText}${allowanceText}`);
      if (timeResult && timeResult.dayChanged) {
        this.showDailySummary(timeResult);
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

    updateRealTimeClock() {
      const now = Date.now();
      if (now - this.lastClockRefresh < 1000) {
        return false;
      }

      this.lastClockRefresh = now;
      Managers.GameStateManager.clearExpiredEventCooldowns();
      const result = Systems.TimeSystem.syncTime();
      this.hud.refresh();
      if (result.dayChanged) {
        this.refreshNpcs();
        this.showDailySummary(result);
        return true;
      }
      if (result.periodChanged) {
        this.refreshNpcs();
        this.setTemporaryEventHint(`时间来到：${result.period}`);
      }

      return false;
    }

    async showDailySummary(timeResult) {
      if (this.summaryGenerating) {
        return;
      }

      this.summaryGenerating = true;
      this.setTemporaryEventHint("正在整理今日校园日记...");
      const summary = await Systems.AIDiaryGenerator.generate({
        diaryConfig: this.diaryConfig,
        records: Managers.DiaryManager.getRecordsForDay(timeResult.previousDay),
        state: Managers.GameStateManager.getState(),
        finishedDay: timeResult.previousDay
      });
      this.summaryGenerating = false;

      Managers.DiaryManager.saveDiary(summary);
      Managers.DiaryManager.clearRecordsForDay(timeResult.previousDay);
      const ending = Managers.EndingManager.evaluate(
        Managers.GameStateManager.getState(),
        timeResult.previousDay
      );

      this.dailySummaryModal.show(summary, Managers.GameStateManager.getState(), () => {
        if (ending) {
          this.endingModal.show(ending, Managers.GameStateManager.getState());
          return;
        }

        if (this.scene.key !== "DormScene") {
          Managers.SceneTransitionManager.fadeTo(this, "DormScene", {
            spawnId: "default"
          });
        } else {
          this.scene.restart({ spawnId: "default" });
        }
      });
    }

    setTemporaryEventHint(message) {
      this.eventHintLocked = true;
      this.hud.setEventHint(message);
      this.time.delayedCall(4200, function () {
        this.eventHintLocked = false;
      }, [], this);
    }

    formatEffectSummary(effects) {
      const labels = {
        health: "体力",
        energy: "精力",
        knowledge: "学业",
        mood: "心情",
        relationship: "社交",
        money: "金钱"
      };
      const parts = Object.keys(effects || {})
        .filter((key) => Object.prototype.hasOwnProperty.call(labels, key))
        .map((key) => `${labels[key]}${effects[key] >= 0 ? "+" : ""}${effects[key]}`);

      Object.keys((effects && effects.npcFavor) || {}).forEach((npcId) => {
        parts.push(`好感(${npcId})+${effects.npcFavor[npcId]}`);
      });
      Object.keys((effects && effects.progress) || {}).forEach((progressId) => {
        parts.push(`进度(${progressId})+${effects.progress[progressId]}`);
      });

      return parts.length ? parts.join("，") : "没有属性变化";
    }

    findSpawnPoint() {
      const spawns = this.mapData.spawns || {};
      return spawns[this.spawnId] || spawns.default || this.playerData.start;
    }

    getLocationId() {
      return this.mapKey.replace("Map", "");
    }

    getCurrentPeriod() {
      const state = Managers.GameStateManager.getState();
      return state.periods[state.periodIndex];
    }

    getImageKey(path) {
      return path;
    }

    getBackgroundImageKey() {
      return `${this.mapKey}Background`;
    }

    loadNpcImages(locationId) {
      const npcImages = {
        campus: {
          club_senior: "assets/image/shetuan.png",
          lost_freshman: "assets/image/xinsheng.png",
          delivery_student: "assets/image/kuaidi.png"
        },
        cafeteria: {
          cafeteria_auntie: "assets/image/cafeteria_auntie.png",
          hungry_student: "assets/image/hungry_student.png",
          budget_student: "assets/image/budget_student.png",
          late_dinner_student: "assets/image/late_dinner_student.png"
        },
        classroom: {
          teacher: "assets/image/teacher.png",
          front_row_student: "assets/image/front_row_student.png",
          group_partner: "assets/image/group_partner.png",
          late_student: "assets/image/late_student.png",
          review_student: "assets/image/review_student.png"
        },
        dorm: {
          roommate: "assets/image/roommate.png",
          sleepy_student: "assets/image/sleepy_student.png",
          study_roommate: "assets/image/study_roommate.png",
          game_roommate: "assets/image/game_roommate.png"
        },
        library: {
          librarian: "assets/image/librarian.png",
          quiet_reader: "assets/image/quiet_reader.png",
          exam_student: "assets/image/exam_student.png"
        },
        stadium: {
          coach: "assets/image/coach.png",
          runner: "assets/image/runner.png",
          basketball_student: "assets/image/basketball_student.png"
        }
      };
      Object.entries(npcImages[locationId] || {}).forEach(([id, path]) => {
        this.load.image(this.getNpcImageKey(id), this.withAssetVersion(path));
      });
    }

    getNpcImageKey(id) {
      return `npc:${id}`;
    }

    withAssetVersion(path) {
      const separator = path.indexOf("?") === -1 ? "?" : "&";
      return `${path}${separator}v=${ASSET_VERSION}`;
    }

    toColor(hex) {
      return Phaser.Display.Color.HexStringToColor(hex).color;
    }
  }

  Scenes.BaseMapScene = BaseMapScene;
})();
