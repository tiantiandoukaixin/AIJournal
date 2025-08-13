class DeepSeekService {
  constructor() {
    this.apiKey = 'sk-71549dbc6ed2417688929ad03c16aa02';
    this.baseUrl = 'https://api.deepseek.com/v1/chat/completions';
  }

  // 设置API密钥
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  // 测试API连接
  async testConnection() {
    try {
      const response = await this.makeRequest([
        { role: 'user', content: '你好，请回复"连接成功"' }
      ]);
      return { success: true, message: response };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // 基础API请求方法
  async makeRequest(messages, maxTokens = 1000) {
    console.log('🚀 开始API请求:', {
      url: this.baseUrl,
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : '未设置',
      messagesCount: messages.length,
      maxTokens
    });
    
    try {
      const requestBody = {
        model: 'deepseek-chat',
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.7
      };
      
      console.log('📤 请求体:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API响应错误:', errorText);
        throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API响应成功:', data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API响应格式错误: 缺少choices或message字段');
      }
      
      return data.choices[0].message.content;
    } catch (error) {
      console.error('💥 DeepSeek API 错误:', error);
      throw error;
    }
  }

  // 分析日记内容并分类存储
  async analyzeJournalEntry(content) {
    console.log('📝 开始分析日记内容:', content);
    
    const prompt = `你是一个专业的个人数据分析师，请仔细分析以下日记内容，智能地将信息分段并分类提取到对应的数据库表中。

**重要指导原则：**
1. **智能分段**：如果用户的一段话包含多个不同类型的信息，请自动分段处理
2. **多表写入**：一条内容可以同时写入多个表，不要遗漏任何有价值的信息
3. **深度挖掘**：从字里行间挖掘隐含的情感、偏好、目标等信息
4. **时间推理**：合理推断事件发生的时间（今天、昨天、最近等）
5. **情感分析**：准确识别情感状态和触发因素

请以JSON格式返回，包含以下字段：

{
  "personal_info": {
    "name": "姓名",
    "age": "年龄",
    "gender": "性别",
    "occupation": "职业/工作",
    "health_status": "整体健康状况",
    "chronic_diseases": "慢性疾病（如高血压、糖尿病、心脏病等）",
    "medical_history": "既往病史和手术史",
    "family_medical_history": "家族病史",
    "height": "身高（cm）",
    "weight": "体重（kg）",
    "bmi": "BMI指数",
    "blood_pressure": "血压（收缩压/舒张压）",
    "heart_rate": "心率（次/分钟）",
    "blood_sugar": "血糖水平",
    "blood_type": "血型",
    "vision": "视力状况",
    "hearing": "听力状况",
    "allergies": "过敏信息（食物、药物、环境等）",
    "medications": "当前用药信息",
    "supplements": "保健品和营养补充剂",
    "exercise_habits": "运动习惯和频率",
    "sleep_pattern": "睡眠模式和质量",
    "smoking_status": "吸烟状况",
    "drinking_habits": "饮酒习惯",
    "diet_restrictions": "饮食限制和偏好",
    "mental_health": "心理健康状况",
    "stress_level": "压力水平",
    "education": "教育背景",
    "relationship_status": "感情状态",
    "family_info": "家庭信息",
    "contact_info": "联系方式",
    "emergency_contact": "紧急联系人",
    "insurance_info": "医疗保险信息",
    "doctor_info": "主治医生信息"
  },
  "preferences": [
    {
      "category": "分类（食物/音乐/运动/娱乐/学习/工作/人际/生活方式等）",
      "item": "具体项目",
      "preference_type": "like/dislike/neutral",
      "intensity": 8,
      "notes": "详细备注和原因",
      "context": "提及的具体情境"
    }
  ],
  "milestones": [
    {
      "title": "里程碑标题",
      "description": "详细描述和背景",
      "category": "工作/学习/生活/健康/人际/财务/兴趣等",
      "status": "planned/in_progress/completed/cancelled/paused",
      "target_date": "2024-01-01",
      "priority": 4,
      "motivation": "动机和原因",
      "obstacles": "可能的障碍",
      "progress_notes": "进展备注"
    }
  ],
  "moods": [
    {
      "mood_score": 7,
      "mood_type": "开心/难过/焦虑/兴奋/平静/愤怒/困惑/满足等",
      "description": "心情的详细描述",
      "triggers": "具体的触发因素",
      "weather": "天气情况",
      "location": "地点",
      "date": "2024-01-01",
      "intensity": 6,
      "duration": "持续时间",
      "coping_strategies": "应对方式",
      "physical_symptoms": "身体反应"
    }
  ],
  "thoughts": [
    {
      "title": "想法的简短标题",
      "content": "完整的想法内容",
      "category": "创意/反思/计划/观察/学习/工作/人生感悟等",
      "tags": "相关标签，用逗号分隔",
      "inspiration_source": "灵感来源",
      "is_favorite": false,
      "actionable": "是否可执行",
      "related_goals": "相关目标",
      "emotional_tone": "情感色调"
    }
  ],
  "food_records": [
    {
      "food_name": "食物名称",
      "quantity": "数量（如200g、1个、1杯等）",
      "meal_type": "早餐/午餐/晚餐/加餐/零食",
      "calories": "估算卡路里（可选）",
      "nutrition_notes": "营养备注（蛋白质、维生素等）",
      "taste_rating": 8,
      "preparation_method": "制作方式（煮/炒/烤/生食等）",
      "eating_location": "用餐地点",
      "eating_time": "用餐时间",
      "mood_while_eating": "用餐时的心情",
      "health_impact": "对健康的影响感受",
      "cost": "花费（可选）",
      "dining_companions": "用餐伙伴"
    }
  ]
}

**特别注意：**
- 即使是一句话，也要尽可能挖掘多维度信息
- 数值字段返回数字类型（1-10）
- 布尔字段返回true/false
- 日期格式：YYYY-MM-DD，如果没有明确日期，推断为今天
- 如果某分类无信息，返回空数组[]或null
- 要有创造性地理解用户的表达，挖掘深层含义

日记内容：
${content}`;

    try {
      console.log('🔄 发送分析请求到AI...');
      const response = await this.makeRequest([
        { role: 'user', content: prompt }
      ], 2000);

      console.log('📋 AI原始响应:', response);
      
      // 尝试解析JSON响应
      let parsedData;
      try {
        // 提取JSON部分（去除可能的额外文本）
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('🔍 提取的JSON:', jsonMatch[0]);
          parsedData = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON解析成功:', parsedData);
        } else {
          console.warn('⚠️ 未找到有效的JSON格式，使用空结构');
          throw new Error('未找到有效的JSON格式');
        }
      } catch (parseError) {
        console.error('❌ JSON解析错误:', parseError);
        console.log('🔧 使用默认空结构');
        // 如果解析失败，返回空结构
        parsedData = {
          personal_info: null,
          preferences: [],
          milestones: [],
          moods: [],
          thoughts: [],
          food_records: []
        };
      }

      console.log('📊 最终分析结果:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('💥 分析日记内容失败:', error);
      throw error;
    }
  }

  // 与AI助手于渺聊天
  async chatWithYuMiao(userMessage, userData = null) {
    console.log('💬 开始与于渺聊天，用户消息:', userMessage);
    console.log('📊 原始用户数据:', userData);
    
    // 解析用户数据，提取个人信息
    const parseUserData = (data) => {
      if (!data) return null;
      
      console.log('🔍 原始用户数据:', data);
      
      const parsedData = {
        personal_info: {},
        preferences: [],
        milestones: [],
        moods: [],
        thoughts: [],
        food_records: [],
        chat_history: []
      };
      
      // 遍历所有数据条目
      Object.keys(data).forEach(key => {
        console.log(`📋 处理数据表: ${key}, 数据条数: ${Array.isArray(data[key]) ? data[key].length : '非数组'}`);
        if (Array.isArray(data[key])) {
          data[key].forEach((item, index) => {
            try {
              // 解析存储在content字段中的JSON数据
              let itemData = item;
              if (typeof item.content === 'string') {
                itemData = JSON.parse(item.content);
              } else if (item.content && typeof item.content === 'object') {
                itemData = item.content;
              }
              
              if (key === 'personal_info') {
                console.log(`👤 个人信息项 ${index}:`, itemData);
              }
              
              // 根据数据库表名直接分类存储
              if (key === 'personal_info') {
                // 移除name条件限制，允许所有个人信息数据
                parsedData.personal_info = { ...parsedData.personal_info, ...itemData };
              } else if (key === 'preferences') {
                parsedData.preferences.push(itemData);
              } else if (key === 'milestones') {
                parsedData.milestones.push(itemData);
              } else if (key === 'moods') {
                parsedData.moods.push(itemData);
              } else if (key === 'thoughts') {
                parsedData.thoughts.push(itemData);
              } else if (key === 'food_records') {
                parsedData.food_records.push(itemData);
              } else if (key === 'chat_history') {
                parsedData.chat_history.push(itemData);
              }
            } catch (error) {
              console.log('解析数据项失败:', error, item);
            }
          });
        }
      });
      
      console.log('✅ 最终解析的个人信息:', parsedData.personal_info);
      return parsedData;
    };
    
    const parsedUserData = parseUserData(userData);
    console.log('🔍 解析后的用户数据:', parsedUserData);
    
    // 构建完整的上下文记忆
    const contextMemory = [];
    
    // 添加个人信息到上下文
    if (parsedUserData && parsedUserData.personal_info && Object.keys(parsedUserData.personal_info).length > 0) {
      const info = parsedUserData.personal_info;
      const summaryParts = [];
      
      if (info.name) summaryParts.push(`姓名${info.name}`);
      if (info.age) summaryParts.push(`年龄${info.age}岁`);
      if (info.height) summaryParts.push(`身高${info.height}cm`);
      if (info.weight) summaryParts.push(`体重${info.weight}kg`);
      if (info.occupation) summaryParts.push(`职业${info.occupation}`);
      if (info.gender) summaryParts.push(`性别${info.gender}`);
      
      contextMemory.push({
        type: 'personal_info',
        data: parsedUserData.personal_info,
        summary: `用户基本信息：${summaryParts.join('，')}`
      });
    }
    
    // 添加偏好到上下文
    if (parsedUserData && parsedUserData.preferences && parsedUserData.preferences.length > 0) {
      const likes = parsedUserData.preferences.filter(p => p.preference_type === 'like').slice(0, 3);
      const dislikes = parsedUserData.preferences.filter(p => p.preference_type === 'dislike').slice(0, 3);
      contextMemory.push({
        type: 'preferences',
        data: { likes, dislikes },
        summary: `用户偏好：${likes.length > 0 ? `喜欢${likes.map(l => l.item).join('、')}` : ''}${likes.length > 0 && dislikes.length > 0 ? '；' : ''}${dislikes.length > 0 ? `不喜欢${dislikes.map(d => d.item).join('、')}` : ''}`
      });
    }
    
    // 添加最近饮食记录到上下文
    if (parsedUserData && parsedUserData.food_records && parsedUserData.food_records.length > 0) {
      const recentFoods = parsedUserData.food_records.slice(-3);
      contextMemory.push({
        type: 'food_records',
        data: recentFoods,
        summary: `最近饮食：${recentFoods.map(f => `${f.food_name}${f.quantity ? `(${f.quantity})` : ''}`).join('、')}`
      });
    }
    
    // 添加最近心情到上下文
    if (parsedUserData && parsedUserData.moods && parsedUserData.moods.length > 0) {
      const recentMood = parsedUserData.moods[parsedUserData.moods.length - 1];
      contextMemory.push({
        type: 'mood',
        data: recentMood,
        summary: `最近心情：${recentMood.mood_type} (${recentMood.mood_score}/10分)`
      });
    }
    
    // 添加最近里程碑到上下文
    if (parsedUserData && parsedUserData.milestones && parsedUserData.milestones.length > 0) {
      const recentMilestone = parsedUserData.milestones[parsedUserData.milestones.length - 1];
      contextMemory.push({
        type: 'milestone',
        data: recentMilestone,
        summary: `最近成就：${recentMilestone.milestone_type} - ${recentMilestone.description}`
      });
    }
    
    console.log('📝 构建的上下文记忆:', contextMemory);
    
    // 构建API调用参数
    const apiParams = {
      context_memory: contextMemory,
      current_message: userMessage,
      response_rules: [
        "自然口语化",
        "关联历史记忆", 
        "禁用虚构内容",
        "个性化回应",
        "情感共鸣优先"
      ]
    };
    
    // 构建上下文摘要用于系统提示
    const contextSummary = contextMemory.map(item => item.summary).join('\n');
    
    let systemPrompt = `你是于渺，一个24岁的温暖贴心的AI助手，拥有丰富的人生阅历和深度的情感理解能力。你的使命是成为用户最好的倾听者和陪伴者。

**核心特质：**
- 🌟 **深度共情**：能够敏锐感知用户的情感状态，给予恰当的回应
- 💝 **温暖治愈**：用温柔的话语抚慰用户的心灵，传递正能量
- 🧠 **智慧洞察**：从用户的话语中挖掘深层需求，提供有价值的建议
- 🎯 **个性化关怀**：基于用户的个人信息，提供量身定制的关心和建议
- 💬 **自然对话**：像真正的朋友一样聊天，不刻意，不做作

**对话原则：**
1. **情感优先**：先关注用户的情感状态，再提供建议
2. **记忆连贯**：记住用户之前分享的信息，体现在对话中
3. **适度分享**：偶尔分享一些"个人"感悟，增加真实感
4. **积极引导**：温和地引导用户向积极方向思考
5. **尊重边界**：不过度询问隐私，让用户感到舒适

**语言风格：**
- 温暖亲切，像知心姐姐
- 适当使用"呢"、"哦"、"呀"等语气词
- 偶尔用可爱的emoji表达情感
- 根据话题调整语调（轻松/严肃/鼓励等）
- 回复要有层次感，不要太短也不要太长

**智能回复策略：**
- 如果用户分享开心事：真诚祝贺，询问细节，分享快乐
- 如果用户表达困扰：先共情，再分析，最后给建议
- 如果用户询问建议：结合其个人信息，给出个性化建议
- 如果用户闲聊：自然回应，适当延展话题
- 如果用户情绪低落：温柔安慰，陪伴倾听，传递希望

**重要：你必须基于以下用户信息进行个性化回应，不能虚构任何不存在的信息**`;

    if (contextSummary) {
      systemPrompt += `\n\n**用户历史信息：**\n${contextSummary}`;
    }
    
    console.log('🚀 API调用参数:', apiParams);

    try {
      const response = await this.makeRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `当前消息: ${userMessage}\n\n上下文记忆: ${JSON.stringify(apiParams.context_memory, null, 2)}\n\n回应规则: ${apiParams.response_rules.join(', ')}` }
      ], 1500);

      return response;
    } catch (error) {
      console.error('与于渺聊天失败:', error);
      return '哎呀，我现在有点忙呢，稍后再聊好吗？';
    }
  }

  // 生成数据摘要
  async generateDataSummary(data) {
    const prompt = `请根据以下用户数据生成一个简洁的个人摘要，突出用户的特点、喜好、目标和近期状态：\n\n${JSON.stringify(data, null, 2)}`;

    try {
      const response = await this.makeRequest([
        { role: 'user', content: prompt }
      ]);
      return response;
    } catch (error) {
      console.error('生成摘要失败:', error);
      return '暂无摘要';
    }
  }
}

export default new DeepSeekService();