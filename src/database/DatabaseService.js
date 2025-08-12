import * as SQLite from 'expo-sqlite';

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('aijournal.db');
      await this.createTables();
      console.log('数据库初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error);
    }
  }

  async createTables() {
    const tables = [
      // 个人基础信息表
      `CREATE TABLE IF NOT EXISTS personal_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        age INTEGER,
        gender TEXT,
        occupation TEXT,
        health_status TEXT,
        height REAL,
        weight REAL,
        blood_type TEXT,
        allergies TEXT,
        medications TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 喜好表
      `CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        item TEXT NOT NULL,
        preference_type TEXT CHECK(preference_type IN ('like', 'dislike')) NOT NULL,
        intensity INTEGER DEFAULT 5,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 里程碑表
      `CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        status TEXT CHECK(status IN ('planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',
        target_date DATE,
        completed_date DATE,
        priority INTEGER DEFAULT 3,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 心情表
      `CREATE TABLE IF NOT EXISTS moods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mood_score INTEGER CHECK(mood_score >= 1 AND mood_score <= 10) NOT NULL,
        mood_type TEXT,
        description TEXT,
        triggers TEXT,
        weather TEXT,
        location TEXT,
        date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 想法表
      `CREATE TABLE IF NOT EXISTS thoughts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        inspiration_source TEXT,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 聊天记录表
      `CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.db.execAsync(table);
    }
  }

  // 插入个人信息
  async insertPersonalInfo(data) {
    const { name, age, gender, occupation, health_status, height, weight, blood_type, allergies, medications } = data;
    const result = await this.db.runAsync(
      `INSERT INTO personal_info (name, age, gender, occupation, health_status, height, weight, blood_type, allergies, medications) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, age, gender, occupation, health_status, height, weight, blood_type, allergies, medications]
    );
    return result;
  }

  // 插入喜好
  async insertPreference(data) {
    const { category, item, preference_type, intensity, notes } = data;
    const result = await this.db.runAsync(
      `INSERT INTO preferences (category, item, preference_type, intensity, notes) VALUES (?, ?, ?, ?, ?)`,
      [category, item, preference_type, intensity, notes]
    );
    return result;
  }

  // 插入里程碑
  async insertMilestone(data) {
    const { title, description, category, status, target_date, priority } = data;
    const result = await this.db.runAsync(
      `INSERT INTO milestones (title, description, category, status, target_date, priority) VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, category, status, target_date, priority]
    );
    return result;
  }

  // 插入心情
  async insertMood(data) {
    const { mood_score, mood_type, description, triggers, weather, location, date } = data;
    const result = await this.db.runAsync(
      `INSERT INTO moods (mood_score, mood_type, description, triggers, weather, location, date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [mood_score, mood_type, description, triggers, weather, location, date]
    );
    return result;
  }

  // 插入想法
  async insertThought(data) {
    const { title, content, category, tags, inspiration_source, is_favorite } = data;
    const result = await this.db.runAsync(
      `INSERT INTO thoughts (title, content, category, tags, inspiration_source, is_favorite) VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, category, tags, inspiration_source, is_favorite || false]
    );
    return result;
  }

  // 插入聊天记录
  async insertChatHistory(userMessage, aiResponse, sessionId) {
    const result = await this.db.runAsync(
      `INSERT INTO chat_history (user_message, ai_response, session_id) VALUES (?, ?, ?)`,
      [userMessage, aiResponse, sessionId]
    );
    return result;
  }

  // 获取所有表的数据
  async getAllData() {
    const tables = ['personal_info', 'preferences', 'milestones', 'moods', 'thoughts'];
    const data = {};
    
    for (const table of tables) {
      const result = await this.db.getAllAsync(`SELECT * FROM ${table} ORDER BY created_at DESC`);
      data[table] = result;
    }
    
    return data;
  }

  // 获取最近一个月的数据
  async getRecentData(days = 30) {
    const tables = ['preferences', 'milestones', 'moods', 'thoughts'];
    const data = {};
    
    // 获取个人基础信息（不限时间）
    const personalInfo = await this.db.getAllAsync(`SELECT * FROM personal_info ORDER BY updated_at DESC LIMIT 1`);
    data.personal_info = personalInfo;
    
    // 获取最近数据
    for (const table of tables) {
      const result = await this.db.getAllAsync(
        `SELECT * FROM ${table} WHERE created_at >= datetime('now', '-${days} days') ORDER BY created_at DESC`
      );
      data[table] = result;
    }
    
    return data;
  }

  // 获取特定表的数据
  async getTableData(tableName) {
    const result = await this.db.getAllAsync(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
    return result;
  }

  // 删除记录
  async deleteRecord(tableName, id) {
    const result = await this.db.runAsync(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    return result;
  }

  // 更新记录
  async updateRecord(tableName, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const result = await this.db.runAsync(
      `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );
    return result;
  }

  // 导出数据为JSON
  async exportData() {
    const data = await this.getAllData();
    return JSON.stringify(data, null, 2);
  }
}

export default new DatabaseService();