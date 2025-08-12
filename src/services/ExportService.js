import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DatabaseService from './DatabaseService';

class ExportService {
  constructor() {
    this.exportDirectory = FileSystem.documentDirectory + 'exports/';
  }

  // 确保导出目录存在
  async ensureExportDirectory() {
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

  // 导出个人信息表
  async exportPersonalInfo() {
    try {
      const data = await DatabaseService.getTableData('personal_info');
      const headers = ['ID', '姓名', '年龄', '性别', '职业', '健康状况', '身高', '体重', '血型', '过敏信息', '用药信息', '创建时间', '更新时间'];
      const csv = this.convertToCSV(data, headers);
      
      await this.ensureExportDirectory();
      const fileName = `个人信息_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = this.exportDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
      return { success: true, filePath, fileName };
    } catch (error) {
      console.error('导出个人信息失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出喜好表
  async exportPreferences() {
    try {
      const data = await DatabaseService.getTableData('preferences');
      const headers = ['ID', '分类', '项目', '喜好类型', '强度', '备注', '创建时间'];
      const csv = this.convertToCSV(data, headers);
      
      await this.ensureExportDirectory();
      const fileName = `喜好记录_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = this.exportDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
      return { success: true, filePath, fileName };
    } catch (error) {
      console.error('导出喜好记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出里程碑表
  async exportMilestones() {
    try {
      const data = await DatabaseService.getTableData('milestones');
      const headers = ['ID', '标题', '描述', '分类', '状态', '目标日期', '完成日期', '优先级', '创建时间', '更新时间'];
      const csv = this.convertToCSV(data, headers);
      
      await this.ensureExportDirectory();
      const fileName = `里程碑记录_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = this.exportDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
      return { success: true, filePath, fileName };
    } catch (error) {
      console.error('导出里程碑记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出心情表
  async exportMoods() {
    try {
      const data = await DatabaseService.getTableData('moods');
      const headers = ['ID', '心情评分', '心情类型', '描述', '触发因素', '天气', '地点', '日期', '创建时间'];
      const csv = this.convertToCSV(data, headers);
      
      await this.ensureExportDirectory();
      const fileName = `心情记录_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = this.exportDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
      return { success: true, filePath, fileName };
    } catch (error) {
      console.error('导出心情记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出想法表
  async exportThoughts() {
    try {
      const data = await DatabaseService.getTableData('thoughts');
      const headers = ['ID', '标题', '内容', '分类', '标签', '灵感来源', '是否收藏', '创建时间', '更新时间'];
      const csv = this.convertToCSV(data, headers);
      
      await this.ensureExportDirectory();
      const fileName = `想法记录_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = this.exportDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
      return { success: true, filePath, fileName };
    } catch (error) {
      console.error('导出想法记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出聊天记录
  async exportChatHistory() {
    try {
      const data = await DatabaseService.getTableData('chat_history');
      const headers = ['ID', '用户消息', 'AI回复', '会话ID', '创建时间'];
      const csv = this.convertToCSV(data, headers);
      
      await this.ensureExportDirectory();
      const fileName = `聊天记录_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = this.exportDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });
      return { success: true, filePath, fileName };
    } catch (error) {
      console.error('导出聊天记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出所有数据
  async exportAllData() {
    try {
      const allData = await DatabaseService.getAllData();
      const jsonData = JSON.stringify(allData, null, 2);
      
      await this.ensureExportDirectory();
      const fileName = `完整数据备份_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = this.exportDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(filePath, jsonData, { encoding: FileSystem.EncodingType.UTF8 });
      return { success: true, filePath, fileName };
    } catch (error) {
      console.error('导出完整数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 分享文件
  async shareFile(filePath) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('分享功能不可用');
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: '分享数据文件'
      });
      return { success: true };
    } catch (error) {
      console.error('分享文件失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取导出文件列表
  async getExportedFiles() {
    try {
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
    } catch (error) {
      console.error('获取导出文件列表失败:', error);
      return [];
    }
  }

  // 删除导出文件
  async deleteExportedFile(filePath) {
    try {
      await FileSystem.deleteAsync(filePath);
      return { success: true };
    } catch (error) {
      console.error('删除文件失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 清理所有导出文件
  async clearAllExports() {
    try {
      const files = await this.getExportedFiles();
      for (const file of files) {
        await FileSystem.deleteAsync(file.path);
      }
      return { success: true };
    } catch (error) {
      console.error('清理导出文件失败:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ExportService();