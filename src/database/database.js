import * as SQLite from 'expo-sqlite';

// 数据库实例
let db = null;

// 初始化数据库
export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('dietCoach.db');
    
    // 创建饮食记录表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS diet_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_name TEXT NOT NULL,
        calories REAL,
        protein REAL,
        carbs REAL,
        fat REAL,
        quantity TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 创建运动记录表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercise_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_name TEXT NOT NULL,
        duration INTEGER,
        calories_burned REAL,
        intensity TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 创建聊天记录表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS chat_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 创建建议记录表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        suggestion_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 创建快捷键设置表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS shortcuts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL, -- 'diet' or 'exercise'
        name TEXT NOT NULL,
        data TEXT NOT NULL, -- JSON格式存储详细信息
        position INTEGER NOT NULL
      );
    `);
    
    console.log('数据库初始化成功');
    return db;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

// 获取数据库实例
export const getDatabase = () => {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return db;
};

// 饮食记录相关操作
export const dietOperations = {
  // 添加饮食记录
  async add(record) {
    const database = getDatabase();
    const result = await database.runAsync(
      'INSERT INTO diet_records (food_name, calories, protein, carbs, fat, quantity, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [record.food_name, record.calories, record.protein, record.carbs, record.fat, record.quantity, record.notes]
    );
    return result.lastInsertRowId;
  },
  
  // 获取所有饮食记录
  async getAll() {
    const database = getDatabase();
    return await database.getAllAsync('SELECT * FROM diet_records ORDER BY created_at DESC');
  },
  
  // 获取今日饮食记录
  async getToday() {
    const database = getDatabase();
    return await database.getAllAsync(
      'SELECT * FROM diet_records WHERE DATE(created_at) = DATE("now", "localtime") ORDER BY created_at DESC'
    );
  },
  
  // 删除记录
  async delete(id) {
    const database = getDatabase();
    return await database.runAsync('DELETE FROM diet_records WHERE id = ?', [id]);
  },
  
  // 更新记录
  async update(id, record) {
    const database = getDatabase();
    return await database.runAsync(
      'UPDATE diet_records SET food_name = ?, calories = ?, protein = ?, carbs = ?, fat = ?, quantity = ?, notes = ? WHERE id = ?',
      [record.food_name, record.calories, record.protein, record.carbs, record.fat, record.quantity, record.notes, id]
    );
  }
};

// 运动记录相关操作
export const exerciseOperations = {
  // 添加运动记录
  async add(record) {
    const database = getDatabase();
    const result = await database.runAsync(
      'INSERT INTO exercise_records (exercise_name, duration, calories_burned, intensity, notes) VALUES (?, ?, ?, ?, ?)',
      [record.exercise_name, record.duration, record.calories_burned, record.intensity, record.notes]
    );
    return result.lastInsertRowId;
  },
  
  // 获取所有运动记录
  async getAll() {
    const database = getDatabase();
    return await database.getAllAsync('SELECT * FROM exercise_records ORDER BY created_at DESC');
  },
  
  // 获取今日运动记录
  async getToday() {
    const database = getDatabase();
    return await database.getAllAsync(
      'SELECT * FROM exercise_records WHERE DATE(created_at) = DATE("now", "localtime") ORDER BY created_at DESC'
    );
  },
  
  // 删除记录
  async delete(id) {
    const database = getDatabase();
    return await database.runAsync('DELETE FROM exercise_records WHERE id = ?', [id]);
  },
  
  // 更新记录
  async update(id, record) {
    const database = getDatabase();
    return await database.runAsync(
      'UPDATE exercise_records SET exercise_name = ?, duration = ?, calories_burned = ?, intensity = ?, notes = ? WHERE id = ?',
      [record.exercise_name, record.duration, record.calories_burned, record.intensity, record.notes, id]
    );
  }
};

// 聊天记录相关操作
export const chatOperations = {
  // 添加聊天记录
  async add(message, response) {
    const database = getDatabase();
    const result = await database.runAsync(
      'INSERT INTO chat_records (message, response) VALUES (?, ?)',
      [message, response]
    );
    return result.lastInsertRowId;
  },
  
  // 获取所有聊天记录
  async getAll() {
    const database = getDatabase();
    return await database.getAllAsync('SELECT * FROM chat_records ORDER BY created_at DESC');
  },
  
  // 删除记录
  async delete(id) {
    const database = getDatabase();
    return await database.runAsync('DELETE FROM chat_records WHERE id = ?', [id]);
  }
};

// 建议记录相关操作
export const suggestionOperations = {
  // 添加建议记录
  async add(suggestion) {
    const database = getDatabase();
    const result = await database.runAsync(
      'INSERT INTO suggestions (suggestion_text) VALUES (?)',
      [suggestion]
    );
    return result.lastInsertRowId;
  },
  
  // 获取所有建议记录
  async getAll() {
    const database = getDatabase();
    return await database.getAllAsync('SELECT * FROM suggestions ORDER BY created_at DESC');
  },
  
  // 删除记录
  async delete(id) {
    const database = getDatabase();
    return await database.runAsync('DELETE FROM suggestions WHERE id = ?', [id]);
  }
};

// 快捷键相关操作
export const shortcutOperations = {
  // 添加快捷键
  async add(type, name, data, position) {
    const database = getDatabase();
    const result = await database.runAsync(
      'INSERT INTO shortcuts (type, name, data, position) VALUES (?, ?, ?, ?)',
      [type, name, JSON.stringify(data), position]
    );
    return result.lastInsertRowId;
  },
  
  // 获取快捷键
  async getByType(type) {
    const database = getDatabase();
    const shortcuts = await database.getAllAsync(
      'SELECT * FROM shortcuts WHERE type = ? ORDER BY position',
      [type]
    );
    return shortcuts.map(shortcut => ({
      ...shortcut,
      data: JSON.parse(shortcut.data)
    }));
  },
  
  // 删除快捷键
  async delete(id) {
    const database = getDatabase();
    return await database.runAsync('DELETE FROM shortcuts WHERE id = ?', [id]);
  },
  
  // 更新快捷键
  async update(id, name, data) {
    const database = getDatabase();
    return await database.runAsync(
      'UPDATE shortcuts SET name = ?, data = ? WHERE id = ?',
      [name, JSON.stringify(data), id]
    );
  }
};