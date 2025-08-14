import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 导入数据库和工具
import {
  dietOperations,
  exerciseOperations,
  chatOperations,
  suggestionOperations
} from '../database/database';
import {
  exportDietRecordsToTxt,
  exportExerciseRecordsToTxt,
  exportChatRecordsToTxt,
  exportSuggestionsToTxt,
  exportAllDataToTxt
} from '../utils/exportUtils';

const DatabaseScreen = () => {
  const [activeTab, setActiveTab] = useState('diet');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      let result = [];
      switch (activeTab) {
        case 'diet':
          result = await dietOperations.getAll();
          break;
        case 'exercise':
          result = await exerciseOperations.getAll();
          break;
        case 'chat':
          result = await chatOperations.getAll();
          break;
        case 'suggestions':
          result = await suggestionOperations.getAll();
          break;
      }
      setData(result);
    } catch (error) {
      Alert.alert('错误', '加载数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // 删除记录
  const deleteRecord = (id) => {
    Alert.alert(
      '确认删除',
      '确定要删除这条记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              switch (activeTab) {
                case 'diet':
                  await dietOperations.delete(id);
                  break;
                case 'exercise':
                  await exerciseOperations.delete(id);
                  break;
                case 'chat':
                  await chatOperations.delete(id);
                  break;
                case 'suggestions':
                  await suggestionOperations.delete(id);
                  break;
              }
              loadData();
            } catch (error) {
              Alert.alert('错误', '删除失败: ' + error.message);
            }
          }
        }
      ]
    );
  };

  // 编辑记录
  const editRecord = (item) => {
    setEditingItem({ ...item });
    setEditModalVisible(true);
  };

  // 保存编辑
  const saveEdit = async () => {
    try {
      switch (activeTab) {
        case 'diet':
          await dietOperations.update(editingItem.id, editingItem);
          break;
        case 'exercise':
          await exerciseOperations.update(editingItem.id, editingItem);
          break;
      }
      setEditModalVisible(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      Alert.alert('错误', '保存失败: ' + error.message);
    }
  };

  // 导出数据
  const exportData = async () => {
    try {
      let result;
      switch (activeTab) {
        case 'diet':
          result = await exportDietRecordsToTxt(data);
          break;
        case 'exercise':
          result = await exportExerciseRecordsToTxt(data);
          break;
        case 'chat':
          result = await exportChatRecordsToTxt(data);
          break;
        case 'suggestions':
          result = await exportSuggestionsToTxt(data);
          break;
      }
      
      if (result.success) {
        Alert.alert('成功', result.message);
      } else {
        Alert.alert('错误', result.message);
      }
    } catch (error) {
      Alert.alert('错误', '导出失败: ' + error.message);
    }
  };

  // 导出所有数据
  const exportAllData = async () => {
    try {
      const dietRecords = await dietOperations.getAll();
      const exerciseRecords = await exerciseOperations.getAll();
      const chatRecords = await chatOperations.getAll();
      const suggestions = await suggestionOperations.getAll();
      
      const result = await exportAllDataToTxt(dietRecords, exerciseRecords, chatRecords, suggestions);
      
      if (result.success) {
        Alert.alert('成功', result.message);
      } else {
        Alert.alert('错误', result.message);
      }
    } catch (error) {
      Alert.alert('错误', '导出失败: ' + error.message);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 渲染数据项
  const renderDataItem = (item, index) => {
    switch (activeTab) {
      case 'diet':
        return (
          <View key={item.id} style={styles.dataItem}>
            <View style={styles.dataHeader}>
              <Text style={styles.dataTitle}>{item.food_name}</Text>
              <View style={styles.dataActions}>
                <TouchableOpacity onPress={() => editRecord(item)} style={styles.actionButton}>
                  <Ionicons name="create-outline" size={16} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteRecord(item.id)} style={styles.actionButton}>
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.dataContent}>
              <Text style={styles.dataText}>热量: {item.calories || 0} 卡路里</Text>
              <Text style={styles.dataText}>蛋白质: {item.protein || 0}g | 碳水: {item.carbs || 0}g | 脂肪: {item.fat || 0}g</Text>
              <Text style={styles.dataText}>食用量: {item.quantity || '未知'}</Text>
              {item.notes && <Text style={styles.dataText}>备注: {item.notes}</Text>}
            </View>
            <Text style={styles.dataTime}>{formatDate(item.created_at)}</Text>
          </View>
        );
        
      case 'exercise':
        return (
          <View key={item.id} style={styles.dataItem}>
            <View style={styles.dataHeader}>
              <Text style={styles.dataTitle}>{item.exercise_name}</Text>
              <View style={styles.dataActions}>
                <TouchableOpacity onPress={() => editRecord(item)} style={styles.actionButton}>
                  <Ionicons name="create-outline" size={16} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteRecord(item.id)} style={styles.actionButton}>
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.dataContent}>
              <Text style={styles.dataText}>时长: {item.duration || 0} 分钟</Text>
              <Text style={styles.dataText}>消耗热量: {item.calories_burned || 0} 卡路里</Text>
              <Text style={styles.dataText}>强度: {item.intensity || '未知'}</Text>
              {item.notes && <Text style={styles.dataText}>备注: {item.notes}</Text>}
            </View>
            <Text style={styles.dataTime}>{formatDate(item.created_at)}</Text>
          </View>
        );
        
      case 'chat':
        return (
          <View key={item.id} style={styles.dataItem}>
            <View style={styles.dataHeader}>
              <Text style={styles.dataTitle}>对话记录</Text>
              <TouchableOpacity onPress={() => deleteRecord(item.id)} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <View style={styles.dataContent}>
              <Text style={styles.chatLabel}>用户:</Text>
              <Text style={styles.chatMessage}>{item.message}</Text>
              <Text style={styles.chatLabel}>于渺:</Text>
              <Text style={styles.chatMessage}>{item.response}</Text>
            </View>
            <Text style={styles.dataTime}>{formatDate(item.created_at)}</Text>
          </View>
        );
        
      case 'suggestions':
        return (
          <View key={item.id} style={styles.dataItem}>
            <View style={styles.dataHeader}>
              <Text style={styles.dataTitle}>营养建议</Text>
              <TouchableOpacity onPress={() => deleteRecord(item.id)} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <View style={styles.dataContent}>
              <Text style={styles.dataText}>{item.suggestion_text}</Text>
            </View>
            <Text style={styles.dataTime}>{formatDate(item.created_at)}</Text>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* 标签页 */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollView}>
          {[
            { key: 'diet', title: '饮食记录', icon: 'restaurant' },
            { key: 'exercise', title: '运动记录', icon: 'fitness' },
            { key: 'chat', title: '聊天记录', icon: 'chatbubble' },
            { key: 'suggestions', title: '营养建议', icon: 'bulb' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons 
                name={tab.icon} 
                size={16} 
                color={activeTab === tab.key ? '#FFFFFF' : '#007AFF'} 
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.exportButton} onPress={exportData}>
          <Ionicons name="download-outline" size={16} color="#007AFF" />
          <Text style={styles.exportButtonText}>导出当前</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.exportAllButton} onPress={exportAllData}>
          <Ionicons name="archive-outline" size={16} color="#34C759" />
          <Text style={styles.exportAllButtonText}>导出全部</Text>
        </TouchableOpacity>
      </View>

      {/* 数据列表 */}
      <ScrollView 
        style={styles.dataList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
        showsVerticalScrollIndicator={false}
      >
        {data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>暂无数据</Text>
          </View>
        ) : (
          data.map((item, index) => renderDataItem(item, index))
        )}
      </ScrollView>

      {/* 编辑模态框 */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>编辑记录</Text>
            <TouchableOpacity onPress={saveEdit}>
              <Text style={styles.modalSaveText}>保存</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {editingItem && activeTab === 'diet' && (
              <View style={styles.editForm}>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>食物名称</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editingItem.food_name}
                    onChangeText={(text) => setEditingItem({...editingItem, food_name: text})}
                  />
                </View>
                
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>热量(卡路里)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={String(editingItem.calories || 0)}
                    onChangeText={(text) => setEditingItem({...editingItem, calories: parseFloat(text) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>蛋白质(克)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={String(editingItem.protein || 0)}
                    onChangeText={(text) => setEditingItem({...editingItem, protein: parseFloat(text) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>碳水化合物(克)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={String(editingItem.carbs || 0)}
                    onChangeText={(text) => setEditingItem({...editingItem, carbs: parseFloat(text) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>脂肪(克)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={String(editingItem.fat || 0)}
                    onChangeText={(text) => setEditingItem({...editingItem, fat: parseFloat(text) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>食用量</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editingItem.quantity || ''}
                    onChangeText={(text) => setEditingItem({...editingItem, quantity: text})}
                  />
                </View>
                
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>备注</Text>
                  <TextInput
                    style={[styles.editInput, styles.editInputMultiline]}
                    value={editingItem.notes || ''}
                    onChangeText={(text) => setEditingItem({...editingItem, notes: text})}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            )}
            
            {editingItem && activeTab === 'exercise' && (
              <View style={styles.editForm}>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>运动名称</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editingItem.exercise_name}
                    onChangeText={(text) => setEditingItem({...editingItem, exercise_name: text})}
                  />
                </View>
                
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>运动时长(分钟)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={String(editingItem.duration || 0)}
                    onChangeText={(text) => setEditingItem({...editingItem, duration: parseInt(text) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>消耗热量</Text>
                  <TextInput
                    style={styles.editInput}
                    value={String(editingItem.calories_burned || 0)}
                    onChangeText={(text) => setEditingItem({...editingItem, calories_burned: parseFloat(text) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>运动强度</Text>
                  <View style={styles.intensitySelector}>
                    {['低', '中', '高'].map((intensity) => (
                      <TouchableOpacity
                        key={intensity}
                        style={[
                          styles.intensityButton,
                          editingItem.intensity === intensity && styles.intensityButtonActive
                        ]}
                        onPress={() => setEditingItem({...editingItem, intensity})}
                      >
                        <Text style={[
                          styles.intensityButtonText,
                          editingItem.intensity === intensity && styles.intensityButtonTextActive
                        ]}>
                          {intensity}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>备注</Text>
                  <TextInput
                    style={[styles.editInput, styles.editInputMultiline]}
                    value={editingItem.notes || ''}
                    onChangeText={(text) => setEditingItem({...editingItem, notes: text})}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  tabScrollView: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  exportAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    gap: 6,
  },
  exportAllButtonText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  dataList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  dataItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  dataActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  dataContent: {
    gap: 4,
    marginBottom: 8,
  },
  dataText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  chatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
  },
  chatMessage: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    marginTop: 4,
  },
  dataTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  editForm: {
    padding: 16,
    gap: 16,
  },
  editField: {
    gap: 8,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  editInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  editInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  intensitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignItems: 'center',
  },
  intensityButtonActive: {
    backgroundColor: '#007AFF',
  },
  intensityButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  intensityButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default DatabaseScreen;