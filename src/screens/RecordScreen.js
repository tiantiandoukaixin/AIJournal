import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// 导入数据库和服务
import { dietOperations, exerciseOperations, suggestionOperations } from '../database/database';
import { analyzeDietRecord, analyzeExerciseRecord } from '../services/aiService';

const RecordScreen = () => {
  const navigation = useNavigation();
  const [recordType, setRecordType] = useState('diet'); // 'diet' or 'exercise'
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // 分析记录
  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      Alert.alert('提示', '请输入记录内容');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      let result;
      if (recordType === 'diet') {
        result = await analyzeDietRecord(inputText);
      } else {
        result = await analyzeExerciseRecord(inputText);
      }
      setAnalysisResult(result);
    } catch (error) {
      Alert.alert('错误', '分析失败: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 保存记录
  const handleSave = async () => {
    if (!analysisResult) {
      Alert.alert('提示', '请先分析记录内容');
      return;
    }

    try {
      if (recordType === 'diet') {
        await dietOperations.add(analysisResult);
        Alert.alert('成功', '饮食记录已保存', [
          { text: '确定', onPress: () => navigation.goBack() }
        ]);
      } else {
        await exerciseOperations.add(analysisResult);
        Alert.alert('成功', '运动记录已保存', [
          { text: '确定', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('错误', '保存失败: ' + error.message);
    }
  };

  // 重新输入
  const handleReset = () => {
    setInputText('');
    setAnalysisResult(null);
  };

  // 修改分析结果
  const updateAnalysisResult = (field, value) => {
    setAnalysisResult(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 记录类型选择 */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, recordType === 'diet' && styles.typeButtonActive]}
            onPress={() => {
              setRecordType('diet');
              setAnalysisResult(null);
            }}
          >
            <Ionicons 
              name="restaurant" 
              size={20} 
              color={recordType === 'diet' ? '#FFFFFF' : '#007AFF'} 
            />
            <Text style={[styles.typeButtonText, recordType === 'diet' && styles.typeButtonTextActive]}>
              饮食记录
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.typeButton, recordType === 'exercise' && styles.typeButtonActive]}
            onPress={() => {
              setRecordType('exercise');
              setAnalysisResult(null);
            }}
          >
            <Ionicons 
              name="fitness" 
              size={20} 
              color={recordType === 'exercise' ? '#FFFFFF' : '#007AFF'} 
            />
            <Text style={[styles.typeButtonText, recordType === 'exercise' && styles.typeButtonTextActive]}>
              运动记录
            </Text>
          </TouchableOpacity>
        </View>

        {/* 输入区域 */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>
            {recordType === 'diet' ? '描述你吃了什么' : '描述你的运动'}
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder={recordType === 'diet' 
              ? '例如：一碗白米饭，一个苹果，200ml牛奶' 
              : '例如：跑步30分钟，做了50个俯卧撑'
            }
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <View style={styles.inputActions}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="refresh" size={16} color="#8E8E93" />
              <Text style={styles.resetButtonText}>重新输入</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]} 
              onPress={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="analytics" size={16} color="#FFFFFF" />
              )}
              <Text style={styles.analyzeButtonText}>
                {isAnalyzing ? '分析中...' : 'AI分析'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 分析结果 */}
        {analysisResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>分析结果</Text>
            
            {recordType === 'diet' ? (
              <View style={styles.resultContent}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>食物名称:</Text>
                  <TextInput
                    style={styles.resultInput}
                    value={analysisResult.food_name}
                    onChangeText={(value) => updateAnalysisResult('food_name', value)}
                  />
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>热量(卡路里):</Text>
                  <TextInput
                    style={styles.resultInput}
                    value={String(analysisResult.calories || 0)}
                    onChangeText={(value) => updateAnalysisResult('calories', parseFloat(value) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>蛋白质(克):</Text>
                  <TextInput
                    style={styles.resultInput}
                    value={String(analysisResult.protein || 0)}
                    onChangeText={(value) => updateAnalysisResult('protein', parseFloat(value) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>碳水化合物(克):</Text>
                  <TextInput
                    style={styles.resultInput}
                    value={String(analysisResult.carbs || 0)}
                    onChangeText={(value) => updateAnalysisResult('carbs', parseFloat(value) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>脂肪(克):</Text>
                  <TextInput
                    style={styles.resultInput}
                    value={String(analysisResult.fat || 0)}
                    onChangeText={(value) => updateAnalysisResult('fat', parseFloat(value) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>食用量:</Text>
                  <TextInput
                    style={styles.resultInput}
                    value={analysisResult.quantity || ''}
                    onChangeText={(value) => updateAnalysisResult('quantity', value)}
                  />
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>备注:</Text>
                  <TextInput
                    style={[styles.resultInput, styles.resultInputMultiline]}
                    value={analysisResult.notes || ''}
                    onChangeText={(value) => updateAnalysisResult('notes', value)}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.resultContent}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>运动名称:</Text>
                  <TextInput
                    style={styles.resultInput}
                    value={analysisResult.exercise_name}
                    onChangeText={(value) => updateAnalysisResult('exercise_name', value)}
                  />
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>运动时长(分钟):</Text>
                  <TextInput
                    style={styles.resultInput}
                    value={String(analysisResult.duration || 0)}
                    onChangeText={(value) => updateAnalysisResult('duration', parseInt(value) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>消耗热量:</Text>
                  <TextInput
                    style={styles.resultInput}
                    value={String(analysisResult.calories_burned || 0)}
                    onChangeText={(value) => updateAnalysisResult('calories_burned', parseFloat(value) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>运动强度:</Text>
                  <View style={styles.intensitySelector}>
                    {['低', '中', '高'].map((intensity) => (
                      <TouchableOpacity
                        key={intensity}
                        style={[
                          styles.intensityButton,
                          analysisResult.intensity === intensity && styles.intensityButtonActive
                        ]}
                        onPress={() => updateAnalysisResult('intensity', intensity)}
                      >
                        <Text style={[
                          styles.intensityButtonText,
                          analysisResult.intensity === intensity && styles.intensityButtonTextActive
                        ]}>
                          {intensity}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>备注:</Text>
                  <TextInput
                    style={[styles.resultInput, styles.resultInputMultiline]}
                    value={analysisResult.notes || ''}
                    onChangeText={(value) => updateAnalysisResult('notes', value)}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>
            )}
            
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>保存记录</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputCard: {
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    gap: 6,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  analyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    gap: 6,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  resultCard: {
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
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  resultContent: {
    gap: 12,
    marginBottom: 20,
  },
  resultRow: {
    gap: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  resultInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  resultInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  intensitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    alignItems: 'center',
  },
  intensityButtonActive: {
    backgroundColor: '#007AFF',
  },
  intensityButtonText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  intensityButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default RecordScreen;