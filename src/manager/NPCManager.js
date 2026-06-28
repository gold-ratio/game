(function () {
  const { Entities, Managers } = window.CampusGame;

  Managers.NPCManager = {
    createNpcs(scene, npcData, state) {
      return ((npcData && npcData.npcs) || [])
        .filter((data) => this.shouldSpawn(data, npcData.location, state))
        .map((data) => new Entities.NPC(scene, data));
    },

    addPlayerColliders(scene, playerSprite, npcs) {
      return (npcs || []).map((npc) => scene.physics.add.collider(playerSprite, npc.sprite));
    },

    clearNpcs(npcs, colliders) {
      (colliders || []).forEach((collider) => collider.destroy());
      (npcs || []).forEach((npc) => npc.destroy());
    },

    findNearbyNpc(playerSprite, npcs) {
      return (npcs || []).find((npc) => npc.isNear(playerSprite)) || null;
    },

    shouldSpawn(data, location, state) {
      const period = state.periods[state.periodIndex];
      const spawnRate = data.spawnRate || {};
      const rate = Object.prototype.hasOwnProperty.call(spawnRate, period) ? spawnRate[period] : 1;
      const roll = this.stableRandom(`${state.day}:${period}:${location}:${data.id}`);
      return roll < rate;
    },

    stableRandom(seed) {
      let hash = 2166136261;
      for (let index = 0; index < seed.length; index += 1) {
        hash ^= seed.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0) / 4294967296;
    }
  };
})();
