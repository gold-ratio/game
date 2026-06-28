(function () {
  const { Managers } = window.CampusGame;
  const RECORD_KEY = "campusDiaryRecords";
  const DIARY_KEY = "campusDiaries";

  Managers.DiaryManager = {
    initialize() {
      this.records = this.load(RECORD_KEY, []);
      this.diaries = this.load(DIARY_KEY, []);
    },

    recordEvent(record) {
      this.records.push(record);
      this.save(RECORD_KEY, this.records);
    },

    getRecordsForDay(day) {
      return this.records.filter((record) => record.day === day);
    },

    clearRecordsForDay(day) {
      this.records = this.records.filter((record) => record.day !== day);
      this.save(RECORD_KEY, this.records);
    },

    saveDiary(summary) {
      this.diaries.push(summary);
      this.save(DIARY_KEY, this.diaries);
    },

    clearAll() {
      this.records = [];
      this.diaries = [];
      localStorage.removeItem(RECORD_KEY);
      localStorage.removeItem(DIARY_KEY);
    },

    getDiaryCount() {
      return this.diaries.length;
    },

    load(key, fallback) {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }

      try {
        return JSON.parse(raw);
      } catch (error) {
        localStorage.removeItem(key);
        return fallback;
      }
    },

    save(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };
})();
