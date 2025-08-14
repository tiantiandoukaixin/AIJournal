import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// 导入数据库和服务
import { dietOperations, exerciseOperations } from '../database/database';
import { webDietOperations, webExerciseOperations, initWebDatabase } from '../database/webDatabase';
import { generateNutritionSuggestion } from '../services/aiService';
import { calculateTodayNutrition } from '../utils/exportUtils';
import { Platform } from 'react-native';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [todayNutrition, setTodayNutrition] = useState(null);
  const [suggestion, setSuggestion] = useState('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestionGenerated, setSuggestionGenerated] = useState(false);
  const [shortcuts, setShortcuts] = useState({ diet: [], exercise: [] });
  
  // 根据平台选择数据库操作
  const getDietOps = () => Platform.OS === 'web' ? webDietOperations : dietOperations;
  const getExerciseOps = () => Platform.OS === 'web' ? webExerciseOperations : exerciseOperations;

  // 加载今日数据
  const loadTodayData = async () => {
    try {
      // 在web环境下初始化数据库
      if (Platform.OS === 'web') {
        await initWebDatabase();
      }
      
      const dietOps = getDietOps();
      const exerciseOps = getExerciseOps();
      
      const todayDiet = await dietOps.getToday();
      const todayExercise = await exerciseOps.getToday();
      const nutrition = calculateTodayNutrition(todayDiet, todayExercise);
      setTodayNutrition(nutrition);
    } catch (error) {
      console.error('加载今日数据失败:', error);
    }
  };
  
  // 加载快捷记录
  const loadShortcuts = () => {
    const savedShortcuts = Platform.OS === 'web' 
      ? JSON.parse(localStorage.getItem('shortcuts') || '{"diet": [], "exercise": []}')
      : { diet: [], exercise: [] }; // 移动端暂时使用空数组
    setShortcuts(savedShortcuts);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTodayData();
      loadShortcuts();
      setSuggestionGenerated(false);
      setSuggestion('');
    });

    return unsubscribe;
  }, [navigation]);

  // 生成营养建议
  const handleGenerateSuggestion = async () => {
    if (isLoadingSuggestion) return;
    
    setIsLoadingSuggestion(true);
    setSuggestion('');
    
    try {
      const dietOps = getDietOps();
      const exerciseOps = getExerciseOps();
      
      const todayDiet = await dietOps.getToday();
      const todayExercise = await exerciseOps.getToday();
      
      const todayData = {
        nutrition: todayNutrition,
        dietRecords: todayDiet,
        exerciseRecords: todayExercise
      };
      
      await generateNutritionSuggestion(todayData, (chunk) => {
        setSuggestion(prev => prev + chunk);
      });
      
      setSuggestionGenerated(true);
    } catch (error) {
      Alert.alert('错误', '生成建议失败: ' + error.message);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  // 导航到记录页面
  const navigateToRecord = () => {
    navigation.navigate('Database'); // 暂时导航到数据库页面
  };

  // 导航到聊天页面
  const navigateToChat = () => {
    Alert.alert('提示', '聊天功能正在开发中，敬请期待！');
  };
  
  // 快捷记录功能
  const handleShortcutPress = (type, item) => {
    if (item.name === '设置快捷记录') {
      Alert.alert(
        '设置快捷记录',
        '请在设置页面配置您的快捷记录项目',
        [
          { text: '取消', style: 'cancel' },
          { text: '前往设置', onPress: () => navigation.navigate('Settings') }
        ]
      );
    } else {
      Alert.alert('快捷记录', `添加${item.name}功能正在开发中`);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 今日数据概览 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>今日概览</Text>
        {todayNutrition ? (
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{todayNutrition.caloriesIn}</Text>
                <Text style={styles.summaryLabel}>摄入热量</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{todayNutrition.caloriesOut}</Text>
                <Text style={styles.summaryLabel}>消耗热量</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { 
                  color: todayNutrition.netCalories > 0 ? '#FF3B30' : '#34C759' 
                }]}>
                  {todayNutrition.netCalories > 0 ? '+' : ''}{todayNutrition.netCalories}
                </Text>
                <Text style={styles.summaryLabel}>净热量</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{todayNutrition.protein.toFixed(1)}g</Text>
                <Text style={styles.summaryLabel}>蛋白质</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{todayNutrition.carbs.toFixed(1)}g</Text>
                <Text style={styles.summaryLabel}>碳水</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{todayNutrition.fat.toFixed(1)}g</Text>
                <Text style={styles.summaryLabel}>脂肪</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>暂无今日数据</Text>
        )}
      </View>

      {/* 主要功能按钮 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={navigateToRecord}>
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>记录</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={navigateToChat}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>与于渺聊天</Text>
        </TouchableOpacity>
      </View>

      {/* 营养建议区域 */}
      <View style={styles.suggestionCard}>
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionTitle}>今日营养建议</Text>
          <TouchableOpacity 
            style={[styles.generateButton, isLoadingSuggestion && styles.generateButtonDisabled]} 
            onPress={handleGenerateSuggestion}
            disabled={isLoadingSuggestion}
          >
            {isLoadingSuggestion ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="refresh" size={16} color="#007AFF" />
            )}
            <Text style={[styles.generateButtonText, isLoadingSuggestion && styles.generateButtonTextDisabled]}>
              {isLoadingSuggestion ? '生成中...' : '生成建议'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.suggestionContent}>
          {suggestion ? (
            <Text style={styles.suggestionText}>{suggestion}</Text>
          ) : (
            <Text style={styles.placeholderText}>
              {suggestionGenerated ? '暂无建议' : '点击"生成建议"按钮获取个性化营养建议'}
            </Text>
          )}
        </View>
      </View>

      {/* 快捷记录区域 */}
      <View style={styles.shortcutCard}>
        <Text style={styles.shortcutTitle}>快捷记录</Text>
        <Text style={styles.shortcutSubtitle}>点击下方按钮快速添加常用食物或运动</Text>
        
        <View style={styles.shortcutGrid}>
          {/* 饮食快捷键 */}
          <View style={styles.shortcutSection}>
            <View style={styles.shortcutSectionHeader}>
              <Text style={styles.shortcutSectionTitle}>常用食物</Text>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => handleShortcutPress('diet', { name: '设置快捷记录' })}
              >
                <Ionicons name="settings-outline" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.shortcutButtons}>
              {shortcuts.diet.length > 0 ? (
                shortcuts.diet.map((item, index) => (
                  <TouchableOpacity 
                    key={`diet-${index}`} 
                    style={styles.shortcutButton}
                    onPress={() => handleShortcutPress('diet', item)}
                  >
                    <Ionicons name="restaurant" size={16} color="#8E8E93" />
                    <Text style={styles.shortcutButtonText}>{item.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity 
                  style={[styles.shortcutButton, styles.emptyShortcutButton]}
                  onPress={() => handleShortcutPress('diet', { name: '设置快捷记录' })}
                >
                  <Ionicons name="add" size={16} color="#007AFF" />
                  <Text style={[styles.shortcutButtonText, { color: '#007AFF' }]}>设置快捷记录</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* 运动快捷键 */}
          <View style={styles.shortcutSection}>
            <View style={styles.shortcutSectionHeader}>
              <Text style={styles.shortcutSectionTitle}>常用运动</Text>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => handleShortcutPress('exercise', { name: '设置快捷记录' })}
              >
                <Ionicons name="settings-outline" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.shortcutButtons}>
              {shortcuts.exercise.length > 0 ? (
                shortcuts.exercise.map((item, index) => (
                  <TouchableOpacity 
                    key={`exercise-${index}`} 
                    style={styles.shortcutButton}
                    onPress={() => handleShortcutPress('exercise', item)}
                  >
                    <Ionicons name="fitness" size={16} color="#8E8E93" />
                    <Text style={styles.shortcutButtonText}>{item.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity 
                  style={[styles.shortcutButton, styles.emptyShortcutButton]}
                  onPress={() => handleShortcutPress('exercise', { name: '设置快捷记录' })}
                >
                  <Ionicons name="add" size={16} color="#007AFF" />
                  <Text style={[styles.shortcutButtonText, { color: '#007AFF' }]}>设置快捷记录</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  summaryContent: {
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  noDataText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 16,
    paddingVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  generateButtonTextDisabled: {
    color: '#8E8E93',
  },
  suggestionContent: {
    minHeight: 80,
  },
  suggestionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000000',
  },
  placeholderText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  shortcutCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shortcutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  shortcutSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  shortcutGrid: {
    gap: 20,
  },
  shortcutSection: {
    gap: 12,
  },
  shortcutSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shortcutSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  settingsButton: {
    padding: 4,
  },
  shortcutButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shortcutButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
  },
  shortcutButtonText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyShortcutButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
});

export default HomeScreen;