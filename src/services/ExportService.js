import { Platform, Alert } from 'react-native';
import DatabaseService from './DatabaseService';

// 条件导入移动端专用模块
let FileSystem = null;
let Sharing = null;
let Print = null;

if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
  Sharing = require('expo-sharing');
  Print = require('expo-print');
}

class ExportService {
  constructor() {
    this.isWeb = Platform.OS === 'web';
    // 使用应用文档目录，通过分享功能让用户保存到任意位置
    if (!this.isWeb) {
      this.exportDirectory = FileSystem.documentDirectory + 'exports/';
    }
  }

  // 确保导出目录存在
  async ensureExportDirectory() {
    if (this.isWeb) {
      // Web环境下不需要创建目录
      return;
    }
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.exportDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.exportDirectory, { intermediates: true });
      }
    } catch (error) {
      console.error('创建导出目录失败:', error);
    }
  }

  // 将数据转换为CSV格式
  convertToCSV(data, headers) {
    if (!data || data.length === 0) {
      return headers.join(',') + '\n';
    }

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header.toLowerCase().replace(/\s+/g, '_')] || '';
        // 处理包含逗号或引号的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  // Web环境下载文件
  downloadFileInWeb(content, fileName, mimeType = 'text/plain') {
    if (!this.isWeb) return;
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // 导出个人信息表
  async exportPersonalInfo() {
    try {
      const rawData = await DatabaseService.getTableData('personal_info');
      const headers = ['ID', '姓名', '年龄', '性别', '职业', '健康状况', '身高', '体重', '血型', '过敏信息', '用药信息', '创建时间', '更新时间'];
      
      // 处理数据，从content字段中提取信息
      const processedData = rawData.map(item => {
        let contentData = {};
        try {
          contentData = typeof item.content === 'string' ? JSON.parse(item.content) : (item.content || {});
        } catch (e) {
          console.warn('解析个人信息content失败:', e);
          contentData = {};
        }
        
        return {
          id: item.id,
          '姓名': contentData.name || item.name || '',
          '年龄': contentData.age || item.age || '',
          '性别': contentData.gender || item.gender || '',
          '职业': contentData.occupation || item.occupation || '',
          '健康状况': contentData.health_status || item.health_status || '',
          '身高': contentData.height || item.height || '',
          '体重': contentData.weight || item.weight || '',
          '血型': contentData.blood_type || item.blood_type || '',
          '过敏信息': contentData.allergies || item.allergies || '',
          '用药信息': contentData.medications || item.medications || '',
          '创建时间': item.created_at || '',
          '更新时间': item.updated_at || ''
        };
      });
      
      const csv = this.convertToCSV(processedData, headers);
      
      const fileName = `个人信息_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (this.isWeb) {
        this.downloadFileInWeb(csv, fileName, 'text/csv;charset=utf-8');
        return { success: true, fileName };
      } else {
        await this.ensureExportDirectory();
        const filePath = this.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      console.error('导出个人信息失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出喜好表
  async exportPreferences() {
    try {
      const rawData = await DatabaseService.getTableData('preferences');
      const headers = ['ID', '分类', '项目', '喜好类型', '强度', '备注', '创建时间'];
      
      // 处理数据，从content字段中提取信息
      const processedData = rawData.map(item => {
        let contentData = {};
        try {
          contentData = typeof item.content === 'string' ? JSON.parse(item.content) : (item.content || {});
        } catch (e) {
          console.warn('解析喜好记录content失败:', e);
          contentData = {};
        }
        
        return {
          id: item.id,
          '分类': contentData.category || item.category || '',
          '项目': contentData.item || item.item || '',
          '喜好类型': contentData.preference_type || item.preference_type || '',
          '强度': contentData.intensity || item.intensity || '',
          '备注': contentData.notes || item.notes || '',
          '创建时间': item.created_at || ''
        };
      });
      
      const csv = this.convertToCSV(processedData, headers);
      
      const fileName = `喜好记录_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (this.isWeb) {
        this.downloadFileInWeb(csv, fileName, 'text/csv;charset=utf-8');
        return { success: true, fileName };
      } else {
        await this.ensureExportDirectory();
        const filePath = this.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      console.error('导出喜好记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出里程碑表
  async exportMilestones() {
    try {
      const rawData = await DatabaseService.getTableData('milestones');
      const headers = ['ID', '标题', '描述', '分类', '状态', '目标日期', '完成日期', '优先级', '创建时间', '更新时间'];
      
      // 处理数据，从content字段中提取信息
      const processedData = rawData.map(item => {
        let contentData = {};
        try {
          contentData = typeof item.content === 'string' ? JSON.parse(item.content) : (item.content || {});
        } catch (e) {
          console.warn('解析里程碑记录content失败:', e);
          contentData = {};
        }
        
        return {
          id: item.id,
          '标题': contentData.title || item.title || '',
          '描述': contentData.description || item.description || '',
          '分类': contentData.category || item.category || '',
          '状态': contentData.status || item.status || '',
          '目标日期': contentData.target_date || item.target_date || '',
          '完成日期': contentData.completed_date || item.completed_date || '',
          '优先级': contentData.priority || item.priority || '',
          '创建时间': item.created_at || '',
          '更新时间': item.updated_at || ''
        };
      });
      
      const csv = this.convertToCSV(processedData, headers);
      
      const fileName = `里程碑记录_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (this.isWeb) {
        this.downloadFileInWeb(csv, fileName, 'text/csv;charset=utf-8');
        return { success: true, fileName };
      } else {
        await this.ensureExportDirectory();
        const filePath = this.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      console.error('导出里程碑记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出心情表
  async exportMoods() {
    try {
      const rawData = await DatabaseService.getTableData('moods');
      const headers = ['ID', '心情评分', '心情类型', '描述', '触发因素', '天气', '地点', '日期', '创建时间'];
      
      // 处理数据，从content字段中提取信息
      const processedData = rawData.map(item => {
        let contentData = {};
        try {
          contentData = typeof item.content === 'string' ? JSON.parse(item.content) : (item.content || {});
        } catch (e) {
          console.warn('解析心情记录content失败:', e);
          contentData = {};
        }
        
        return {
          id: item.id,
          '心情评分': contentData.mood_score || item.mood_score || '',
          '心情类型': contentData.mood_type || item.mood_type || '',
          '描述': contentData.description || item.description || '',
          '触发因素': contentData.trigger_factors || item.trigger_factors || '',
          '天气': contentData.weather || item.weather || '',
          '地点': contentData.location || item.location || '',
          '日期': contentData.date || item.date || '',
          '创建时间': item.created_at || ''
        };
      });
      
      const csv = this.convertToCSV(processedData, headers);
      
      const fileName = `心情记录_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (this.isWeb) {
        this.downloadFileInWeb(csv, fileName, 'text/csv;charset=utf-8');
        return { success: true, fileName };
      } else {
        await this.ensureExportDirectory();
        const filePath = this.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      console.error('导出心情记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出想法表
  async exportThoughts() {
    try {
      const rawData = await DatabaseService.getTableData('thoughts');
      const headers = ['ID', '标题', '内容', '分类', '标签', '灵感来源', '是否收藏', '创建时间', '更新时间'];
      
      // 处理数据，从content字段中提取信息
      const processedData = rawData.map(item => {
        let contentData = {};
        try {
          contentData = typeof item.content === 'string' ? JSON.parse(item.content) : (item.content || {});
        } catch (e) {
          console.warn('解析想法记录content失败:', e);
          contentData = {};
        }
        
        return {
          id: item.id,
          '标题': contentData.title || item.title || '',
          '内容': contentData.thought_content || item.thought_content || '',
          '分类': contentData.category || item.category || '',
          '标签': contentData.tags || item.tags || '',
          '灵感来源': contentData.inspiration_source || item.inspiration_source || '',
          '是否收藏': contentData.is_favorite || item.is_favorite || '',
          '创建时间': item.created_at || '',
          '更新时间': item.updated_at || ''
        };
      });
      
      const csv = this.convertToCSV(processedData, headers);
      
      const fileName = `想法记录_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (this.isWeb) {
        this.downloadFileInWeb(csv, fileName, 'text/csv;charset=utf-8');
        return { success: true, fileName };
      } else {
        await this.ensureExportDirectory();
        const filePath = this.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      console.error('导出想法记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出日记表
  async exportDiaries() {
    try {
      const rawData = await DatabaseService.getTableData('diaries');
      const headers = ['ID', '标题', '内容', '心情', '天气', '地点', '标签', '创建时间', '更新时间'];
      
      // 处理数据，从content字段中提取信息
      const processedData = rawData.map(item => {
        let contentData = {};
        try {
          contentData = typeof item.content === 'string' ? JSON.parse(item.content) : (item.content || {});
        } catch (e) {
          console.warn('解析日记记录content失败:', e);
          contentData = {};
        }
        
        return {
           id: item.id,
           '标题': contentData.title || item.title || '',
           '内容': contentData.diary_content || item.diary_content || '',
           '心情': contentData.mood || item.mood || '',
           '天气': contentData.weather || item.weather || '',
           '地点': contentData.location || item.location || '',
           '标签': contentData.tags || item.tags || '',
           '创建时间': item.created_at || '',
           '更新时间': item.updated_at || ''
         };
      });
      
      const csv = this.convertToCSV(processedData, headers);
      
      const fileName = `日记记录_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (this.isWeb) {
        this.downloadFileInWeb(csv, fileName, 'text/csv;charset=utf-8');
        return { success: true, fileName };
      } else {
        await this.ensureExportDirectory();
        const filePath = this.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      console.error('导出日记记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出健康记录表
  async exportHealthRecords() {
    try {
      const rawData = await DatabaseService.getTableData('health_records');
      const headers = ['ID', '记录类型', '数值', '单位', '描述', '记录日期', '创建时间'];
      
      // 处理数据，从content字段中提取信息
      const processedData = rawData.map(item => {
        let contentData = {};
        try {
          contentData = typeof item.content === 'string' ? JSON.parse(item.content) : (item.content || {});
        } catch (e) {
          console.warn('解析健康记录content失败:', e);
          contentData = {};
        }
        
        return {
          id: item.id,
          '记录类型': contentData.record_type || item.record_type || '',
          '数值': contentData.value || item.value || '',
          '单位': contentData.unit || item.unit || '',
          '描述': contentData.description || item.description || '',
          '记录日期': contentData.record_date || item.record_date || '',
          '创建时间': item.created_at || ''
        };
      });
      
      const csv = this.convertToCSV(processedData, headers);
      
      const fileName = `健康记录_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (this.isWeb) {
        this.downloadFileInWeb(csv, fileName, 'text/csv;charset=utf-8');
        return { success: true, fileName };
      } else {
        await this.ensureExportDirectory();
        const filePath = this.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      console.error('导出健康记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出聊天记录
  async exportChatHistory() {
    try {
      const rawData = await DatabaseService.getTableData('chat_history');
      const headers = ['ID', '用户消息', 'AI回复', '会话ID', '创建时间'];
      
      // 处理数据，从content字段中提取信息
      const processedData = rawData.map(item => {
        let contentData = {};
        try {
          contentData = typeof item.content === 'string' ? JSON.parse(item.content) : (item.content || {});
        } catch (e) {
          console.warn('解析聊天记录content失败:', e);
          contentData = {};
        }
        
        return {
          id: item.id,
          '用户消息': contentData.user_message || item.user_message || '',
          'AI回复': contentData.ai_response || item.ai_response || '',
          '会话ID': contentData.session_id || item.session_id || '',
          '创建时间': item.created_at || ''
        };
      });
      
      const csv = this.convertToCSV(processedData, headers);
      
      const fileName = `聊天记录_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (this.isWeb) {
        this.downloadFileInWeb(csv, fileName, 'text/csv;charset=utf-8');
        return { success: true, fileName };
      } else {
        await this.ensureExportDirectory();
        const filePath = this.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      console.error('导出聊天记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出聊天记录为PDF
  async exportChatHistoryAsPDF(data = null) {
    try {
      const chatData = data || await DatabaseService.getTableData('chat_history');
      
      // 生成HTML内容
      const htmlContent = this.generateChatHistoryHTML(chatData);
      
      const fileName = `聊天记录_${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (this.isWeb) {
        // Web环境下导出为HTML文件（可以在浏览器中打印为PDF）
        const htmlFileName = `聊天记录_${new Date().toISOString().split('T')[0]}.html`;
        this.downloadFileInWeb(htmlContent, htmlFileName, 'text/html;charset=utf-8');
        return { success: true, fileName: htmlFileName, message: '已导出为HTML文件，您可以在浏览器中打开并打印为PDF' };
      } else {
        // 移动端使用expo-print
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false
        });
        
        // 移动到导出目录
        await this.ensureExportDirectory();
        const filePath = this.exportDirectory + fileName;
        
        await FileSystem.moveAsync({
          from: uri,
          to: filePath
        });
        
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      console.error('导出PDF失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出聊天记录为Word格式（HTML格式，可用Word打开）
  async exportChatHistoryAsWord(data = null) {
    try {
      const chatData = data || await DatabaseService.getTableData('chat_history');
      
      // 生成Word兼容的HTML内容
      const htmlContent = this.generateWordCompatibleHTML(chatData);
      
      const fileName = `聊天记录_${new Date().toISOString().split('T')[0]}.doc`;
      
      if (this.isWeb) {
        this.downloadFileInWeb(htmlContent, fileName, 'application/msword;charset=utf-8');
        return { success: true, fileName };
      } else {
        await this.ensureExportDirectory();
        const filePath = this.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, htmlContent, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      console.error('导出Word失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 生成聊天记录的HTML内容（用于PDF）
  generateChatHistoryHTML(data) {
    const currentDate = new Date().toLocaleString('zh-CN');
    const totalChats = data.length;
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>聊天记录</title>
        <style>
            body {
                font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
                line-height: 1.6;
                margin: 20px;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #007AFF;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .title {
                font-size: 28px;
                font-weight: bold;
                color: #007AFF;
                margin-bottom: 10px;
            }
            .subtitle {
                font-size: 14px;
                color: #666;
            }
            .stats {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 30px;
                text-align: center;
            }
            .chat-item {
                margin-bottom: 25px;
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                overflow: hidden;
            }
            .chat-header {
                background-color: #f5f5f5;
                padding: 10px 15px;
                font-size: 12px;
                color: #666;
                border-bottom: 1px solid #e0e0e0;
            }
            .message {
                padding: 15px;
            }
            .user-message {
                background-color: #e3f2fd;
                border-left: 4px solid #2196f3;
            }
            .ai-message {
                background-color: #f3e5f5;
                border-left: 4px solid #9c27b0;
            }
            .message-label {
                font-weight: bold;
                font-size: 12px;
                color: #666;
                margin-bottom: 8px;
                text-transform: uppercase;
            }
            .message-content {
                font-size: 14px;
                line-height: 1.5;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .page-break {
                page-break-before: always;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">AIJournal 聊天记录</div>
            <div class="subtitle">导出时间: ${currentDate}</div>
        </div>
        
        <div class="stats">
            <strong>统计信息:</strong> 共 ${totalChats} 条对话记录
        </div>
    `;
    
    data.forEach((item, index) => {
      const chatTime = new Date(item.created_at).toLocaleString('zh-CN');
      const sessionId = item.session_id || '未知会话';
      
      // 每10条记录添加分页符
      if (index > 0 && index % 10 === 0) {
        html += '<div class="page-break"></div>';
      }
      
      html += `
        <div class="chat-item">
            <div class="chat-header">
                对话 #${index + 1} | 时间: ${chatTime} | 会话: ${sessionId}
            </div>
            <div class="message user-message">
                <div class="message-label">用户</div>
                <div class="message-content">${this.escapeHtml(item.user_message || '')}</div>
            </div>
            <div class="message ai-message">
                <div class="message-label">AI助手</div>
                <div class="message-content">${this.escapeHtml(item.ai_response || '')}</div>
            </div>
        </div>
      `;
    });
    
    html += `
        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #999;">
            <p>此文档由 AIJournal 应用自动生成</p>
            <p>生成时间: ${currentDate}</p>
        </div>
    </body>
    </html>
    `;
    
    return html;
  }

  // 生成Word兼容的HTML内容
  generateWordCompatibleHTML(data) {
    const currentDate = new Date().toLocaleString('zh-CN');
    const totalChats = data.length;
    
    let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="UTF-8">
        <title>聊天记录</title>
        <!--[if gte mso 9]>
        <xml>
            <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>90</w:Zoom>
                <w:DoNotPromptForConvert/>
                <w:DoNotShowInsertionsAndDeletions/>
            </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
            body {
                font-family: '微软雅黑', 'Microsoft YaHei', Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.5;
                margin: 1in;
            }
            .header {
                text-align: center;
                border-bottom: 2pt solid #007AFF;
                padding-bottom: 12pt;
                margin-bottom: 24pt;
            }
            .title {
                font-size: 20pt;
                font-weight: bold;
                color: #007AFF;
                margin-bottom: 6pt;
            }
            .subtitle {
                font-size: 10pt;
                color: #666;
            }
            .stats {
                background-color: #f8f9fa;
                padding: 12pt;
                border: 1pt solid #ddd;
                margin-bottom: 24pt;
                text-align: center;
            }
            .chat-item {
                margin-bottom: 18pt;
                border: 1pt solid #ddd;
                page-break-inside: avoid;
            }
            .chat-header {
                background-color: #f5f5f5;
                padding: 6pt 12pt;
                font-size: 9pt;
                color: #666;
                border-bottom: 1pt solid #ddd;
                font-weight: bold;
            }
            .message {
                padding: 12pt;
            }
            .user-message {
                background-color: #e3f2fd;
                border-left: 3pt solid #2196f3;
            }
            .ai-message {
                background-color: #f3e5f5;
                border-left: 3pt solid #9c27b0;
            }
            .message-label {
                font-weight: bold;
                font-size: 9pt;
                color: #666;
                margin-bottom: 6pt;
            }
            .message-content {
                font-size: 11pt;
                line-height: 1.4;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">AIJournal 聊天记录</div>
            <div class="subtitle">导出时间: ${currentDate}</div>
        </div>
        
        <div class="stats">
            <strong>统计信息:</strong> 共 ${totalChats} 条对话记录
        </div>
    `;
    
    data.forEach((item, index) => {
      const chatTime = new Date(item.created_at).toLocaleString('zh-CN');
      const sessionId = item.session_id || '未知会话';
      
      html += `
        <div class="chat-item">
            <div class="chat-header">
                对话 #${index + 1} | 时间: ${chatTime} | 会话: ${sessionId}
            </div>
            <div class="message user-message">
                <div class="message-label">用户</div>
                <div class="message-content">${this.escapeHtml(item.user_message || '')}</div>
            </div>
            <div class="message ai-message">
                <div class="message-label">AI助手</div>
                <div class="message-content">${this.escapeHtml(item.ai_response || '')}</div>
            </div>
        </div>
      `;
    });
    
    html += `
        <div style="margin-top: 24pt; text-align: center; font-size: 9pt; color: #999;">
            <p>此文档由 AIJournal 应用自动生成</p>
            <p>生成时间: ${currentDate}</p>
        </div>
    </body>
    </html>
    `;
    
    return html;
  }

  // HTML转义函数
  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br>');
  }

  // 导出所有数据
  async exportAllData() {
    try {
      const allData = await DatabaseService.getAllTablesData();
      const jsonData = JSON.stringify(allData, null, 2);
      
      const fileName = `完整数据备份_${new Date().toISOString().split('T')[0]}.json`;
      
      if (this.isWeb) {
        this.downloadFileInWeb(jsonData, fileName, 'application/json;charset=utf-8');
        return { success: true, fileName };
      } else {
        await this.ensureExportDirectory();
        const filePath = this.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, jsonData, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      console.error('导出完整数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 分享文件
  async shareFile(filePath) {
    try {
      if (this.isWeb) {
        // Web环境下无法直接分享文件，提示用户手动分享
        return { success: false, error: 'Web环境下请手动分享已下载的文件' };
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          throw new Error('分享功能不可用');
        }

        // 获取文件扩展名来确定MIME类型
        const fileExtension = filePath.split('.').pop().toLowerCase();
        let mimeType = 'text/plain';
        
        switch (fileExtension) {
          case 'csv':
            mimeType = 'text/csv';
            break;
          case 'json':
            mimeType = 'application/json';
            break;
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          case 'doc':
          case 'docx':
            mimeType = 'application/msword';
            break;
          default:
            mimeType = 'text/plain';
        }

        await Sharing.shareAsync(filePath, {
          mimeType: mimeType,
          dialogTitle: '保存文件到手机',
          UTI: fileExtension === 'json' ? 'public.json' : undefined
        });
        
        // 显示提示信息
        Alert.alert(
          '文件已分享',
          '请在分享菜单中选择"保存到文件"或其他文件管理应用，将文件保存到手机的下载目录或其他位置。',
          [{ text: '确定' }]
        );
        
        return { success: true };
      }
    } catch (error) {
      console.error('分享文件失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 新增：保存文件到手机存储的便捷方法
  async saveToPhoneStorage(filePath, fileName) {
    try {
      if (this.isWeb) {
        return { success: false, error: 'Web环境下文件已自动下载到浏览器下载目录' };
      }
      
      // 直接使用分享功能，让用户选择保存位置
      const shareResult = await this.shareFile(filePath);
      return shareResult;
    } catch (error) {
      console.error('保存到手机存储失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取导出文件列表
  async getExportedFiles() {
    try {
      if (this.isWeb) {
        // Web环境下无法获取已下载的文件列表
        return [];
      } else {
        await this.ensureExportDirectory();
        const files = await FileSystem.readDirectoryAsync(this.exportDirectory);
        const fileInfos = [];
        
        for (const file of files) {
          const filePath = this.exportDirectory + file;
          const info = await FileSystem.getInfoAsync(filePath);
          fileInfos.push({
            name: file,
            path: filePath,
            size: info.size,
            modificationTime: info.modificationTime
          });
        }
        
        return fileInfos.sort((a, b) => b.modificationTime - a.modificationTime);
      }
    } catch (error) {
      console.error('获取导出文件列表失败:', error);
      return [];
    }
  }

  // 删除导出文件
  async deleteExportedFile(filePath) {
    try {
      if (this.isWeb) {
        // Web环境下无法删除已下载的文件
        return { success: false, error: 'Web环境下无法删除已下载的文件' };
      } else {
        await FileSystem.deleteAsync(filePath);
        return { success: true };
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 清理所有导出文件
  async clearAllExports() {
    try {
      if (this.isWeb) {
        // Web环境下无法清理已下载的文件
        return { success: false, error: 'Web环境下无法清理已下载的文件' };
      } else {
        const files = await this.getExportedFiles();
        for (const file of files) {
          await FileSystem.deleteAsync(file.path);
        }
        return { success: true };
      }
    } catch (error) {
      console.error('清理导出文件失败:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ExportService();