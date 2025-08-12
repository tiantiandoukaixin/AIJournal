import { Platform } from 'react-native';

// 动态导入SQLite，避免web环境的兼容性问题
let SQLite = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

class DatabaseService {
  constructor() {
    this.db = null;
    this.isWeb = Platform.OS === 'web';
  }

  async init() {
    try {
      if (this.isWeb) {
        // Web环境使用localStorage作为替代
        console.log('Web环境：使用localStorage存储');
        return true;
      }
      
      this.db = await SQLite.openDatabaseAsync('aijournal.db');
      await this.createTables();
      console.log('数据库初始化成功');
      return true;
    } catch (error) {
      console.error('数据库初始化失败:', error);
      return false;
    }
  }

  async createTables() {
    if (this.isWeb) return;
    
    const tables = [
      // 个人基础信息表 - 统一结构
      `CREATE TABLE IF NOT EXISTS personal_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        name TEXT,
        age INTEGER,
        gender TEXT,
        occupation TEXT,
        health_status TEXT,
        chronic_diseases TEXT,
        medical_history TEXT,
        family_medical_history TEXT,
        height REAL,
        weight REAL,
        bmi REAL,
        blood_pressure TEXT,
        heart_rate INTEGER,
        blood_sugar TEXT,
        blood_type TEXT,
        vision TEXT,
        hearing TEXT,
        allergies TEXT,
        medications TEXT,
        supplements TEXT,
        exercise_habits TEXT,
        sleep_pattern TEXT,
        smoking_status TEXT,
        drinking_habits TEXT,
        diet_restrictions TEXT,
        mental_health TEXT,
        stress_level TEXT,
        education TEXT,
        relationship_status TEXT,
        family_info TEXT,
        contact_info TEXT,
        emergency_contact TEXT,
        insurance_info TEXT,
        doctor_info TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // 喜好表 - 统一结构
      `CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        category TEXT,
        item TEXT,
        preference_type TEXT CHECK(preference_type IN ('like', 'dislike')),
        intensity INTEGER DEFAULT 5,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // 里程碑表 - 统一结构
      `CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        title TEXT,
        description TEXT,
        category TEXT,
        status TEXT CHECK(status IN ('planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',
        target_date DATE,
        completed_date DATE,
        priority INTEGER DEFAULT 3,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // 心情表 - 统一结构
      `CREATE TABLE IF NOT EXISTS moods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        mood_score INTEGER CHECK(mood_score >= 1 AND mood_score <= 10),
        mood_type TEXT,
        description TEXT,
        triggers TEXT,
        weather TEXT,
        location TEXT,
        date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // 想法表 - 统一结构
      `CREATE TABLE IF NOT EXISTS thoughts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        title TEXT,
        category TEXT,
        tags TEXT,
        inspiration_source TEXT,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // 饮食记录表 - 统一结构
      `CREATE TABLE IF NOT EXISTS food_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        food_name TEXT,
        quantity TEXT,
        meal_time TEXT,
        calories INTEGER,
        taste_rating INTEGER DEFAULT 5,
        location TEXT,
        mood TEXT,
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

    for (const tableSQL of tables) {
      await this.db.execAsync(tableSQL);
    }
  }

  // Web环境的localStorage操作
  getWebData(tableName) {
    try {
      if (this.isWeb) {
        const data = localStorage.getItem(`aijournal_${tableName}`);
        return data ? JSON.parse(data) : [];
      } else {
        // React Native环境使用AsyncStorage的同步替代方案
        // 注意：这里应该使用AsyncStorage，但为了兼容性暂时使用全局变量
        if (!global.aijournal_storage) {
          global.aijournal_storage = {};
        }
        return global.aijournal_storage[tableName] || [];
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      return [];
    }
  }

  setWebData(tableName, data) {
    try {
      if (this.isWeb) {
        localStorage.setItem(`aijournal_${tableName}`, JSON.stringify(data));
        // 触发自定义事件通知界面刷新
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('localStorageUpdate', { 
            detail: { tableName, dataLength: data.length } 
          }));
        }
      } else {
        // React Native环境使用AsyncStorage的同步替代方案
        if (!global.aijournal_storage) {
          global.aijournal_storage = {};
        }
        global.aijournal_storage[tableName] = data; // 修复：直接存储数据，不需要JSON.stringify
        // 触发自定义事件通知界面刷新
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('localStorageUpdate', { 
            detail: { tableName, dataLength: data.length } 
          }));
        }
      }
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // 清理重复数据和修复显示问题
  async cleanupDuplicateData() {
    console.log('🧹 开始清理重复数据...');
    
    const tables = ['personal_info', 'preferences', 'milestones', 'moods', 'thoughts', 'food_records', 'chat_history'];
    
    for (const tableName of tables) {
      try {
        const allData = await this.getAllData(tableName);
        if (!allData || allData.length === 0) continue;
        
        console.log(`📊 ${tableName} 表有 ${allData.length} 条记录`);
        
        // 按内容去重，保留最新的记录
        const uniqueData = new Map();
        
        allData.forEach(item => {
          try {
            let contentKey;
            if (typeof item.content === 'string') {
              const parsed = JSON.parse(item.content);
              // 根据不同类型生成唯一键
              if (tableName === 'personal_info' && parsed.name) {
                contentKey = `name_${parsed.name}`;
              } else if (tableName === 'preferences' && parsed.item) {
                // 对于偏好记录，只按项目去重，不考虑偏好类型，避免矛盾
                contentKey = `${parsed.category}_${parsed.item}`;
              } else if (tableName === 'milestones' && parsed.title) {
                contentKey = `title_${parsed.title}`;
              } else if (tableName === 'moods') {
                contentKey = `mood_${parsed.mood_type}_${parsed.date || new Date(item.created_at).toDateString()}`;
              } else if (tableName === 'thoughts' && parsed.content) {
                contentKey = `content_${parsed.content.substring(0, 50)}`;
              } else if (tableName === 'food_records') {
                contentKey = `food_${parsed.food_name}_${parsed.date || new Date(item.created_at).toDateString()}`;
              } else if (tableName === 'chat_history') {
                contentKey = `chat_${parsed.user_message ? parsed.user_message.substring(0, 30) : item.user_message ? item.user_message.substring(0, 30) : ''}_${item.session_id || 'default'}`;
              } else {
                contentKey = JSON.stringify(parsed);
              }
            } else {
              contentKey = JSON.stringify(item.content);
            }
            
            // 保留最新的记录
            if (!uniqueData.has(contentKey) || 
                new Date(item.created_at) > new Date(uniqueData.get(contentKey).created_at)) {
              uniqueData.set(contentKey, item);
            }
          } catch (error) {
            console.log(`解析 ${tableName} 数据失败:`, error, item);
            // 对于无法解析的数据，使用原始内容作为键
            const contentKey = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
            if (!uniqueData.has(contentKey)) {
              uniqueData.set(contentKey, item);
            }
          }
        });
        
        const uniqueCount = uniqueData.size;
        const duplicateCount = allData.length - uniqueCount;
        
        if (duplicateCount > 0) {
          console.log(`🔄 ${tableName} 表发现 ${duplicateCount} 条重复记录，清理后保留 ${uniqueCount} 条`);
          
          // 清空表并重新插入去重后的数据
          await this.clearTable(tableName);
          
          for (const item of uniqueData.values()) {
            await this.insertData(tableName, item.content);
          }
        } else {
          console.log(`✅ ${tableName} 表无重复数据`);
        }
      } catch (error) {
        console.error(`清理 ${tableName} 表失败:`, error);
      }
    }
    
    console.log('🎉 数据清理完成');
    
    // 清理矛盾的偏好记录
    await this.cleanupConflictingPreferences();
  }
  
  // 清理矛盾的偏好记录
  async cleanupConflictingPreferences() {
    try {
      console.log('🔍 开始清理矛盾的偏好记录...');
      const preferences = await this.getAllData('preferences');
      
      if (!preferences || preferences.length === 0) {
        console.log('✅ 无偏好记录需要清理');
        return;
      }
      
      // 按项目分组
      const itemGroups = new Map();
      
      preferences.forEach(item => {
        try {
          const parsed = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
          const key = `${parsed.category}_${parsed.item}`;
          
          if (!itemGroups.has(key)) {
            itemGroups.set(key, []);
          }
          itemGroups.get(key).push({
            ...item,
            parsed
          });
        } catch (error) {
          console.log('解析偏好记录失败:', error, item);
        }
      });
      
      let conflictCount = 0;
      const cleanedPreferences = [];
      
      // 处理每个项目组
      itemGroups.forEach((items, key) => {
        if (items.length > 1) {
          // 检查是否有矛盾的偏好类型
          const hasLike = items.some(item => item.parsed.preference_type === 'like');
          const hasDis = items.some(item => item.parsed.preference_type === 'dislike');
          
          if (hasLike && hasDis) {
            conflictCount++;
            console.log(`🔄 发现矛盾偏好: ${key}`);
            
            // 保留最新的记录
            const latest = items.reduce((prev, current) => {
              return new Date(current.created_at) > new Date(prev.created_at) ? current : prev;
            });
            
            console.log(`   保留最新记录: ${latest.parsed.preference_type} (${latest.created_at})`);
            cleanedPreferences.push(latest);
          } else {
            // 没有矛盾，保留最新的记录
            const latest = items.reduce((prev, current) => {
              return new Date(current.created_at) > new Date(prev.created_at) ? current : prev;
            });
            cleanedPreferences.push(latest);
          }
        } else {
          // 只有一条记录，直接保留
          cleanedPreferences.push(items[0]);
        }
      });
      
      if (conflictCount > 0) {
        console.log(`🧹 清理了 ${conflictCount} 个矛盾偏好，保留 ${cleanedPreferences.length} 条记录`);
        
        // 重新写入清理后的数据
        await this.clearTable('preferences');
        for (const item of cleanedPreferences) {
          await this.insertData('preferences', item.parsed);
        }
      } else {
        console.log('✅ 未发现矛盾的偏好记录');
      }
    } catch (error) {
      console.error('清理矛盾偏好记录失败:', error);
    }
  }

  // 插入数据
  async insertData(tableName, content) {
    try {
      if (this.isWeb) {
        const data = this.getWebData(tableName);
        const newRecord = {
          id: this.generateId(),
          content: typeof content === 'string' ? content : JSON.stringify(content),
          created_at: new Date().toISOString(),
          ...this.extractFieldsFromContent(tableName, content)
        };
        data.push(newRecord);
        this.setWebData(tableName, data);
        return newRecord.id;
      }

      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const fields = this.extractFieldsFromContent(tableName, content);
      
      // 构建插入语句
      const columns = ['content', ...Object.keys(fields)];
      const placeholders = columns.map(() => '?').join(', ');
      const values = [contentStr, ...Object.values(fields)];
      
      const result = await this.db.runAsync(
        `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error(`插入${tableName}数据失败:`, error);
      throw error;
    }
  }

  // 从content中提取对应的字段
  extractFieldsFromContent(tableName, content) {
    const data = typeof content === 'string' ? JSON.parse(content) : content;
    const fields = {};
    
    switch (tableName) {
      case 'personal_info':
        if (data.name) fields.name = data.name;
        if (data.age) fields.age = parseInt(data.age) || null;
        if (data.gender) fields.gender = data.gender;
        if (data.occupation) fields.occupation = data.occupation;
        if (data.health_status) fields.health_status = data.health_status;
        if (data.chronic_diseases) fields.chronic_diseases = data.chronic_diseases;
        if (data.medical_history) fields.medical_history = data.medical_history;
        if (data.family_medical_history) fields.family_medical_history = data.family_medical_history;
        if (data.height) fields.height = parseFloat(data.height) || null;
        if (data.weight) fields.weight = parseFloat(data.weight) || null;
        if (data.bmi) fields.bmi = parseFloat(data.bmi) || null;
        if (data.blood_pressure) fields.blood_pressure = data.blood_pressure;
        if (data.heart_rate) fields.heart_rate = parseInt(data.heart_rate) || null;
        if (data.blood_sugar) fields.blood_sugar = data.blood_sugar;
        if (data.blood_type) fields.blood_type = data.blood_type;
        if (data.vision) fields.vision = data.vision;
        if (data.hearing) fields.hearing = data.hearing;
        if (data.allergies) fields.allergies = data.allergies;
        if (data.medications) fields.medications = data.medications;
        if (data.supplements) fields.supplements = data.supplements;
        if (data.exercise_habits) fields.exercise_habits = data.exercise_habits;
        if (data.sleep_pattern) fields.sleep_pattern = data.sleep_pattern;
        if (data.smoking_status) fields.smoking_status = data.smoking_status;
        if (data.drinking_habits) fields.drinking_habits = data.drinking_habits;
        if (data.diet_restrictions) fields.diet_restrictions = data.diet_restrictions;
        if (data.mental_health) fields.mental_health = data.mental_health;
        if (data.stress_level) fields.stress_level = data.stress_level;
        if (data.education) fields.education = data.education;
        if (data.relationship_status) fields.relationship_status = data.relationship_status;
        if (data.family_info) fields.family_info = data.family_info;
        if (data.contact_info) fields.contact_info = data.contact_info;
        if (data.emergency_contact) fields.emergency_contact = data.emergency_contact;
        if (data.insurance_info) fields.insurance_info = data.insurance_info;
        if (data.doctor_info) fields.doctor_info = data.doctor_info;
        fields.updated_at = new Date().toISOString();
        break;
        
      case 'preferences':
        if (data.category) fields.category = data.category;
        if (data.item) fields.item = data.item;
        if (data.preference_type) fields.preference_type = data.preference_type;
        if (data.intensity) fields.intensity = parseInt(data.intensity) || 5;
        if (data.notes) fields.notes = data.notes;
        fields.updated_at = new Date().toISOString();
        break;
        
      case 'milestones':
        if (data.title) fields.title = data.title;
        if (data.description) fields.description = data.description;
        if (data.category) fields.category = data.category;
        if (data.status) fields.status = data.status;
        if (data.target_date) fields.target_date = data.target_date;
        if (data.completed_date) fields.completed_date = data.completed_date;
        if (data.priority) fields.priority = parseInt(data.priority) || 3;
        fields.updated_at = new Date().toISOString();
        break;
        
      case 'moods':
        if (data.mood_score) fields.mood_score = parseInt(data.mood_score) || null;
        if (data.mood_type) fields.mood_type = data.mood_type;
        if (data.description) fields.description = data.description;
        if (data.triggers) fields.triggers = data.triggers;
        if (data.weather) fields.weather = data.weather;
        if (data.location) fields.location = data.location;
        if (data.date) fields.date = data.date;
        fields.updated_at = new Date().toISOString();
        break;
        
      case 'thoughts':
        if (data.title) fields.title = data.title;
        if (data.category) fields.category = data.category;
        if (data.tags) fields.tags = data.tags;
        if (data.inspiration_source) fields.inspiration_source = data.inspiration_source;
        if (data.is_favorite !== undefined) fields.is_favorite = data.is_favorite ? 1 : 0;
        fields.updated_at = new Date().toISOString();
        break;
        
      case 'food_records':
        if (data.food_name) fields.food_name = data.food_name;
        if (data.quantity) fields.quantity = data.quantity;
        if (data.meal_time) fields.meal_time = data.meal_time;
        if (data.calories) fields.calories = parseInt(data.calories) || null;
        if (data.taste_rating) fields.taste_rating = parseInt(data.taste_rating) || 5;
        if (data.location) fields.location = data.location;
        if (data.mood) fields.mood = data.mood;
        fields.updated_at = new Date().toISOString();
        break;
        
      case 'chat_history':
        if (data.user_message) fields.user_message = data.user_message;
        if (data.ai_response) fields.ai_response = data.ai_response;
        if (data.session_id) fields.session_id = data.session_id;
        break;
    }
    
    return fields;
  }

  // 查询所有数据
  async getAllData(tableName) {
    try {
      if (this.isWeb) {
        return this.getWebData(tableName);
      }

      if (!this.db) {
        console.warn('数据库未初始化，返回空数组');
        return [];
      }

      const result = await this.db.getAllAsync(
        `SELECT * FROM ${tableName} ORDER BY created_at DESC`
      );
      return result || [];
    } catch (error) {
      console.error(`查询${tableName}数据失败:`, error);
      return [];
    }
  }

  // 查询最近的数据
  async getRecentData(tableName, limit = 5) {
    try {
      if (this.isWeb) {
        const data = this.getWebData(tableName);
        return data.slice(-limit).reverse();
      }

      const result = await this.db.getAllAsync(
        `SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT ?`,
        [limit]
      );
      return result;
    } catch (error) {
      console.error(`查询${tableName}最近数据失败:`, error);
      return [];
    }
  }

  // 删除数据
  async deleteData(tableName, id) {
    try {
      if (this.isWeb) {
        const data = this.getWebData(tableName);
        console.log(`[DEBUG] 删除前数据量: ${data.length}`);
        console.log(`[DEBUG] 要删除的ID: ${id} (类型: ${typeof id})`);
        console.log(`[DEBUG] 数据中的ID列表:`, data.map(item => `${item.id} (${typeof item.id})`));
        
        const filteredData = data.filter(item => {
          const itemIdStr = String(item.id);
          const targetIdStr = String(id);
          const shouldKeep = itemIdStr !== targetIdStr;
          console.log(`[DEBUG] 比较: ${itemIdStr} !== ${targetIdStr} = ${shouldKeep}`);
          return shouldKeep;
        });
        
        console.log(`[DEBUG] 删除后数据量: ${filteredData.length}`);
        this.setWebData(tableName, filteredData);
        return { success: true, deletedCount: data.length - filteredData.length };
      }

      const result = await this.db.runAsync(
        `DELETE FROM ${tableName} WHERE id = ?`,
        [id]
      );
      return { success: true, deletedCount: result.changes };
    } catch (error) {
      console.error(`删除${tableName}数据失败:`, error);
      return { success: false, error: error.message };
    }
  }

  // 更新数据
  async updateData(tableName, id, content) {
    try {
      if (this.isWeb) {
        const data = this.getWebData(tableName);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
          data[index] = {
            ...data[index],
            content: typeof content === 'string' ? content : JSON.stringify(content),
            updated_at: new Date().toISOString()
          };
          this.setWebData(tableName, data);
          return true;
        }
        return false;
      }

      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      await this.db.runAsync(
        `UPDATE ${tableName} SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [contentStr, id]
      );
      return true;
    } catch (error) {
      console.error(`更新${tableName}数据失败:`, error);
      return false;
    }
  }

  // 删除记录 (兼容性方法)
  async deleteRecord(tableName, id) {
    try {
      console.log(`[DEBUG] 删除记录开始: 表=${tableName}, ID=${id}, ID类型=${typeof id}`);
      const result = await this.deleteData(tableName, id);
      console.log(`[DEBUG] 删除结果:`, result);
      return result;
    } catch (error) {
      console.error('[ERROR] 删除记录失败:', error);
      throw error;
    }
  }

  // 移动数据到另一个表
  async moveData(fromTable, toTable, id, transformedContent = null) {
    try {
      // 获取原始数据
      const originalData = await this.getAllData(fromTable);
      const itemToMove = originalData.find(item => item.id === id);
      
      if (!itemToMove) {
        throw new Error('未找到要移动的数据');
      }

      // 使用转换后的内容或原始内容
      const contentToInsert = transformedContent || itemToMove.content;
      
      // 插入到目标表
      const newId = await this.insertData(toTable, contentToInsert);
      
      // 删除原始数据
      await this.deleteData(fromTable, id);
      
      return newId;
    } catch (error) {
      console.error(`移动数据从${fromTable}到${toTable}失败:`, error);
      throw error;
    }
  }

  // 清空表数据
  async clearTable(tableName) {
    try {
      if (this.isWeb) {
        this.setWebData(tableName, []);
        return true;
      }

      await this.db.runAsync(`DELETE FROM ${tableName}`);
      return true;
    } catch (error) {
      console.error(`清空${tableName}表失败:`, error);
      return false;
    }
  }

  // 清空所有数据
  async clearAllData() {
    const tables = ['personal_info', 'preferences', 'milestones', 'moods', 'thoughts', 'chat_history'];
    try {
      for (const table of tables) {
        await this.clearTable(table);
      }
      return true;
    } catch (error) {
      console.error('清空所有数据失败:', error);
      return false;
    }
  }

  // 获取数据统计
  async getDataStats() {
    const tables = ['personal_info', 'preferences', 'milestones', 'moods', 'thoughts', 'chat_history'];
    const stats = {};
    
    for (const table of tables) {
      try {
        if (this.isWeb) {
          const data = this.getWebData(table);
          stats[table] = data.length;
        } else {
          const result = await this.db.getFirstAsync(
            `SELECT COUNT(*) as count FROM ${table}`
          );
          stats[table] = result.count;
        }
      } catch (error) {
        console.error(`获取${table}统计失败:`, error);
        stats[table] = 0;
      }
    }
    
    return stats;
  }

  // 插入聊天记录
  async insertChatHistory(userMessage, aiResponse, sessionId = null) {
    try {
      console.log('💬 开始保存聊天记录:', { userMessage: userMessage.substring(0, 50), aiResponse: aiResponse.substring(0, 50), sessionId });
      
      if (this.isWeb) {
        const data = this.getWebData('chat_history');
        const newRecord = {
          id: this.generateId(),
          user_message: userMessage,
          ai_response: aiResponse,
          session_id: sessionId || Date.now().toString(),
          created_at: new Date().toISOString()
        };
        data.push(newRecord);
        this.setWebData('chat_history', data);
        console.log('✅ Web环境聊天记录保存成功, 当前总数:', data.length);
        return newRecord.id;
      }

      const result = await this.db.runAsync(
        'INSERT INTO chat_history (user_message, ai_response, session_id) VALUES (?, ?, ?)',
        [userMessage, aiResponse, sessionId || Date.now().toString()]
      );
      console.log('✅ SQLite聊天记录保存成功, ID:', result.lastInsertRowId);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('❌ 插入聊天记录失败:', error);
      throw error;
    }
  }

  // 插入偏好数据 (兼容性方法)
  async insertPreference(content) {
    // 检查是否已存在相同项目的偏好记录（不论喜欢还是不喜欢）
    const existing = await this.getAllData('preferences');
    const sameItem = existing.find(item => {
      const itemData = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
      return itemData.category === content.category && 
             itemData.item === content.item;
    });
    
    if (sameItem) {
      const itemData = typeof sameItem.content === 'string' ? JSON.parse(sameItem.content) : sameItem.content;
      
      // 如果偏好类型相同，更新记录
      if (itemData.preference_type === content.preference_type) {
        console.log('🔄 发现相同偏好记录，更新时间和强度:', content);
        sameItem.content = JSON.stringify(content);
        sameItem.created_at = new Date().toISOString();
        if (this.isWeb) {
          const allData = await this.getAllData('preferences');
          const updatedData = allData.map(item => 
            item.id === sameItem.id ? sameItem : item
          );
          this.setWebData('preferences', updatedData);
        }
        return sameItem;
      } else {
        // 如果偏好类型不同，替换为新的偏好
        console.log(`🔄 发现矛盾偏好记录，将"${itemData.preference_type}"替换为"${content.preference_type}":`, content);
        sameItem.content = JSON.stringify(content);
        sameItem.created_at = new Date().toISOString();
        if (this.isWeb) {
          const allData = await this.getAllData('preferences');
          const updatedData = allData.map(item => 
            item.id === sameItem.id ? sameItem : item
          );
          this.setWebData('preferences', updatedData);
        }
        return sameItem;
      }
    }
    
    return await this.insertData('preferences', content);
  }

  // 插入个人信息 (兼容性方法)
  async insertPersonalInfo(content) {
    // 个人信息应该更新而不是重复插入
    const existing = await this.getAllData('personal_info');
    if (existing.length > 0) {
      console.log('🔄 更新个人信息:', content);
      const latest = existing[0];
      const updatedContent = {
        ...latest.content,
        ...content,
        updated_at: new Date().toISOString()
      };
      
      if (this.isWeb) {
        const allData = await this.getAllData('personal_info');
        const updatedData = allData.map(item => 
          item.id === latest.id ? { ...item, content: updatedContent, created_at: new Date().toISOString() } : item
        );
        this.setWebData('personal_info', updatedData);
      }
      return latest;
    }
    
    return await this.insertData('personal_info', content);
  }

  // 插入里程碑 (兼容性方法)
  async insertMilestone(content) {
    // 检查是否已存在相同标题的里程碑
    const existing = await this.getAllData('milestones');
    const duplicate = existing.find(item => {
      const itemData = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
      return itemData.title === content.title;
    });
    
    if (duplicate) {
      console.log('🔄 发现重复里程碑记录，更新时间:', content);
      duplicate.created_at = new Date().toISOString();
      if (this.isWeb) {
        const allData = await this.getAllData('milestones');
        const updatedData = allData.map(item => 
          item.id === duplicate.id ? duplicate : item
        );
        this.setWebData('milestones', updatedData);
      }
      return duplicate;
    }
    
    return await this.insertData('milestones', content);
  }

  // 插入心情 (兼容性方法)
  async insertMood(content) {
    // 检查今天是否已有心情记录
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getAllData('moods');
    const todayMood = existing.find(item => {
      const itemData = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
      return itemData.date === today || itemData.date === content.date;
    });
    
    if (todayMood) {
      console.log('🔄 发现今日心情记录，更新内容:', content);
      const updatedContent = {
        ...todayMood.content,
        ...content,
        updated_at: new Date().toISOString()
      };
      todayMood.content = updatedContent;
      todayMood.created_at = new Date().toISOString();
      
      if (this.isWeb) {
        const allData = await this.getAllData('moods');
        const updatedData = allData.map(item => 
          item.id === todayMood.id ? todayMood : item
        );
        this.setWebData('moods', updatedData);
      }
      return todayMood;
    }
    
    return await this.insertData('moods', content);
  }

  // 插入想法 (兼容性方法)
  async insertThought(content) {
    // 检查是否已存在相同内容的想法
    const existing = await this.getAllData('thoughts');
    const duplicate = existing.find(item => {
      const itemData = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
      return itemData.content === content.content || itemData.title === content.title;
    });
    
    if (duplicate) {
      console.log('🔄 发现重复想法记录，更新时间:', content);
      duplicate.created_at = new Date().toISOString();
      if (this.isWeb) {
        const allData = await this.getAllData('thoughts');
        const updatedData = allData.map(item => 
          item.id === duplicate.id ? duplicate : item
        );
        this.setWebData('thoughts', updatedData);
      }
      return duplicate;
    }
    
    return await this.insertData('thoughts', content);
  }

  // 插入饮食记录 (兼容性方法)
  async insertFoodRecord(content) {
    return await this.insertData('food_records', content);
  }

  // 获取表数据 (兼容性方法)
  async getTableData(tableName) {
    return await this.getAllData(tableName);
  }

  // 获取所有表的完整数据
  async getAllTablesData() {
    const tables = ['personal_info', 'preferences', 'milestones', 'moods', 'thoughts', 'food_records', 'chat_history'];
    const result = {};
    
    for (const tableName of tables) {
      try {
        const data = await this.getAllData(tableName);
        result[tableName] = data || [];
      } catch (error) {
        console.error(`获取${tableName}数据失败:`, error);
        result[tableName] = [];
      }
    }
    
    return result;
  }

  // 获取所有表的最近数据
  async getRecentData(days = 7) {
    const tables = ['personal_info', 'preferences', 'milestones', 'moods', 'thoughts', 'food_records', 'chat_history'];
    const result = {};
    
    for (const tableName of tables) {
      try {
        const data = await this.getAllData(tableName);
        // 过滤最近几天的数据
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        result[tableName] = data.filter(item => {
          const itemDate = new Date(item.created_at);
          return itemDate >= cutoffDate;
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } catch (error) {
        console.error(`获取${tableName}数据失败:`, error);
        result[tableName] = [];
      }
    }
    
    return result;
  }
}

export default new DatabaseService();
export { DatabaseService };