import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 导入AI服务
import { setApiKey, getApiKey, testApiConnection } from '../services/aiService';

const SettingsScreen = () => {
  const [apiKey, setApiKeyState] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [shortcuts, setShortcuts] = useState({ diet: [], exercise: [] });
  const [editingShortcut, setEditingShortcut] = useState({ type: '', index: -1, name: '' });

  useEffect(() => {
    loadSettings();
    loadShortcuts();
  }, []);

  // 加载设置
  const loadSettings = async () => {
    try {
      const savedApiKey = await getApiKey();
      if (savedApiKey) {
        setApiKeyState(savedApiKey);
        setTempApiKey(savedApiKey);
      }
      
      // 加载其他设置
      const savedNotifications = await AsyncStorage.getItem('notifications');
      const savedAutoBackup = await AsyncStorage.getItem('autoBackup');
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      
      if (savedNotifications !== null) {
        setNotifications(JSON.parse(savedNotifications));
      }
      if (savedAutoBackup !== null) {
        setAutoBackup(JSON.parse(savedAutoBackup));
      }
      if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  // 保存API密钥
  const saveApiKey = async () => {
    if (!tempApiKey.trim()) {
      Alert.alert('错误', '请输入API密钥');
      return;
    }
    
    try {
      await setApiKey(tempApiKey.trim());
      setApiKeyState(tempApiKey.trim());
      setApiTestResult(null);
      Alert.alert('成功', 'API密钥已保存');
    } catch (error) {
      Alert.alert('错误', '保存API密钥失败: ' + error.message);
    }
  };

  // 测试API连接
  const testApi = async () => {
    if (!apiKey) {
      Alert.alert('错误', '请先设置API密钥');
      return;
    }
    
    setIsTestingApi(true);
    setApiTestResult(null);
    
    try {
      const result = await testApiConnection();
      setApiTestResult({
        success: true,
        message: 'API连接测试成功！',
        details: result
      });
    } catch (error) {
      setApiTestResult({
        success: false,
        message: 'API连接测试失败',
        details: error.message
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  // 清除API密钥
  const clearApiKey = () => {
    Alert.alert(
      '确认清除',
      '确定要清除API密钥吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('deepseek_api_key');
              setApiKeyState('');
              setTempApiKey('');
              setApiTestResult(null);
              Alert.alert('成功', 'API密钥已清除');
            } catch (error) {
              Alert.alert('错误', '清除API密钥失败: ' + error.message);
            }
          }
        }
      ]
    );
  };

  // 保存设置
  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  // 加载快捷记录
  const loadShortcuts = async () => {
    try {
      const storageKey = Platform.OS === 'web' ? 'shortcuts' : 'shortcuts';
      let savedShortcuts;
      
      if (Platform.OS === 'web') {
        const data = localStorage.getItem(storageKey);
        savedShortcuts = data ? JSON.parse(data) : { diet: [], exercise: [] };
      } else {
        const data = await AsyncStorage.getItem(storageKey);
        savedShortcuts = data ? JSON.parse(data) : { diet: [], exercise: [] };
      }
      
      setShortcuts(savedShortcuts);
    } catch (error) {
      console.error('加载快捷记录失败:', error);
    }
  };

  // 保存快捷记录
  const saveShortcuts = async (newShortcuts) => {
    try {
      const storageKey = 'shortcuts';
      
      if (Platform.OS === 'web') {
        localStorage.setItem(storageKey, JSON.stringify(newShortcuts));
      } else {
        await AsyncStorage.setItem(storageKey, JSON.stringify(newShortcuts));
      }
      
      setShortcuts(newShortcuts);
    } catch (error) {
      console.error('保存快捷记录失败:', error);
      Alert.alert('错误', '保存快捷记录失败');
    }
  };

  // 添加快捷记录
  const addShortcut = (type, name) => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入名称');
      return;
    }
    
    const newShortcuts = { ...shortcuts };
    if (newShortcuts[type].length >= 6) {
      Alert.alert('提示', '最多只能添加6个快捷记录');
      return;
    }
    
    newShortcuts[type].push(name.trim());
    saveShortcuts(newShortcuts);
    setEditingShortcut({ type: '', index: -1, name: '' });
  };

  // 编辑快捷记录
  const editShortcut = (type, index, newName) => {
    if (!newName.trim()) {
      Alert.alert('提示', '请输入名称');
      return;
    }
    
    const newShortcuts = { ...shortcuts };
    newShortcuts[type][index] = newName.trim();
    saveShortcuts(newShortcuts);
    setEditingShortcut({ type: '', index: -1, name: '' });
  };

  // 删除快捷记录
  const deleteShortcut = (type, index) => {
    Alert.alert(
      '删除快捷记录',
      '确定要删除这个快捷记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            const newShortcuts = { ...shortcuts };
            newShortcuts[type].splice(index, 1);
            saveShortcuts(newShortcuts);
          }
        }
      ]
    );
  };

  // 重置所有设置
  const resetAllSettings = () => {
    Alert.alert(
      '重置设置',
      '确定要重置所有设置吗？这将清除API密钥和所有偏好设置。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重置',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'deepseek_api_key',
                'notifications',
                'autoBackup',
                'darkMode',
                'shortcuts'
              ]);
              
              if (Platform.OS === 'web') {
                localStorage.removeItem('shortcuts');
              }
              
              setApiKeyState('');
              setTempApiKey('');
              setApiTestResult(null);
              setNotifications(true);
              setAutoBackup(false);
              setDarkMode(false);
              setShortcuts({ diet: [], exercise: [] });
              
              Alert.alert('成功', '所有设置已重置');
            } catch (error) {
              Alert.alert('错误', '重置设置失败: ' + error.message);
            }
          }
        }
      ]
    );
  };

  // 关于应用
  const showAbout = () => {
    Alert.alert(
      '关于饮食教练',
      '版本: 1.0.0\n\n这是一个AI驱动的饮食和运动记录应用，帮助您管理健康生活。\n\n开发者: AI助手\n技术栈: React Native + Expo',
      [{ text: '确定' }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* API设置部分 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API设置</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>DeepSeek API密钥</Text>
          <View style={styles.apiKeyContainer}>
            <TextInput
              style={styles.apiKeyInput}
              value={tempApiKey}
              onChangeText={setTempApiKey}
              placeholder="请输入API密钥"
              secureTextEntry={!isApiKeyVisible}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.visibilityButton}
              onPress={() => setIsApiKeyVisible(!isApiKeyVisible)}
            >
              <Ionicons 
                name={isApiKeyVisible ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color="#8E8E93" 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.apiKeyActions}>
            <TouchableOpacity style={styles.saveButton} onPress={saveApiKey}>
              <Ionicons name="save-outline" size={16} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.clearButton} onPress={clearApiKey}>
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              <Text style={styles.clearButtonText}>清除</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.settingItem}>
          <TouchableOpacity 
            style={[styles.testButton, isTestingApi && styles.testButtonDisabled]} 
            onPress={testApi}
            disabled={isTestingApi}
          >
            {isTestingApi ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.testButtonText}>
              {isTestingApi ? '测试中...' : '测试API连接'}
            </Text>
          </TouchableOpacity>
          
          {apiTestResult && (
            <View style={[
              styles.testResult,
              apiTestResult.success ? styles.testResultSuccess : styles.testResultError
            ]}>
              <Ionicons 
                name={apiTestResult.success ? 'checkmark-circle' : 'close-circle'} 
                size={16} 
                color={apiTestResult.success ? '#34C759' : '#FF3B30'} 
              />
              <Text style={[
                styles.testResultText,
                apiTestResult.success ? styles.testResultTextSuccess : styles.testResultTextError
              ]}>
                {apiTestResult.message}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 快捷记录设置部分 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快捷记录设置</Text>
        
        {/* 饮食快捷记录 */}
        <View style={styles.settingItem}>
          <Text style={styles.shortcutSectionTitle}>常用食物</Text>
          <Text style={styles.shortcutDescription}>设置首页快捷记录的食物项目（最多6个）</Text>
          
          {shortcuts.diet.map((item, index) => (
            <View key={index} style={styles.shortcutItem}>
              {editingShortcut.type === 'diet' && editingShortcut.index === index ? (
                <View style={styles.shortcutEditRow}>
                  <TextInput
                    style={styles.shortcutInput}
                    value={editingShortcut.name}
                    onChangeText={(text) => setEditingShortcut({...editingShortcut, name: text})}
                    placeholder="输入食物名称"
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.shortcutActionButton}
                    onPress={() => editShortcut('diet', index, editingShortcut.name)}
                  >
                    <Ionicons name="checkmark" size={20} color="#34C759" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shortcutActionButton}
                    onPress={() => setEditingShortcut({ type: '', index: -1, name: '' })}
                  >
                    <Ionicons name="close" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.shortcutRow}>
                  <Text style={styles.shortcutText}>{item}</Text>
                  <View style={styles.shortcutActions}>
                    <TouchableOpacity
                      style={styles.shortcutActionButton}
                      onPress={() => setEditingShortcut({ type: 'diet', index, name: item })}
                    >
                      <Ionicons name="pencil" size={16} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.shortcutActionButton}
                      onPress={() => deleteShortcut('diet', index)}
                    >
                      <Ionicons name="trash" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
          
          {editingShortcut.type === 'diet' && editingShortcut.index === -1 ? (
            <View style={styles.shortcutEditRow}>
              <TextInput
                style={styles.shortcutInput}
                value={editingShortcut.name}
                onChangeText={(text) => setEditingShortcut({...editingShortcut, name: text})}
                placeholder="输入食物名称"
                autoFocus
              />
              <TouchableOpacity
                style={styles.shortcutActionButton}
                onPress={() => addShortcut('diet', editingShortcut.name)}
              >
                <Ionicons name="checkmark" size={20} color="#34C759" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutActionButton}
                onPress={() => setEditingShortcut({ type: '', index: -1, name: '' })}
              >
                <Ionicons name="close" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ) : (
            shortcuts.diet.length < 6 && (
              <TouchableOpacity
                style={styles.addShortcutButton}
                onPress={() => setEditingShortcut({ type: 'diet', index: -1, name: '' })}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addShortcutText}>添加食物</Text>
              </TouchableOpacity>
            )
          )}
        </View>
        
        {/* 运动快捷记录 */}
        <View style={styles.settingItem}>
          <Text style={styles.shortcutSectionTitle}>常用运动</Text>
          <Text style={styles.shortcutDescription}>设置首页快捷记录的运动项目（最多6个）</Text>
          
          {shortcuts.exercise.map((item, index) => (
            <View key={index} style={styles.shortcutItem}>
              {editingShortcut.type === 'exercise' && editingShortcut.index === index ? (
                <View style={styles.shortcutEditRow}>
                  <TextInput
                    style={styles.shortcutInput}
                    value={editingShortcut.name}
                    onChangeText={(text) => setEditingShortcut({...editingShortcut, name: text})}
                    placeholder="输入运动名称"
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.shortcutActionButton}
                    onPress={() => editShortcut('exercise', index, editingShortcut.name)}
                  >
                    <Ionicons name="checkmark" size={20} color="#34C759" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shortcutActionButton}
                    onPress={() => setEditingShortcut({ type: '', index: -1, name: '' })}
                  >
                    <Ionicons name="close" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.shortcutRow}>
                  <Text style={styles.shortcutText}>{item}</Text>
                  <View style={styles.shortcutActions}>
                    <TouchableOpacity
                      style={styles.shortcutActionButton}
                      onPress={() => setEditingShortcut({ type: 'exercise', index, name: item })}
                    >
                      <Ionicons name="pencil" size={16} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.shortcutActionButton}
                      onPress={() => deleteShortcut('exercise', index)}
                    >
                      <Ionicons name="trash" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
          
          {editingShortcut.type === 'exercise' && editingShortcut.index === -1 ? (
            <View style={styles.shortcutEditRow}>
              <TextInput
                style={styles.shortcutInput}
                value={editingShortcut.name}
                onChangeText={(text) => setEditingShortcut({...editingShortcut, name: text})}
                placeholder="输入运动名称"
                autoFocus
              />
              <TouchableOpacity
                style={styles.shortcutActionButton}
                onPress={() => addShortcut('exercise', editingShortcut.name)}
              >
                <Ionicons name="checkmark" size={20} color="#34C759" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutActionButton}
                onPress={() => setEditingShortcut({ type: '', index: -1, name: '' })}
              >
                <Ionicons name="close" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ) : (
            shortcuts.exercise.length < 6 && (
              <TouchableOpacity
                style={styles.addShortcutButton}
                onPress={() => setEditingShortcut({ type: 'exercise', index: -1, name: '' })}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addShortcutText}>添加运动</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* 应用设置部分 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>应用设置</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>推送通知</Text>
              <Text style={styles.settingDescription}>接收饮食提醒和建议</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={(value) => {
                setNotifications(value);
                saveSetting('notifications', value);
              }}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>自动备份</Text>
              <Text style={styles.settingDescription}>定期备份数据到本地</Text>
            </View>
            <Switch
              value={autoBackup}
              onValueChange={(value) => {
                setAutoBackup(value);
                saveSetting('autoBackup', value);
              }}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>深色模式</Text>
              <Text style={styles.settingDescription}>使用深色主题（即将推出）</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={(value) => {
                setDarkMode(value);
                saveSetting('darkMode', value);
              }}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#FFFFFF"
              disabled={true}
            />
          </View>
        </View>
      </View>

      {/* 其他设置部分 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>其他</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={showAbout}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>关于应用</Text>
              <Text style={styles.settingDescription}>版本信息和开发者信息</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={resetAllSettings}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, styles.dangerText]}>重置所有设置</Text>
              <Text style={styles.settingDescription}>清除所有设置和API密钥</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 底部间距 */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  dangerText: {
    color: '#FF3B30',
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  apiKeyInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  visibilityButton: {
    padding: 12,
  },
  apiKeyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  testButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  testResultSuccess: {
    backgroundColor: '#E8F5E8',
  },
  testResultError: {
    backgroundColor: '#FFE8E8',
  },
  testResultText: {
    fontSize: 14,
    fontWeight: '500',
  },
  testResultTextSuccess: {
    color: '#34C759',
  },
  testResultTextError: {
    color: '#FF3B30',
  },
  bottomSpacing: {
    height: 40,
  },
  shortcutSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  shortcutDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  shortcutItem: {
    marginBottom: 8,
  },
  shortcutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  shortcutText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  shortcutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  shortcutActionButton: {
    padding: 8,
  },
  shortcutEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  shortcutInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    fontSize: 16,
    color: '#000000',
  },
  addShortcutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  addShortcutText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default SettingsScreen;