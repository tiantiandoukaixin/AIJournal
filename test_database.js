// 简化的数据库测试脚本
console.log('🧪 开始测试localStorage数据库功能...');

// 模拟Web环境的localStorage
const storage = {};
const mockLocalStorage = {
  getItem: function(key) {
    return storage[key] || null;
  },
  setItem: function(key, value) {
    storage[key] = value;
  },
  removeItem: function(key) {
    delete storage[key];
  }
};

// 模拟DatabaseService的核心功能
class TestDatabaseService {
  constructor() {
    this.isWeb = true;
  }

  getWebData(tableName) {
    try {
      const data = mockLocalStorage.getItem(`aijournal_${tableName}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取数据失败:', error);
      return [];
    }
  }

  setWebData(tableName, data) {
    try {
      mockLocalStorage.setItem(`aijournal_${tableName}`, JSON.stringify(data));
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  async insertChatHistory(userMessage, aiResponse, sessionId = null) {
    try {
      console.log('💬 开始保存聊天记录:', { userMessage: userMessage.substring(0, 50), aiResponse: aiResponse.substring(0, 50), sessionId });
      
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
    } catch (error) {
      console.error('❌ 插入聊天记录失败:', error);
      throw error;
    }
  }

  async getTableData(tableName) {
    return this.getWebData(tableName);
  }
}

async function testDatabase() {
  const dbService = new TestDatabaseService();
  
  try {
    console.log('✅ 数据库服务初始化成功');
    
    // 测试插入聊天记录
    console.log('\n💬 测试插入聊天记录...');
    const chatId1 = await dbService.insertChatHistory(
      '你好，这是第一条测试消息',
      '你好！我是AI助手，很高兴为您服务。',
      'test_session_123'
    );
    console.log('✅ 第一条聊天记录插入成功，ID:', chatId1);
    
    const chatId2 = await dbService.insertChatHistory(
      '这是第二条测试消息',
      '收到您的消息，我会尽力帮助您。',
      'test_session_123'
    );
    console.log('✅ 第二条聊天记录插入成功，ID:', chatId2);
    
    // 获取聊天记录
    console.log('\n📊 获取聊天记录...');
    const chatData = await dbService.getTableData('chat_history');
    console.log('聊天记录数量:', chatData.length);
    console.log('聊天记录内容:', chatData);
    
    // 测试所有表的数据统计
    console.log('\n📈 测试所有表的数据统计...');
    const tables = ['personal_info', 'preferences', 'milestones', 'moods', 'thoughts', 'food_records', 'chat_history'];
    
    for (const tableName of tables) {
      const data = await dbService.getTableData(tableName);
      console.log(`${tableName}: ${data.length} 条记录`);
    }
    
    console.log('\n🎉 数据库测试完成！');
    
    // 验证localStorage中的数据
    console.log('\n🔍 验证localStorage中的数据:');
    console.log('存储的键:', Object.keys(storage));
    if (storage['aijournal_chat_history']) {
      const storedData = JSON.parse(storage['aijournal_chat_history']);
      console.log('chat_history表中的数据:', storedData.length, '条');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testDatabase();