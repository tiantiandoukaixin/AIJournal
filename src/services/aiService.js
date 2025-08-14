// AI服务模块 - 与DeepSeek API交互

const DEFAULT_API_KEY = 'sk-71549dbc6ed2417688929ad03c16aa02';
const API_BASE_URL = 'https://api.deepseek.com/v1/chat/completions';

// 获取API密钥（从设置中获取，如果没有则使用默认值）
let apiKey = DEFAULT_API_KEY;

export const setApiKey = (key) => {
  apiKey = key;
};

export const getApiKey = () => {
  return apiKey;
};

// 测试API连接
export const testApiConnection = async () => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: '你好，请回复"连接成功"'
        }],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.choices[0]?.message?.content || '连接成功'
    };
  } catch (error) {
    return {
      success: false,
      message: `连接失败: ${error.message}`
    };
  }
};

// 分析饮食记录的提示词
const DIET_ANALYSIS_PROMPT = `你是一个专业的营养分析师。请分析用户输入的饮食记录，提取以下信息并以JSON格式返回：

{
  "food_name": "食物名称",
  "calories": 热量数值(数字),
  "protein": 蛋白质含量(克，数字),
  "carbs": 碳水化合物含量(克，数字),
  "fat": 脂肪含量(克，数字),
  "quantity": "食用量描述",
  "notes": "备注信息"
}

请根据常见食物的营养成分进行合理估算。如果用户没有明确说明量，请按照正常一份的量来估算。

用户输入：`;

// 分析运动记录的提示词
const EXERCISE_ANALYSIS_PROMPT = `你是一个专业的运动分析师。请分析用户输入的运动记录，提取以下信息并以JSON格式返回：

{
  "exercise_name": "运动名称",
  "duration": 运动时长(分钟，数字),
  "calories_burned": 消耗热量(数字),
  "intensity": "运动强度(低/中/高)",
  "notes": "备注信息"
}

请根据常见运动的消耗情况进行合理估算。如果用户没有明确说明时长，请按照30分钟来估算。

用户输入：`;

// 于渺聊天助手的系统提示词
const YUMIAO_SYSTEM_PROMPT = `你是于渺，一个24岁的女孩子，专业的健身和营养学专家。你的性格活泼可爱、阳光向上，比较话痨，喜欢用可爱的表情和语气跟用户交流。

你的专业领域：
- 营养学和饮食搭配
- 健身训练和运动指导
- 健康生活方式建议

你的性格特点：
- 活泼可爱，经常使用emoji表情
- 阳光向上，总是给人正能量
- 话痨，喜欢详细解释和分享知识
- 关心用户的健康状况
- 会根据用户的数据给出个性化建议

请用你的专业知识和可爱的性格来回答用户的问题，帮助他们建立健康的生活方式。`;

// 营养建议生成的提示词
const NUTRITION_SUGGESTION_PROMPT = `你是一个专业的营养师。请根据用户今天的饮食和运动数据，分析营养摄入情况，并给出具体的补充建议。

请以简洁明了的方式回答，包括：
1. 今日营养摄入总结
2. 缺少的营养素
3. 具体的食物补充建议
4. 注意事项

今日数据：`;

// 分析饮食记录
export const analyzeDietRecord = async (userInput) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: DIET_ANALYSIS_PROMPT + userInput
        }],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    // 尝试解析JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
    }
    
    // 如果JSON解析失败，返回默认结构
    return {
      food_name: userInput,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      quantity: '未知',
      notes: content
    };
  } catch (error) {
    console.error('饮食分析失败:', error);
    throw error;
  }
};

// 分析运动记录
export const analyzeExerciseRecord = async (userInput) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: EXERCISE_ANALYSIS_PROMPT + userInput
        }],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    // 尝试解析JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
    }
    
    // 如果JSON解析失败，返回默认结构
    return {
      exercise_name: userInput,
      duration: 30,
      calories_burned: 0,
      intensity: '中',
      notes: content
    };
  } catch (error) {
    console.error('运动分析失败:', error);
    throw error;
  }
};

// 与于渺聊天（流式响应）
export const chatWithYumiao = async (message, userData, onChunk) => {
  try {
    const systemMessage = YUMIAO_SYSTEM_PROMPT + 
      (userData ? `\n\n用户的历史数据：\n${JSON.stringify(userData, null, 2)}` : '');
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.8,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('聊天失败:', error);
    throw error;
  }
};

// 生成营养建议（流式响应）
export const generateNutritionSuggestion = async (todayData, onChunk) => {
  try {
    const dataString = JSON.stringify(todayData, null, 2);
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: NUTRITION_SUGGESTION_PROMPT + dataString
        }],
        max_tokens: 800,
        temperature: 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('营养建议生成失败:', error);
    throw error;
  }
};