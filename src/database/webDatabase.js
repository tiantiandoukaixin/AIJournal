// Web环境数据库适配层
// 使用localStorage模拟SQLite数据库功能

const WEB_DB_PREFIX = 'diet_coach_';

// 模拟数据库表结构
const TABLES = {
  diet_records: 'diet_records',
  exercise_records: 'exercise_records',
  chat_records: 'chat_records',
  suggestions: 'suggestions',
  shortcuts: 'shortcuts'
};

// 获取表数据
const getTableData = (tableName) => {
  const key = WEB_DB_PREFIX + tableName;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// 保存表数据
const saveTableData = (tableName, data) => {
  const key = WEB_DB_PREFIX + tableName;
  localStorage.setItem(key, JSON.stringify(data));
};

// 生成ID
const generateId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9);
};

// 初始化Web数据库
export const initWebDatabase = async () => {
  console.log('🌐 初始化Web数据库...');
  
  // 确保所有表都存在
  Object.values(TABLES).forEach(tableName => {
    if (!localStorage.getItem(WEB_DB_PREFIX + tableName)) {
      saveTableData(tableName, []);
    }
  });
  
  // 初始化快捷方式数据
  const shortcuts = getTableData(TABLES.shortcuts);
  if (shortcuts.length === 0) {
    const defaultShortcuts = [
      { id: generateId(), name: '苹果', type: 'food', calories: 52, created_at: new Date().toISOString() },
      { id: generateId(), name: '香蕉', type: 'food', calories: 89, created_at: new Date().toISOString() },
      { id: generateId(), name: '鸡蛋', type: 'food', calories: 155, created_at: new Date().toISOString() },
      { id: generateId(), name: '牛奶', type: 'food', calories: 42, created_at: new Date().toISOString() },
      { id: generateId(), name: '面包', type: 'food', calories: 265, created_at: new Date().toISOString() },
      { id: generateId(), name: '米饭', type: 'food', calories: 130, created_at: new Date().toISOString() },
      { id: generateId(), name: '鸡胸肉', type: 'food', calories: 165, created_at: new Date().toISOString() },
      { id: generateId(), name: '酸奶', type: 'food', calories: 59, created_at: new Date().toISOString() },
      { id: generateId(), name: '跑步', type: 'exercise', calories: 300, created_at: new Date().toISOString() },
      { id: generateId(), name: '游泳', type: 'exercise', calories: 400, created_at: new Date().toISOString() },
      { id: generateId(), name: '骑车', type: 'exercise', calories: 250, created_at: new Date().toISOString() },
      { id: generateId(), name: '瑜伽', type: 'exercise', calories: 150, created_at: new Date().toISOString() }
    ];
    saveTableData(TABLES.shortcuts, defaultShortcuts);
  }
  
  console.log('✅ Web数据库初始化完成');
};

// 模拟数据库操作
export const webDietOperations = {
  add: async (record) => {
    const records = getTableData(TABLES.diet_records);
    const newRecord = {
      id: generateId(),
      ...record,
      created_at: new Date().toISOString()
    };
    records.push(newRecord);
    saveTableData(TABLES.diet_records, records);
    return newRecord.id;
  },
  
  getAll: async () => {
    return getTableData(TABLES.diet_records);
  },
  
  getToday: async () => {
    const records = getTableData(TABLES.diet_records);
    const today = new Date().toISOString().split('T')[0];
    return records.filter(record => 
      record.created_at && record.created_at.startsWith(today)
    );
  },
  
  delete: async (id) => {
    const records = getTableData(TABLES.diet_records);
    const filteredRecords = records.filter(record => record.id !== id);
    saveTableData(TABLES.diet_records, filteredRecords);
  },
  
  update: async (id, updates) => {
    const records = getTableData(TABLES.diet_records);
    const index = records.findIndex(record => record.id === id);
    if (index !== -1) {
      records[index] = { ...records[index], ...updates };
      saveTableData(TABLES.diet_records, records);
    }
  }
};

export const webExerciseOperations = {
  add: async (record) => {
    const records = getTableData(TABLES.exercise_records);
    const newRecord = {
      id: generateId(),
      ...record,
      created_at: new Date().toISOString()
    };
    records.push(newRecord);
    saveTableData(TABLES.exercise_records, records);
    return newRecord.id;
  },
  
  getAll: async () => {
    return getTableData(TABLES.exercise_records);
  },
  
  getToday: async () => {
    const records = getTableData(TABLES.exercise_records);
    const today = new Date().toISOString().split('T')[0];
    return records.filter(record => 
      record.created_at && record.created_at.startsWith(today)
    );
  },
  
  delete: async (id) => {
    const records = getTableData(TABLES.exercise_records);
    const filteredRecords = records.filter(record => record.id !== id);
    saveTableData(TABLES.exercise_records, filteredRecords);
  },
  
  update: async (id, updates) => {
    const records = getTableData(TABLES.exercise_records);
    const index = records.findIndex(record => record.id === id);
    if (index !== -1) {
      records[index] = { ...records[index], ...updates };
      saveTableData(TABLES.exercise_records, records);
    }
  }
};

export const webChatOperations = {
  add: async (record) => {
    const records = getTableData(TABLES.chat_records);
    const newRecord = {
      id: generateId(),
      ...record,
      created_at: new Date().toISOString()
    };
    records.push(newRecord);
    saveTableData(TABLES.chat_records, records);
    return newRecord.id;
  },
  
  getAll: async () => {
    return getTableData(TABLES.chat_records);
  },
  
  delete: async (id) => {
    const records = getTableData(TABLES.chat_records);
    const filteredRecords = records.filter(record => record.id !== id);
    saveTableData(TABLES.chat_records, filteredRecords);
  }
};

export const webSuggestionOperations = {
  add: async (record) => {
    const records = getTableData(TABLES.suggestions);
    const newRecord = {
      id: generateId(),
      ...record,
      created_at: new Date().toISOString()
    };
    records.push(newRecord);
    saveTableData(TABLES.suggestions, records);
    return newRecord.id;
  },
  
  getAll: async () => {
    return getTableData(TABLES.suggestions);
  },
  
  delete: async (id) => {
    const records = getTableData(TABLES.suggestions);
    const filteredRecords = records.filter(record => record.id !== id);
    saveTableData(TABLES.suggestions, filteredRecords);
  }
};

export const webShortcutOperations = {
  getAll: async () => {
    return getTableData(TABLES.shortcuts);
  }
};

// 清除所有数据
export const clearAllWebData = async () => {
  Object.values(TABLES).forEach(tableName => {
    localStorage.removeItem(WEB_DB_PREFIX + tableName);
  });
  await initWebDatabase();
};