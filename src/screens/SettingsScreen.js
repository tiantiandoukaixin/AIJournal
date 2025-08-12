import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeepSeekService from '../services/DeepSeekService';
import VoiceService from '../services/VoiceService';
import ExportService from '../services/ExportService';
import DatabaseService from '../services/DatabaseService';

const STORAGE_KEYS = {
  API_KEY: 'deepseek_api_key',
  VOICE_ENABLED: 'voice_enabled',
  DATA_RETENTION_DAYS: 'data_retention_days',
  AUTO_BACKUP: 'auto_backup'
};

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [dataRetentionDays, setDataRetentionDays] = useState('30');
  const [autoBackup, setAutoBackup] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [exportedFiles, setExportedFiles] = useState([]);
  const [filesModalVisible, setFilesModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadExportedFiles();
  }, []);

  const loadSettings = async () => {
    try {
      const savedApiKey = await AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
      const savedVoiceEnabled = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_ENABLED);
      const savedDataRetention = await AsyncStorage.getItem(STORAGE_KEYS.DATA_RETENTION_DAYS);
      const savedAutoBackup = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_BACKUP);

      // 设置默认API密钥
      const defaultApiKey = 'sk-71549dbc6ed2417688929ad03c16aa02';
      if (savedApiKey) {
        setApiKey(savedApiKey);
        DeepSeekService.setApiKey(savedApiKey);
      } else {
        // 如果没有保存的API密钥，使用默认值
        setApiKey(defaultApiKey);
        DeepSeekService.setApiKey(defaultApiKey);
        // 自动保存默认API密钥
        await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, defaultApiKey);
      }
      
      if (savedVoiceEnabled !== null) {
        setVoiceEnabled(JSON.parse(savedVoiceEnabled));
      }
      if (savedDataRetention) {
        setDataRetentionDays(savedDataRetention);
      }
      if (savedAutoBackup !== null) {
        setAutoBackup(JSON.parse(savedAutoBackup));
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
      DeepSeekService.setApiKey(apiKey);
      if (Platform.OS === 'web') {
        window.alert('API密钥已保存');
      } else {
        Alert.alert('成功', 'API密钥已保存');
      }
    } catch (error) {
      console.error('保存API密钥失败:', error);
      if (Platform.OS === 'web') {
        window.alert('保存失败');
      } else {
        Alert.alert('错误', '保存失败');
      }
    }
  };

  const testApiConnection = async () => {
    if (!apiKey.trim()) {
      if (Platform.OS === 'web') {
        window.alert('请先输入API密钥');
      } else {
        Alert.alert('提示', '请先输入API密钥');
      }
      return;
    }

    setIsTestingApi(true);
    try {
      const result = await DeepSeekService.testConnection();
      if (result.success) {
        if (Platform.OS === 'web') {
          window.alert('API连接正常');
        } else {
          Alert.alert('测试成功', 'API连接正常');
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.message);
        } else {
          Alert.alert('测试失败', result.message);
        }
      }
    } catch (error) {
      console.error('API测试失败:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message);
      } else {
        Alert.alert('测试失败', error.message);
      }
    } finally {
      setIsTestingApi(false);
    }
  };

  const saveVoiceSetting = async (enabled) => {
    try {
      setVoiceEnabled(enabled);
      await AsyncStorage.setItem(STORAGE_KEYS.VOICE_ENABLED, JSON.stringify(enabled));
    } catch (error) {
      console.error('保存语音设置失败:', error);
    }
  };

  const saveDataRetention = async () => {
    try {
      const days = parseInt(dataRetentionDays);
      if (isNaN(days) || days < 1) {
        if (Platform.OS === 'web') {
          window.alert('请输入有效的天数（大于0）');
        } else {
          Alert.alert('错误', '请输入有效的天数（大于0）');
        }
        return;
      }
      await AsyncStorage.setItem(STORAGE_KEYS.DATA_RETENTION_DAYS, dataRetentionDays);
      if (Platform.OS === 'web') {
        window.alert('数据保留设置已保存');
      } else {
        Alert.alert('成功', '数据保留设置已保存');
      }
    } catch (error) {
      console.error('保存数据保留设置失败:', error);
      if (Platform.OS === 'web') {
        window.alert('保存失败');
      } else {
        Alert.alert('错误', '保存失败');
      }
    }
  };

  const saveAutoBackupSetting = async (enabled) => {
    try {
      setAutoBackup(enabled);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTO_BACKUP, JSON.stringify(enabled));
      if (enabled) {
        // 如果启用自动备份，立即执行一次备份
        await performAutoBackup();
      }
    } catch (error) {
      console.error('保存自动备份设置失败:', error);
    }
  };

  const performAutoBackup = async () => {
    try {
      const result = await ExportService.exportAllData();
      if (result.success) {
        console.log('自动备份完成:', result.fileName);
      }
    } catch (error) {
      console.error('自动备份失败:', error);
    }
  };

  const loadExportedFiles = async () => {
    try {
      const files = await ExportService.getExportedFiles();
      setExportedFiles(files);
    } catch (error) {
      console.error('加载导出文件失败:', error);
    }
  };

  const deleteExportedFile = async (filePath, fileName) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`确定要删除文件 "${fileName}" 吗？`);
      if (confirmed) {
        try {
          await ExportService.deleteExportedFile(filePath);
          await loadExportedFiles();
          window.alert('文件已删除');
        } catch (error) {
          console.error('删除文件失败:', error);
          window.alert('删除失败');
        }
      }
    } else {
      Alert.alert(
        '确认删除',
        `确定要删除文件 "${fileName}" 吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '删除',
            style: 'destructive',
            onPress: async () => {
              try {
                await ExportService.deleteExportedFile(filePath);
                await loadExportedFiles();
                Alert.alert('成功', '文件已删除');
              } catch (error) {
                console.error('删除文件失败:', error);
                Alert.alert('错误', '删除失败');
              }
            }
          }
        ]
      );
    }
  };

  const clearAllData = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('确定要清空所有数据吗？此操作不可恢复！');
      if (confirmed) {
        try {
          // 这里需要实现清空所有表的功能
          const tables = ['personal_info', 'preferences', 'milestones', 'moods', 'thoughts', 'chat_history'];
          for (const table of tables) {
            const data = await DatabaseService.getTableData(table);
            for (const item of data) {
              await DatabaseService.deleteRecord(table, item.id);
            }
          }
          window.alert('所有数据已清空');
        } catch (error) {
          console.error('清空数据失败:', error);
          window.alert('清空失败');
        }
      }
    } else {
      Alert.alert(
        '危险操作',
        '确定要清空所有数据吗？此操作不可恢复！',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定清空',
            style: 'destructive',
            onPress: async () => {
              try {
                // 这里需要实现清空所有表的功能
                const tables = ['personal_info', 'preferences', 'milestones', 'moods', 'thoughts', 'chat_history'];
                for (const table of tables) {
                  const data = await DatabaseService.getTableData(table);
                  for (const item of data) {
                    await DatabaseService.deleteRecord(table, item.id);
                  }
                }
                Alert.alert('成功', '所有数据已清空');
              } catch (error) {
                console.error('清空数据失败:', error);
                Alert.alert('错误', '清空失败');
              }
            }
          }
        ]
      );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载设置中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>设置</Text>
        <Text style={styles.subtitle}>配置应用参数</Text>
      </View>

      {/* API设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API设置</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>DeepSeek API密钥</Text>
          <TextInput
            style={styles.textInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="输入你的API密钥"
            secureTextEntry
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={saveApiKey}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={testApiConnection}
              disabled={isTestingApi}
            >
              {isTestingApi ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.testButtonText}>测试连接</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 语音设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>语音设置</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.switchRow}>
            <Text style={styles.settingLabel}>启用语音播放</Text>
            <Switch
              value={voiceEnabled}
              onValueChange={saveVoiceSetting}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor={voiceEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          <Text style={styles.settingDescription}>
            开启后AI回复将自动播放语音
          </Text>
        </View>
      </View>

      {/* 数据管理 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据管理</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>聊天数据保留天数</Text>
          <TextInput
            style={styles.numberInput}
            value={dataRetentionDays}
            onChangeText={setDataRetentionDays}
            placeholder="30"
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.saveButton} onPress={saveDataRetention}>
            <Text style={styles.saveButtonText}>保存</Text>
          </TouchableOpacity>
          <Text style={styles.settingDescription}>
            超过指定天数的聊天记录将在与于渺对话时被过滤
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.switchRow}>
            <Text style={styles.settingLabel}>自动备份</Text>
            <Switch
              value={autoBackup}
              onValueChange={saveAutoBackupSetting}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor={autoBackup ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          <Text style={styles.settingDescription}>
            每次添加新数据时自动创建备份文件
          </Text>
        </View>
      </View>

      {/* 文件管理 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>文件管理</Text>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            loadExportedFiles();
            setFilesModalVisible(true);
          }}
        >
          <Ionicons name="folder-outline" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>查看导出文件</Text>
        </TouchableOpacity>
      </View>

      {/* 危险操作 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>危险操作</Text>
        
        <TouchableOpacity style={styles.dangerButton} onPress={clearAllData}>
          <Ionicons name="trash-outline" size={20} color="white" />
          <Text style={styles.dangerButtonText}>清空所有数据</Text>
        </TouchableOpacity>
      </View>

      {/* 关于应用 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于应用</Text>
        
        <View style={styles.aboutContainer}>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>版本</Text>
            <Text style={styles.aboutValue}>1.0 Beta</Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>制作人</Text>
            <Text style={styles.aboutValue}>于渺</Text>
          </View>
          
          <View style={styles.aboutItem}>
             <Text style={styles.aboutLabel}>发布时间</Text>
             <Text style={styles.aboutValue}>2025.08.12</Text>
           </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>应用简介</Text>
            <Text style={styles.aboutDescription}>心灵驿站 - 一个专注于个人成长与内心记录的智能日记应用，让每一个想法都有归宿，让每一份情感都被珍藏。</Text>
          </View>
        </View>
      </View>

      {/* 导出文件模态框 */}
      <Modal
        visible={filesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>导出文件</Text>
            <TouchableOpacity onPress={() => setFilesModalVisible(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filesList}>
            {exportedFiles.length > 0 ? (
              exportedFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{file.name}</Text>
                    <Text style={styles.fileDetails}>
                      {formatFileSize(file.size)} • {new Date(file.modificationTime).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.fileActions}>
                    <TouchableOpacity 
                      style={styles.shareFileButton}
                      onPress={() => ExportService.saveToPhoneStorage(file.path, file.name)}
                    >
                      <Ionicons name="download-outline" size={16} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteFileButton}
                      onPress={() => deleteExportedFile(file.path, file.name)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>暂无导出文件</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  numberInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    width: 100,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  filesList: {
    flex: 1,
    padding: 20,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 14,
    color: '#666666',
  },
  fileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareFileButton: {
    padding: 8,
  },
  deleteFileButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 16,
    marginTop: 40,
  },
  aboutContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  aboutItem: {
    marginBottom: 12,
  },
  aboutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  aboutValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  aboutDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});