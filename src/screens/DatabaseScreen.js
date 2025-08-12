import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from '../services/DatabaseService';
import ExportService from '../services/ExportService';

const TABLE_CONFIGS = {
  personal_info: {
    name: '个人基础信息',
    icon: 'person-outline',
    color: '#007AFF',
    description: '基本信息、健康状况等'
  },
  preferences: {
    name: '喜好记录',
    icon: 'heart-outline',
    color: '#FF3B30',
    description: '喜欢和不喜欢的事物'
  },
  milestones: {
    name: '里程碑',
    icon: 'flag-outline',
    color: '#FF9500',
    description: '目标和成就记录'
  },
  moods: {
    name: '心情记录',
    icon: 'happy-outline',
    color: '#34C759',
    description: '每日心情和情绪状态'
  },
  thoughts: {
    name: '想法记录',
    icon: 'bulb-outline',
    color: '#AF52DE',
    description: '创意想法和灵感'
  },
  food_records: {
    name: '饮食记录',
    icon: 'restaurant-outline',
    color: '#FF6B35',
    description: '饮食习惯和营养记录'
  },
  chat_history: {
    name: '聊天记录',
    icon: 'chatbubble-outline',
    color: '#5AC8FA',
    description: '与AI助手的对话记录'
  }
};

export default function DatabaseScreen() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [tableCounts, setTableCounts] = useState({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [isAddMode, setIsAddMode] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [movingItem, setMovingItem] = useState(null);

  useEffect(() => {
    loadTableCounts();
    
    // 监听localStorage变化，自动刷新表统计
    const handleStorageChange = () => {
      console.log('🔄 检测到localStorage变化，刷新表统计...');
      loadTableCounts();
    };
    
    // 添加storage事件监听器
    window.addEventListener('storage', handleStorageChange);
    
    // 添加自定义事件监听器（用于同一页面内的localStorage变化）
    window.addEventListener('localStorageUpdate', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleStorageChange);
    };
  }, []);

  const loadTableCounts = async () => {
    try {
      const counts = {};
      console.log('🔍 开始加载表统计...');
      for (const tableName of Object.keys(TABLE_CONFIGS)) {
        const data = await DatabaseService.getTableData(tableName);
        counts[tableName] = data.length;
        console.log(`📊 ${tableName}: ${data.length} 条记录`, data.slice(0, 2)); // 显示前2条记录用于调试
      }
      setTableCounts(counts);
      console.log('✅ 表统计加载完成:', counts);
    } catch (error) {
      console.error('❌ 加载表统计失败:', error);
    }
  };

  const loadTableData = async (tableName) => {
    setIsLoading(true);
    try {
      const data = await DatabaseService.getTableData(tableName);
      setTableData(data);
      setSelectedTable(tableName);
      setModalVisible(true);
    } catch (error) {
      console.error('加载表数据失败:', error);
      Alert.alert('错误', '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTableCounts();
    if (selectedTable) {
      await loadTableData(selectedTable);
    }
    setRefreshing(false);
  };

  const exportTable = async (tableName) => {
    setExportLoading(true);
    try {
      let result;
      switch (tableName) {
        case 'personal_info':
          result = await ExportService.exportPersonalInfo();
          break;
        case 'preferences':
          result = await ExportService.exportPreferences();
          break;
        case 'milestones':
          result = await ExportService.exportMilestones();
          break;
        case 'moods':
          result = await ExportService.exportMoods();
          break;
        case 'thoughts':
          result = await ExportService.exportThoughts();
          break;
        case 'chat_history':
          result = await ExportService.exportChatHistory();
          break;
        default:
          throw new Error('未知的表名');
      }

      if (result.success) {
        if (Platform.OS === 'web') {
          window.alert(`导出成功！文件已保存: ${result.fileName}`);
        } else {
          Alert.alert(
            '导出成功',
            `文件已导出: ${result.fileName}`,
            [
              { text: '确定' },
              {
                text: '保存到手机',
                onPress: () => ExportService.saveToPhoneStorage(result.filePath, result.fileName)
              }
            ]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert('导出失败: ' + result.error);
        } else {
          Alert.alert('导出失败', result.error);
        }
      }
    } catch (error) {
      console.error('导出失败:', error);
      if (Platform.OS === 'web') {
        window.alert('导出失败: ' + error.message);
      } else {
        Alert.alert('导出失败', error.message);
      }
    } finally {
      setExportLoading(false);
    }
  };

  const exportAllData = async () => {
    setExportLoading(true);
    try {
      const result = await ExportService.exportAllData();
      if (result.success) {
        if (Platform.OS === 'web') {
          window.alert(`导出成功！完整数据已保存: ${result.fileName}`);
        } else {
          Alert.alert(
            '导出成功',
            `完整数据已导出: ${result.fileName}`,
            [
              { text: '确定' },
              {
                text: '保存到手机',
                onPress: () => ExportService.saveToPhoneStorage(result.filePath, result.fileName)
              }
            ]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert('导出失败: ' + result.error);
        } else {
          Alert.alert('导出失败', result.error);
        }
      }
    } catch (error) {
      console.error('导出失败:', error);
      if (Platform.OS === 'web') {
        window.alert('导出失败: ' + error.message);
      } else {
        Alert.alert('导出失败', error.message);
      }
    } finally {
      setExportLoading(false);
    }
  };

  const showPreferenceInfo = () => {
    const message = '关于偏好记录的智能管理机制：\n\n' +
      '📝 记录方式：\n' +
      '• 支持记录对任何事物的喜好程度（喜欢/不喜欢/中性）\n' +
      '• 可以添加详细的备注说明，记录喜好的原因\n' +
      '• 支持强度等级设置，精确表达喜好程度\n\n' +
      '🔍 智能去重机制：\n' +
      '• 系统会自动检测同一项目的矛盾偏好记录\n' +
      '• 例如：同时存在"喜欢西兰花"和"不喜欢西兰花"\n' +
      '• 智能识别相似表述，如"苹果"和"红苹果"\n\n' +
      '⏰ 时间优先原则：\n' +
      '• 当发现矛盾偏好时，系统保留最新的记录\n' +
      '• 自动删除过时的矛盾记录，保持数据一致性\n' +
      '• 支持手动编辑和更新偏好强度\n\n' +
      '🔄 自动维护：\n' +
      '• 每次启动应用时自动清理矛盾记录\n' +
      '• 定期整理和优化数据库结构\n' +
      '• 保证查询效率和数据准确性\n\n' +
      '📊 数据分析：\n' +
      '• 支持按分类查看偏好分布\n' +
      '• 可以导出完整的偏好数据进行分析\n' +
      '• 帮助了解个人喜好变化趋势\n\n' +
      '🎯 应用场景：\n' +
      '• 饮食偏好：记录喜欢的菜品、食材、口味\n' +
      '• 娱乐偏好：电影、音乐、书籍、游戏等\n' +
      '• 生活偏好：颜色、风格、品牌、活动等\n' +
      '• 工作偏好：工具、方法、环境、时间等\n\n' +
      '💡 设计理念：\n' +
      '通过智能化的偏好管理，帮助您更好地了解自己，\n' +
      '为AI助手提供准确的个性化服务基础，\n' +
      '让每一次交互都更贴合您的真实需求。';
    
    if (Platform.OS === 'web') {
      window.alert('偏好记录详细说明\n\n' + message);
    } else {
      Alert.alert(
        '偏好记录详细说明',
        message,
        [{ text: '了解了', style: 'default' }]
      );
    }
  };

  const deleteRecord = async (id) => {
    console.log(`[DEBUG] deleteRecord函数被调用: ID=${id}, 类型=${typeof id}`);
    
    try {
      if (Platform.OS === 'web') {
        // Web环境使用原生confirm对话框
        const confirmed = window.confirm('删除后不可恢复，确定要删除这条记录吗？');
        console.log(`[DEBUG] Web确认对话框结果: ${confirmed}`);
        
        if (confirmed) {
          try {
            console.log(`[DEBUG] 用户确认删除: 表=${selectedTable}, ID=${id}`);
            const result = await DatabaseService.deleteRecord(selectedTable, id);
            console.log(`[DEBUG] 删除操作返回结果:`, result);
            
            if (result && result.success) {
              await loadTableData(selectedTable);
              await loadTableCounts();
              window.alert(`记录已删除 (删除了 ${result.deletedCount} 条记录)`);
            } else {
              console.error('[ERROR] 删除失败，返回结果:', result);
              window.alert(result?.error || '删除失败');
            }
          } catch (error) {
            console.error('[ERROR] 删除操作异常:', error);
            window.alert('删除失败: ' + error.message);
          }
        } else {
          console.log('[DEBUG] 用户取消删除');
        }
      } else {
        // 移动端使用React Native Alert
        Alert.alert(
          '确认删除',
          '删除后不可恢复，确定要删除这条记录吗？',
          [
            { 
              text: '取消', 
              style: 'cancel',
              onPress: () => console.log('[DEBUG] 用户取消删除')
            },
            {
              text: '删除',
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log(`[DEBUG] 用户确认删除: 表=${selectedTable}, ID=${id}`);
                  const result = await DatabaseService.deleteRecord(selectedTable, id);
                  console.log(`[DEBUG] 删除操作返回结果:`, result);
                  
                  if (result && result.success) {
                    await loadTableData(selectedTable);
                    await loadTableCounts();
                    Alert.alert('成功', `记录已删除 (删除了 ${result.deletedCount} 条记录)`);
                  } else {
                    console.error('[ERROR] 删除失败，返回结果:', result);
                    Alert.alert('错误', result?.error || '删除失败');
                  }
                } catch (error) {
                  console.error('[ERROR] 删除操作异常:', error);
                  Alert.alert('错误', '删除失败: ' + error.message);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('[ERROR] 删除确认对话框调用失败:', error);
    }
  };

  const openAddModal = () => {
    setIsAddMode(true);
    setEditingItem(null);
    setFormData(getEmptyFormData(selectedTable));
    setEditModalVisible(true);
  };

  const openEditModal = (item) => {
    setIsAddMode(false);
    setEditingItem(item);
    setFormData(getFormDataFromItem(selectedTable, item));
    setEditModalVisible(true);
  };

  const getEmptyFormData = (tableName) => {
    switch (tableName) {
      case 'personal_info':
        return { 
          name: '', 
          age: '', 
          gender: '', 
          occupation: '', 
          health_status: '', 
          chronic_diseases: '', 
          medical_history: '', 
          family_medical_history: '', 
          height: '', 
          weight: '', 
          bmi: '', 
          blood_pressure: '', 
          heart_rate: '', 
          blood_sugar: '', 
          blood_type: '', 
          vision: '', 
          hearing: '', 
          allergies: '', 
          medications: '', 
          supplements: '', 
          exercise_habits: '', 
          sleep_pattern: '', 
          smoking_status: '', 
          drinking_habits: '', 
          diet_restrictions: '', 
          mental_health: '', 
          stress_level: '', 
          education: '', 
          relationship_status: '', 
          family_info: '', 
          contact_info: '', 
          emergency_contact: '', 
          insurance_info: '', 
          doctor_info: '' 
        };
      case 'preferences':
        return { category: '', item: '', preference_type: 'like', intensity: '5' };
      case 'milestones':
        return { title: '', status: '', category: '', priority: '' };
      case 'moods':
        return { mood_score: '5', mood_type: '', description: '', date: new Date().toISOString().split('T')[0] };
      case 'thoughts':
        return { title: '', category: '', tags: '', content: '', is_favorite: false };
      case 'food_records':
        return { food_name: '', quantity: '', meal_time: '', calories: '', taste_rating: '5', location: '', mood: '' };
      default:
        return {};
    }
  };

  const getFormDataFromItem = (tableName, item) => {
    const parsedItem = parseItemData(item, tableName);
    switch (tableName) {
      case 'personal_info':
        return {
          name: parsedItem.name || '',
          age: parsedItem.age || '',
          gender: parsedItem.gender || '',
          occupation: parsedItem.occupation || '',
          health_status: parsedItem.health_status || '',
          chronic_diseases: parsedItem.chronic_diseases || '',
          medical_history: parsedItem.medical_history || '',
          family_medical_history: parsedItem.family_medical_history || '',
          height: parsedItem.height || '',
          weight: parsedItem.weight || '',
          bmi: parsedItem.bmi || '',
          blood_pressure: parsedItem.blood_pressure || '',
          heart_rate: parsedItem.heart_rate || '',
          blood_sugar: parsedItem.blood_sugar || '',
          blood_type: parsedItem.blood_type || '',
          vision: parsedItem.vision || '',
          hearing: parsedItem.hearing || '',
          allergies: parsedItem.allergies || '',
          medications: parsedItem.medications || '',
          supplements: parsedItem.supplements || '',
          exercise_habits: parsedItem.exercise_habits || '',
          sleep_pattern: parsedItem.sleep_pattern || '',
          smoking_status: parsedItem.smoking_status || '',
          drinking_habits: parsedItem.drinking_habits || '',
          diet_restrictions: parsedItem.diet_restrictions || '',
          mental_health: parsedItem.mental_health || '',
          stress_level: parsedItem.stress_level || '',
          education: parsedItem.education || '',
          relationship_status: parsedItem.relationship_status || '',
          family_info: parsedItem.family_info || '',
          contact_info: parsedItem.contact_info || '',
          emergency_contact: parsedItem.emergency_contact || '',
          insurance_info: parsedItem.insurance_info || '',
          doctor_info: parsedItem.doctor_info || ''
        };
      case 'preferences':
        return {
          category: parsedItem.category || '',
          item: parsedItem.item || '',
          preference_type: parsedItem.preference_type || 'like',
          intensity: parsedItem.intensity?.toString() || '5'
        };
      case 'milestones':
        return {
          title: parsedItem.title || '',
          status: parsedItem.status || '',
          category: parsedItem.category || '',
          priority: parsedItem.priority || ''
        };
      case 'moods':
        return {
          mood_score: parsedItem.mood_score?.toString() || '5',
          mood_type: parsedItem.mood_type || '',
          description: parsedItem.description || '',
          date: parsedItem.date || new Date().toISOString().split('T')[0]
        };
      case 'thoughts':
        return {
          title: parsedItem.title || '',
          category: parsedItem.category || '',
          tags: parsedItem.tags || '',
          content: parsedItem.content || '',
          is_favorite: parsedItem.is_favorite || false
        };
      case 'food_records':
        return {
          food_name: parsedItem.food_name || '',
          quantity: parsedItem.quantity || '',
          meal_time: parsedItem.meal_time || '',
          calories: parsedItem.calories?.toString() || '',
          taste_rating: parsedItem.taste_rating?.toString() || '5',
          location: parsedItem.location || '',
          mood: parsedItem.mood || ''
        };
      default:
        return {};
    }
  };

  const saveRecord = async () => {
    try {
      if (isAddMode) {
        await DatabaseService.insertData(selectedTable, formData);
        Alert.alert('成功', '记录已添加');
      } else {
        await DatabaseService.updateData(selectedTable, editingItem.id, formData);
        Alert.alert('成功', '记录已更新');
      }
      setEditModalVisible(false);
      await loadTableData(selectedTable);
      await loadTableCounts();
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('错误', '保存失败');
    }
  };

  const openMoveModal = (item) => {
    setMovingItem(item);
    setMoveModalVisible(true);
  };

  const moveDataToTable = async (targetTable) => {
    if (!movingItem || !selectedTable || targetTable === selectedTable) {
      Alert.alert('错误', '无效的移动操作');
      return;
    }

    try {
      // 根据目标表转换数据格式
      const transformedContent = transformDataForTable(movingItem, selectedTable, targetTable);
      
      await DatabaseService.moveData(selectedTable, targetTable, movingItem.id, transformedContent);
      
      setMoveModalVisible(false);
      setMovingItem(null);
      await loadTableData(selectedTable);
      await loadTableCounts();
      
      Alert.alert('成功', `数据已移动到${TABLE_CONFIGS[targetTable].name}`);
    } catch (error) {
      console.error('移动数据失败:', error);
      Alert.alert('错误', '移动数据失败');
    }
  };

  // 解析content字段中的JSON数据
  const parseItemData = (item, tableName = selectedTable) => {
    // 如果是chat_history表，直接使用原始数据
    if (tableName === 'chat_history') {
      return item;
    }
    
    // 首先使用具体的列数据
    let result = { ...item };
    
    // 如果具体列数据不存在或为空，则尝试从content字段解析
    const hasSpecificData = tableName === 'personal_info' ? 
      (item.name || item.age || item.gender || item.occupation) :
      tableName === 'preferences' ?
      (item.item || item.category || item.preference_type) :
      tableName === 'milestones' ?
      (item.title || item.description || item.status) :
      tableName === 'moods' ?
      (item.mood_score || item.description || item.energy_level) :
      tableName === 'thoughts' ?
      (item.title || item.content || item.category) :
      tableName === 'food_records' ?
      (item.food_name || item.meal_type || item.calories) :
      false;
    
    // 如果没有具体数据，尝试解析content字段
    if (!hasSpecificData && item.content) {
      try {
        let parsedData = {};
        if (typeof item.content === 'string') {
          parsedData = JSON.parse(item.content);
        } else {
          parsedData = item.content;
        }
        // 只有在解析成功且有有效数据时才合并
        if (parsedData && typeof parsedData === 'object') {
          result = { ...result, ...parsedData };
        }
      } catch (error) {
        console.log('解析content失败:', error);
        // 保持原始数据不变
      }
    }
    
    return result;
  };

  const transformDataForTable = (item, fromTable, toTable) => {
    const parsedItem = parseItemData(item, fromTable);
    
    // 基础字段映射
    const baseTransform = {
      created_at: new Date().toISOString()
    };

    // 根据目标表类型进行数据转换
    switch (toTable) {
      case 'thoughts':
        return {
          ...baseTransform,
          title: parsedItem.title || parsedItem.item || parsedItem.food_name || '未命名想法',
          content: parsedItem.content || parsedItem.description || JSON.stringify(parsedItem),
          category: parsedItem.category || '其他',
          tags: parsedItem.tags || '',
          is_favorite: parsedItem.is_favorite || false
        };
      
      case 'personal_info':
        return {
          ...baseTransform,
          name: parsedItem.name || '',
          age: parsedItem.age || '',
          gender: parsedItem.gender || '',
          occupation: parsedItem.occupation || ''
        };
      
      case 'preferences':
        return {
          ...baseTransform,
          category: parsedItem.category || '其他',
          item: parsedItem.item || parsedItem.title || parsedItem.food_name || '未知项目',
          preference_type: parsedItem.preference_type || 'like',
          intensity: parsedItem.intensity || 5
        };
      
      case 'milestones':
        return {
          ...baseTransform,
          title: parsedItem.title || parsedItem.item || '未命名里程碑',
          status: parsedItem.status || 'planned',
          category: parsedItem.category || '其他',
          priority: parsedItem.priority || 3
        };
      
      case 'moods':
        return {
          ...baseTransform,
          mood_score: parsedItem.mood_score || parsedItem.taste_rating || 5,
          mood_type: parsedItem.mood_type || parsedItem.mood || '一般',
          description: parsedItem.description || parsedItem.content || '',
          date: parsedItem.date || new Date().toISOString().split('T')[0]
        };
      
      case 'food_records':
        return {
          ...baseTransform,
          food_name: parsedItem.food_name || parsedItem.item || parsedItem.title || '未知食物',
          quantity: parsedItem.quantity || '',
          meal_time: parsedItem.meal_time || '',
          calories: parsedItem.calories || '',
          taste_rating: parsedItem.taste_rating || parsedItem.mood_score || 5,
          location: parsedItem.location || '',
          mood: parsedItem.mood || parsedItem.mood_type || ''
        };
      
      default:
        return {
          ...baseTransform,
          content: JSON.stringify(parsedItem)
        };
    }
  };

  const renderFormFields = () => {
    if (!selectedTable) return null;

    const updateFormData = (key, value) => {
      setFormData(prev => ({ ...prev, [key]: value }));
    };

    switch (selectedTable) {
      case 'personal_info':
        return (
          <ScrollView style={styles.formContainer}>
            <Text style={styles.sectionTitle}>基本信息</Text>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>姓名</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name || ''}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="请输入姓名"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>年龄</Text>
              <TextInput
                style={styles.textInput}
                value={formData.age || ''}
                onChangeText={(value) => updateFormData('age', value)}
                placeholder="请输入年龄"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>性别</Text>
              <TextInput
                style={styles.textInput}
                value={formData.gender || ''}
                onChangeText={(value) => updateFormData('gender', value)}
                placeholder="请输入性别"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>职业</Text>
              <TextInput
                style={styles.textInput}
                value={formData.occupation || ''}
                onChangeText={(value) => updateFormData('occupation', value)}
                placeholder="请输入职业"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>教育背景</Text>
              <TextInput
                style={styles.textInput}
                value={formData.education || ''}
                onChangeText={(value) => updateFormData('education', value)}
                placeholder="请输入教育背景"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>感情状况</Text>
              <TextInput
                style={styles.textInput}
                value={formData.relationship_status || ''}
                onChangeText={(value) => updateFormData('relationship_status', value)}
                placeholder="请输入感情状况"
              />
            </View>
            
            <Text style={styles.sectionTitle}>健康信息</Text>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>健康状况</Text>
              <TextInput
                style={styles.textInput}
                value={formData.health_status || ''}
                onChangeText={(value) => updateFormData('health_status', value)}
                placeholder="请输入整体健康状况"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>身高 (cm)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.height || ''}
                onChangeText={(value) => updateFormData('height', value)}
                placeholder="请输入身高"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>体重 (kg)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.weight || ''}
                onChangeText={(value) => updateFormData('weight', value)}
                placeholder="请输入体重"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>BMI</Text>
              <TextInput
                style={styles.textInput}
                value={formData.bmi || ''}
                onChangeText={(value) => updateFormData('bmi', value)}
                placeholder="请输入BMI指数"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>血压</Text>
              <TextInput
                style={styles.textInput}
                value={formData.blood_pressure || ''}
                onChangeText={(value) => updateFormData('blood_pressure', value)}
                placeholder="如：120/80"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>心率 (次/分钟)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.heart_rate || ''}
                onChangeText={(value) => updateFormData('heart_rate', value)}
                placeholder="请输入心率"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>血糖</Text>
              <TextInput
                style={styles.textInput}
                value={formData.blood_sugar || ''}
                onChangeText={(value) => updateFormData('blood_sugar', value)}
                placeholder="请输入血糖水平"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>血型</Text>
              <TextInput
                style={styles.textInput}
                value={formData.blood_type || ''}
                onChangeText={(value) => updateFormData('blood_type', value)}
                placeholder="如：A型、B型、AB型、O型"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>视力状况</Text>
              <TextInput
                style={styles.textInput}
                value={formData.vision || ''}
                onChangeText={(value) => updateFormData('vision', value)}
                placeholder="请输入视力状况"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>听力状况</Text>
              <TextInput
                style={styles.textInput}
                value={formData.hearing || ''}
                onChangeText={(value) => updateFormData('hearing', value)}
                placeholder="请输入听力状况"
              />
            </View>
            
            <Text style={styles.sectionTitle}>医疗信息</Text>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>慢性疾病</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.chronic_diseases || ''}
                onChangeText={(value) => updateFormData('chronic_diseases', value)}
                placeholder="请输入慢性疾病信息"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>既往病史</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.medical_history || ''}
                onChangeText={(value) => updateFormData('medical_history', value)}
                placeholder="请输入既往病史和手术史"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>家族病史</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.family_medical_history || ''}
                onChangeText={(value) => updateFormData('family_medical_history', value)}
                placeholder="请输入家族病史"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>过敏信息</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.allergies || ''}
                onChangeText={(value) => updateFormData('allergies', value)}
                placeholder="请输入过敏信息"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>用药信息</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.medications || ''}
                onChangeText={(value) => updateFormData('medications', value)}
                placeholder="请输入正在服用的药物"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>保健品</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.supplements || ''}
                onChangeText={(value) => updateFormData('supplements', value)}
                placeholder="请输入正在服用的保健品"
                multiline
              />
            </View>
            
            <Text style={styles.sectionTitle}>生活习惯</Text>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>运动习惯</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.exercise_habits || ''}
                onChangeText={(value) => updateFormData('exercise_habits', value)}
                placeholder="请输入运动习惯"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>睡眠模式</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.sleep_pattern || ''}
                onChangeText={(value) => updateFormData('sleep_pattern', value)}
                placeholder="请输入睡眠模式"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>吸烟状况</Text>
              <TextInput
                style={styles.textInput}
                value={formData.smoking_status || ''}
                onChangeText={(value) => updateFormData('smoking_status', value)}
                placeholder="如：不吸烟、偶尔吸烟、经常吸烟"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>饮酒习惯</Text>
              <TextInput
                style={styles.textInput}
                value={formData.drinking_habits || ''}
                onChangeText={(value) => updateFormData('drinking_habits', value)}
                placeholder="请输入饮酒习惯"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>饮食限制</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.diet_restrictions || ''}
                onChangeText={(value) => updateFormData('diet_restrictions', value)}
                placeholder="请输入饮食限制或特殊饮食"
                multiline
              />
            </View>
            
            <Text style={styles.sectionTitle}>心理健康</Text>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>心理健康状况</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.mental_health || ''}
                onChangeText={(value) => updateFormData('mental_health', value)}
                placeholder="请输入心理健康状况"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>压力水平</Text>
              <TextInput
                style={styles.textInput}
                value={formData.stress_level || ''}
                onChangeText={(value) => updateFormData('stress_level', value)}
                placeholder="如：低、中、高"
              />
            </View>
            
            <Text style={styles.sectionTitle}>联系信息</Text>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>家庭信息</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.family_info || ''}
                onChangeText={(value) => updateFormData('family_info', value)}
                placeholder="请输入家庭成员信息"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>联系方式</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.contact_info || ''}
                onChangeText={(value) => updateFormData('contact_info', value)}
                placeholder="请输入联系方式"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>紧急联系人</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.emergency_contact || ''}
                onChangeText={(value) => updateFormData('emergency_contact', value)}
                placeholder="请输入紧急联系人信息"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>保险信息</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.insurance_info || ''}
                onChangeText={(value) => updateFormData('insurance_info', value)}
                placeholder="请输入保险信息"
                multiline
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>医生信息</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.doctor_info || ''}
                onChangeText={(value) => updateFormData('doctor_info', value)}
                placeholder="请输入主治医生或常去医院信息"
                multiline
              />
            </View>
          </ScrollView>
        );

      case 'preferences':
        return (
          <View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>分类</Text>
              <TextInput
                style={styles.textInput}
                value={formData.category || ''}
                onChangeText={(value) => updateFormData('category', value)}
                placeholder="请输入分类（如：食物、音乐）"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>项目</Text>
              <TextInput
                style={styles.textInput}
                value={formData.item || ''}
                onChangeText={(value) => updateFormData('item', value)}
                placeholder="请输入具体项目"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>偏好类型</Text>
              <View style={styles.preferenceButtons}>
                <TouchableOpacity
                  style={[styles.preferenceButton, formData.preference_type === 'like' && styles.preferenceButtonActive]}
                  onPress={() => updateFormData('preference_type', 'like')}
                >
                  <Text style={[styles.preferenceButtonText, formData.preference_type === 'like' && styles.preferenceButtonTextActive]}>喜欢</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.preferenceButton, formData.preference_type === 'dislike' && styles.preferenceButtonActive]}
                  onPress={() => updateFormData('preference_type', 'dislike')}
                >
                  <Text style={[styles.preferenceButtonText, formData.preference_type === 'dislike' && styles.preferenceButtonTextActive]}>不喜欢</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>强度 (1-10)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.intensity || ''}
                onChangeText={(value) => updateFormData('intensity', value)}
                placeholder="1-10"
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      case 'milestones':
        return (
          <View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>标题</Text>
              <TextInput
                style={styles.textInput}
                value={formData.title || ''}
                onChangeText={(value) => updateFormData('title', value)}
                placeholder="请输入里程碑标题"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>状态</Text>
              <TextInput
                style={styles.textInput}
                value={formData.status || ''}
                onChangeText={(value) => updateFormData('status', value)}
                placeholder="请输入状态（如：进行中、已完成）"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>分类</Text>
              <TextInput
                style={styles.textInput}
                value={formData.category || ''}
                onChangeText={(value) => updateFormData('category', value)}
                placeholder="请输入分类"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>优先级</Text>
              <TextInput
                style={styles.textInput}
                value={formData.priority || ''}
                onChangeText={(value) => updateFormData('priority', value)}
                placeholder="请输入优先级（如：高、中、低）"
              />
            </View>
          </View>
        );

      case 'moods':
        return (
          <View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>心情评分 (1-10)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.mood_score || ''}
                onChangeText={(value) => updateFormData('mood_score', value)}
                placeholder="1-10"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>心情类型</Text>
              <TextInput
                style={styles.textInput}
                value={formData.mood_type || ''}
                onChangeText={(value) => updateFormData('mood_type', value)}
                placeholder="请输入心情类型（如：开心、焦虑）"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>描述</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description || ''}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="请输入心情描述"
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>日期</Text>
              <TextInput
                style={styles.textInput}
                value={formData.date || ''}
                onChangeText={(value) => updateFormData('date', value)}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
        );

      case 'thoughts':
        return (
          <View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>标题</Text>
              <TextInput
                style={styles.textInput}
                value={formData.title || ''}
                onChangeText={(value) => updateFormData('title', value)}
                placeholder="请输入想法标题"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>分类</Text>
              <TextInput
                style={styles.textInput}
                value={formData.category || ''}
                onChangeText={(value) => updateFormData('category', value)}
                placeholder="请输入分类"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>标签</Text>
              <TextInput
                style={styles.textInput}
                value={formData.tags || ''}
                onChangeText={(value) => updateFormData('tags', value)}
                placeholder="请输入标签（用逗号分隔）"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>内容</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.content || ''}
                onChangeText={(value) => updateFormData('content', value)}
                placeholder="请输入想法内容"
                multiline
                numberOfLines={4}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>收藏</Text>
              <TouchableOpacity
                style={[styles.checkboxContainer, formData.is_favorite && styles.checkboxActive]}
                onPress={() => updateFormData('is_favorite', !formData.is_favorite)}
              >
                <Ionicons 
                  name={formData.is_favorite ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={24} 
                  color={formData.is_favorite ? '#007AFF' : '#999'} 
                />
                <Text style={styles.checkboxText}>设为收藏</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'food_records':
        return (
          <View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>食物名称</Text>
              <TextInput
                style={styles.textInput}
                value={formData.food_name || ''}
                onChangeText={(value) => updateFormData('food_name', value)}
                placeholder="请输入食物名称"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>数量</Text>
              <TextInput
                style={styles.textInput}
                value={formData.quantity || ''}
                onChangeText={(value) => updateFormData('quantity', value)}
                placeholder="请输入数量"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>餐次</Text>
              <TextInput
                style={styles.textInput}
                value={formData.meal_time || ''}
                onChangeText={(value) => updateFormData('meal_time', value)}
                placeholder="请输入餐次（如：早餐、午餐）"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>卡路里</Text>
              <TextInput
                style={styles.textInput}
                value={formData.calories || ''}
                onChangeText={(value) => updateFormData('calories', value)}
                placeholder="请输入卡路里"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>口味评分 (1-10)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.taste_rating || ''}
                onChangeText={(value) => updateFormData('taste_rating', value)}
                placeholder="1-10"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>用餐地点</Text>
              <TextInput
                style={styles.textInput}
                value={formData.location || ''}
                onChangeText={(value) => updateFormData('location', value)}
                placeholder="请输入用餐地点"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>用餐心情</Text>
              <TextInput
                style={styles.textInput}
                value={formData.mood || ''}
                onChangeText={(value) => updateFormData('mood', value)}
                placeholder="请输入用餐心情"
              />
            </View>
          </View>
        );

      default:
        return <Text style={styles.emptyText}>暂不支持编辑此类型数据</Text>;
    }
  };

  const renderTableCard = (tableName) => {
    const config = TABLE_CONFIGS[tableName];
    const count = tableCounts[tableName] || 0;

    return (
      <TouchableOpacity
        key={tableName}
        style={styles.tableCard}
        onPress={() => loadTableData(tableName)}
      >
        <View style={styles.tableHeader}>
          <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon} size={24} color={config.color} />
          </View>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => exportTable(tableName)}
          >
            <Ionicons name="download-outline" size={20} color="#666666" />
          </TouchableOpacity>
        </View>
        <Text style={styles.tableName}>{config.name}</Text>
        <Text style={styles.tableDescription}>{config.description}</Text>
        <Text style={styles.tableCount}>{count} 条记录</Text>
      </TouchableOpacity>
    );
  };

  const renderDataItem = ({ item, index }) => {
    const formatValue = (key, value) => {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'boolean') return value ? '是' : '否';
      if (typeof value === 'object') {
        // 如果是数组，转换为字符串
        if (Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : '-';
        }
        // 如果是对象，转换为JSON字符串
        try {
          const jsonStr = JSON.stringify(value, null, 2);
          return jsonStr.length > 100 ? jsonStr.substring(0, 100) + '...' : jsonStr;
        } catch (error) {
          return '[对象]';
        }
      }
      if (key.includes('date') || key.includes('time')) {
        try {
          return new Date(value).toLocaleString();
        } catch (error) {
          return String(value);
        }
      }
      if (typeof value === 'string' && value.length > 50) {
        return value.substring(0, 50) + '...';
      }
      // 确保所有值都被转换为字符串
      return String(value);
    };

    const getDisplayFields = (tableName, item) => {
      const parsedItem = parseItemData(item, tableName);
      
      switch (tableName) {
        case 'personal_info':
          return [
            { label: '姓名', value: parsedItem.name },
            { label: '年龄', value: parsedItem.age },
            { label: '性别', value: parsedItem.gender },
            { label: '职业', value: parsedItem.occupation },
            { label: '健康状况', value: parsedItem.health_status },
            { label: '慢性疾病', value: parsedItem.chronic_diseases },
            { label: '身高', value: parsedItem.height ? `${parsedItem.height}cm` : null },
            { label: '体重', value: parsedItem.weight ? `${parsedItem.weight}kg` : null },
            { label: '血型', value: parsedItem.blood_type },
            { label: '过敏信息', value: parsedItem.allergies },
            { label: '用药信息', value: parsedItem.medications }
          ].filter(item => item.value);
        case 'preferences':
          return [
            { label: '分类', value: parsedItem.category },
            { label: '项目', value: parsedItem.item },
            { label: '类型', value: parsedItem.preference_type === 'like' ? '喜欢' : '不喜欢' },
            { label: '强度', value: parsedItem.intensity }
          ];
        case 'milestones':
          return [
            { label: '标题', value: parsedItem.title },
            { label: '状态', value: parsedItem.status },
            { label: '分类', value: parsedItem.category },
            { label: '优先级', value: parsedItem.priority }
          ];
        case 'moods':
          return [
            { label: '心情评分', value: parsedItem.mood_score ? `${parsedItem.mood_score}/10` : '-' },
            { label: '心情类型', value: parsedItem.mood_type },
            { label: '日期', value: parsedItem.date },
            { label: '描述', value: parsedItem.description }
          ];
        case 'thoughts':
          return [
            { label: '标题', value: parsedItem.title },
            { label: '分类', value: parsedItem.category },
            { label: '标签', value: parsedItem.tags },
            { label: '收藏', value: parsedItem.is_favorite ? '是' : '否' }
          ];
        case 'food_records':
          return [
            { label: '食物名称', value: parsedItem.food_name },
            { label: '数量', value: parsedItem.quantity },
            { label: '餐次', value: parsedItem.meal_time },
            { label: '卡路里', value: parsedItem.calories ? `${parsedItem.calories}卡` : null },
            { label: '口味评分', value: parsedItem.taste_rating ? `${parsedItem.taste_rating}/10` : null },
            { label: '用餐地点', value: parsedItem.location },
            { label: '用餐心情', value: parsedItem.mood }
          ];
        case 'chat_history':
          return [
            { label: '用户消息', value: parsedItem.user_message },
            { label: 'AI回复', value: parsedItem.ai_response },
            { label: '时间', value: parsedItem.created_at }
          ];
        default:
          return [];
      }
    };

    const fields = getDisplayFields(selectedTable, item);
    
    // 生成简短的显示ID
    const getDisplayId = (id) => {
      if (typeof id === 'string' && id.length > 10) {
        return `#${index + 1}`; // 使用序号作为显示ID
      }
      return `#${id}`;
    };

    return (
      <View style={styles.dataItem}>
        <View style={styles.dataHeader}>
          <Text style={styles.dataIndex}>{getDisplayId(item.id)}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="pencil-outline" size={16} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moveButton}
              onPress={() => openMoveModal(item)}
            >
              <Ionicons name="swap-horizontal-outline" size={16} color="#FF9500" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                console.log(`[DEBUG] 删除按钮被点击: ID=${item.id}, 类型=${typeof item.id}`);
                deleteRecord(item.id);
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        {fields.map((field, fieldIndex) => {
          const formattedValue = formatValue(field.label, field.value);

          // 检查值是否存在且格式化后的值不为空
          const hasValue = field.value !== null && field.value !== undefined && field.value !== '';
          const shouldRender = hasValue && formattedValue && formattedValue !== '-';
          
          if (!shouldRender) {
            return null;
          }
          
          return (
            <View key={fieldIndex} style={styles.dataField}>
              <Text style={styles.fieldLabel}>{field.label}:</Text>
              <Text style={styles.fieldValue}>{formattedValue}</Text>
            </View>
          );
        })}
        <Text style={styles.dataTime}>
          创建时间: {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>数据库</Text>
        <Text style={styles.subtitle}>查看和管理你的数据</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.exportSection}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.exportAllButton}
              onPress={exportAllData}
              disabled={exportLoading}
            >
              <Ionicons name="cloud-download-outline" size={20} color="#2C2C2E" />
              <Text style={styles.exportAllText}>导出所有数据</Text>
              {exportLoading && <ActivityIndicator size="small" color="#2C2C2E" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cleanupButton}
              onPress={showPreferenceInfo}
            >
              <Ionicons name="information-circle-outline" size={20} color="#2C2C2E" />
              <Text style={styles.cleanupText}>偏好记录说明</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tablesGrid}>
          {Object.keys(TABLE_CONFIGS).map(renderTableCard)}
        </View>
      </ScrollView>

      {/* 数据详情模态框 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedTable ? TABLE_CONFIGS[selectedTable].name : ''}
            </Text>
            <View style={styles.modalHeaderButtons}>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={openAddModal}
              >
                <Ionicons name="add" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : (
            <FlatList
              data={tableData}
              renderItem={renderDataItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.dataList}
              contentContainerStyle={styles.dataListContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>暂无数据</Text>
              }
            />
          )}
        </View>
      </Modal>

      {/* 编辑/添加数据模态框 */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isAddMode ? '添加' : '编辑'}{selectedTable ? TABLE_CONFIGS[selectedTable].name : ''}
            </Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {renderFormFields()}
            
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveRecord}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 移动数据模态框 */}
      <Modal
        visible={moveModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>移动数据</Text>
            <TouchableOpacity onPress={() => setMoveModalVisible(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.moveDescription}>
              选择要将此数据移动到的目标表格：
            </Text>
            
            <View style={styles.tableSelectionGrid}>
              {Object.keys(TABLE_CONFIGS)
                .filter(tableName => tableName !== selectedTable && tableName !== 'chat_history')
                .map(tableName => (
                  <TouchableOpacity
                    key={tableName}
                    style={[
                      styles.tableSelectionCard,
                      { borderColor: TABLE_CONFIGS[tableName].color }
                    ]}
                    onPress={() => moveDataToTable(tableName)}
                  >
                    <View style={[
                      styles.tableSelectionIcon,
                      { backgroundColor: TABLE_CONFIGS[tableName].color }
                    ]}>
                      <Ionicons 
                        name={TABLE_CONFIGS[tableName].icon} 
                        size={24} 
                        color="white" 
                      />
                    </View>
                    <Text style={styles.tableSelectionName}>
                      {TABLE_CONFIGS[tableName].name}
                    </Text>
                    <Text style={styles.tableSelectionDescription}>
                      {TABLE_CONFIGS[tableName].description}
                    </Text>
                  </TouchableOpacity>
                ))
              }
            </View>
            
            <View style={styles.moveWarning}>
              <Ionicons name="warning-outline" size={20} color="#FF9500" />
              <Text style={styles.moveWarningText}>
                移动操作会将数据从当前表格删除并添加到目标表格中，数据格式会根据目标表格自动调整。
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  content: {
    flex: 1,
  },
  exportSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  exportAllButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exportAllText: {
    color: '#2C2C2E',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cleanupButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cleanupText: {
    color: '#2C2C2E',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tablesGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tableCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButton: {
    padding: 8,
  },
  tableName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  tableDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  tableCount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  dataList: {
    flex: 1,
  },
  dataListContent: {
    padding: 20,
  },
  dataItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dataIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteButton: {
    padding: 4,
  },
  dataField: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    width: 80,
  },
  fieldValue: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  dataTime: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 16,
    marginTop: 40,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    marginRight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 4,
    marginRight: 8,
  },
  moveButton: {
    padding: 4,
    marginRight: 8,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formField: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  preferenceButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  preferenceButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  preferenceButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  preferenceButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  preferenceButtonTextActive: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkboxActive: {
    // 可以添加激活状态的样式
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333333',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  moveDescription: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  tableSelectionGrid: {
    marginBottom: 20,
  },
  tableSelectionCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  tableSelectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tableSelectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  tableSelectionDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  moveWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE69C',
    marginTop: 20,
  },
  moveWarningText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});