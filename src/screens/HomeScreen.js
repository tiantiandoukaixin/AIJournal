import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseService from '../services/DatabaseService';
import DeepSeekService from '../services/DeepSeekService';
import VoiceService from '../services/VoiceService';

const { width } = Dimensions.get('window');

const STORAGE_KEYS = {
  VOICE_ENABLED: 'voice_enabled'
};

export default function HomeScreen() {
  const [journalText, setJournalText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [userData, setUserData] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await DatabaseService.init();
      // 自动清理矛盾的偏好记录
      await DatabaseService.cleanupConflictingPreferences();
      await loadRecentData();
    } catch (error) {
      console.error('初始化应用失败:', error);
      Alert.alert('错误', '应用初始化失败');
    }
  };

  const loadRecentData = async () => {
    try {
      const data = await DatabaseService.getRecentData(7); // 获取最近7天的数据
      setUserData(data);
      
      // 合并最近的条目用于显示
      const recent = [];
      if (data.moods && data.moods.length > 0) {
        recent.push(...data.moods.slice(0, 3).map(item => ({ ...item, type: 'mood' })));
      }
      if (data.thoughts && data.thoughts.length > 0) {
        recent.push(...data.thoughts.slice(0, 3).map(item => ({ ...item, type: 'thought' })));
      }
      if (data.milestones && data.milestones.length > 0) {
        recent.push(...data.milestones.slice(0, 2).map(item => ({ ...item, type: 'milestone' })));
      }
      if (data.food_records && data.food_records.length > 0) {
        recent.push(...data.food_records.slice(0, 3).map(item => ({ ...item, type: 'food_record' })));
      }
      
      // 按时间排序
      recent.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentEntries(recent.slice(0, 5));
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleCleanupData = async () => {
    console.log('🔧 清理按钮被点击');
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('这将清理数据库中的重复记录，保留最新的数据。是否继续？');
      if (confirmed) {
        try {
          console.log('🚀 开始执行数据清理');
          setIsLoading(true);
          await DatabaseService.cleanupDuplicateData();
          await loadRecentData();
          console.log('✅ 数据清理完成');
          window.alert('数据清理完成！');
        } catch (error) {
          console.error('❌ 数据清理失败:', error);
          window.alert('数据清理失败，请稍后重试');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      Alert.alert(
        '清理重复数据',
        '这将清理数据库中的重复记录，保留最新的数据。是否继续？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定',
            onPress: async () => {
              try {
                console.log('🚀 开始执行数据清理');
                setIsLoading(true);
                await DatabaseService.cleanupDuplicateData();
                await loadRecentData();
                console.log('✅ 数据清理完成');
                Alert.alert('成功', '数据清理完成！');
              } catch (error) {
                console.error('❌ 数据清理失败:', error);
                Alert.alert('错误', '数据清理失败，请稍后重试');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    }
  };

  const handleSaveJournal = async () => {
    if (!journalText.trim()) {
      Alert.alert('提示', '请输入日记内容');
      return;
    }

    console.log('🎯 开始保存日记流程:', journalText.substring(0, 50) + '...');
    setIsLoading(true);
    
    try {
      console.log('🤖 调用AI分析服务...');
      // 使用AI分析日记内容
      const analysisResult = await DeepSeekService.analyzeJournalEntry(journalText);
      console.log('🎉 AI分析完成，结果:', analysisResult);
      
      // 清空输入框，让用户可以立即继续使用
      setJournalText('');
      setIsLoading(false);
      
      // 显示分析完成的提示
      Alert.alert('分析完成', '日记分析已完成，正在后台保存数据...', [
        { text: '确定' }
      ]);
      
      // 在后台异步保存数据
      saveAnalysisToDatabase(analysisResult)
        .then(async () => {
          console.log('✅ 数据库保存完成');
          await loadRecentData();
          console.log('🔄 界面数据刷新完成');
          
          // 显示保存完成的通知
          Alert.alert('保存完成', '日记数据已成功保存到数据库！', [
            { text: '确定' }
          ]);
        })
        .catch((error) => {
          console.error('💥 后台保存失败:', error);
          Alert.alert('保存失败', `数据保存失败: ${error.message}`, [
            { text: '确定' }
          ]);
        });
        
    } catch (error) {
      console.error('💥 AI分析失败:', error);
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
      Alert.alert('错误', `AI分析失败: ${error.message}`);
      setIsLoading(false);
    }
  };

  const saveAnalysisToDatabase = async (analysis) => {
    try {
      // 保存个人信息
      if (analysis.personal_info && Object.values(analysis.personal_info).some(v => v)) {
        await DatabaseService.insertPersonalInfo(analysis.personal_info);
      }

      // 保存喜好
      if (analysis.preferences && analysis.preferences.length > 0) {
        for (const pref of analysis.preferences) {
          await DatabaseService.insertPreference(pref);
        }
      }

      // 保存里程碑
      if (analysis.milestones && analysis.milestones.length > 0) {
        for (const milestone of analysis.milestones) {
          await DatabaseService.insertMilestone(milestone);
        }
      }

      // 保存心情
      if (analysis.moods && analysis.moods.length > 0) {
        for (const mood of analysis.moods) {
          await DatabaseService.insertMood(mood);
        }
      }

      // 保存想法
      if (analysis.thoughts && analysis.thoughts.length > 0) {
        for (const thought of analysis.thoughts) {
          await DatabaseService.insertThought(thought);
        }
      }

      // 保存饮食记录
      if (analysis.food_records && analysis.food_records.length > 0) {
        for (const foodRecord of analysis.food_records) {
          await DatabaseService.insertFoodRecord(foodRecord);
        }
      }
    } catch (error) {
      console.error('保存分析结果失败:', error);
      throw error;
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      // 停止录音
      const audioUri = await VoiceService.stopRecording();
      setIsRecording(false);
      
      if (audioUri) {
        // 开始语音识别
        setIsLoading(true);
        try {
          const result = await VoiceService.speechToText(audioUri);
          
          if (result.success && result.text) {
             // 将识别结果添加到现有文本中
             const newText = journalText ? journalText + ' ' + result.text : result.text;
             setJournalText(newText);
             Alert.alert('语音识别成功', `识别结果：${result.text}`);
           } else {
             // 针对网络错误提供重试和手动输入选项
             if (result.message && (result.message.includes('网络连接失败') || result.message.includes('网络') || result.message.includes('Google服务'))) {
               Alert.alert(
                 '语音识别失败',
                 result.message,
                 [
                   { text: '手动输入', onPress: () => {
                     // 在移动端，可以通过ref聚焦到文本输入框
                     // 这里暂时只提示用户手动输入
                     Alert.alert('提示', '请在下方文本框中手动输入您的内容');
                   }},
                   { text: '重试', onPress: () => handleVoiceRecord() }
                 ]
               );
             } else {
               Alert.alert('语音识别失败', result.message || '未能识别语音内容');
             }
           }
        } catch (error) {
          console.error('语音识别过程出错:', error);
          Alert.alert('错误', '语音识别过程中出现错误');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      // 在Web环境下，直接使用语音识别而不需要录音
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        setIsRecording(true);
        try {
          const result = await VoiceService.startDirectSpeechRecognition();
          
          if (result.success && result.text) {
             // 将识别结果添加到现有文本中
             const newText = journalText ? journalText + ' ' + result.text : result.text;
             setJournalText(newText);
             Alert.alert('语音识别成功', `识别结果：${result.text}`);
           } else {
             // 针对网络错误提供重试和手动输入选项
             if (result.message && (result.message.includes('网络连接') || result.message.includes('网络') || result.message.includes('Google服务'))) {
               Alert.alert(
                 '语音识别失败',
                 result.message,
                 [
                   { text: '手动输入', onPress: () => {
                     // 聚焦到文本输入框
                     const textInput = document.querySelector('textarea, input[type="text"]');
                     if (textInput) {
                       textInput.focus();
                     }
                   }},
                   { text: '重试', onPress: () => setTimeout(() => handleVoiceRecord(), 1000) }
                 ]
               );
             } else {
               Alert.alert('语音识别失败', result.message || '未能识别语音内容');
             }
           }
        } catch (error) {
          console.error('语音识别过程出错:', error);
          const errorMsg = error.message || '语音识别失败';
          
          // 检查是否为网络错误，提供重试和手动输入选项
          if (errorMsg.includes('网络连接') || errorMsg.includes('网络') || errorMsg.includes('Google服务')) {
            Alert.alert(
              '语音识别失败',
              '语音识别服务连接失败。Web Speech API依赖Google服务，在国内可能无法正常使用。',
              [
                { text: '手动输入', onPress: () => {
                  // 聚焦到文本输入框
                  const textInput = document.querySelector('textarea, input[type="text"]');
                  if (textInput) {
                    textInput.focus();
                  }
                }},
                { text: '重试', onPress: () => setTimeout(() => handleVoiceRecord(), 1000) }
              ]
            );
          } else {
            Alert.alert('错误', '语音识别过程中出现错误');
          }
        } finally {
          setIsRecording(false);
        }
      } else {
        // 移动端开始录音
        const success = await VoiceService.startRecording();
        if (success) {
          setIsRecording(true);
        } else {
          Alert.alert('错误', '无法开始录音，请检查麦克风权限');
        }
      }
    }
  };

  const handleChatWithYuMiao = async () => {
    if (!userData) {
      const data = await DatabaseService.getRecentData(30);
      setUserData(data);
    }
    setChatModalVisible(true);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // 添加用户消息
    const newMessages = [...chatMessages, { role: 'user', content: userMessage, timestamp: new Date() }];
    setChatMessages(newMessages);

    try {
      // 获取AI回复
      const aiResponse = await DeepSeekService.chatWithYuMiao(userMessage, userData);
      
      // 添加AI回复
      const aiMessage = { role: 'assistant', content: aiResponse, timestamp: new Date() };
      setChatMessages([...newMessages, aiMessage]);
      
      // 保存聊天记录
      await DatabaseService.insertChatHistory(userMessage, aiResponse, Date.now().toString());
      
      // 检查语音设置并播放AI回复
      try {
        const savedVoiceEnabled = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_ENABLED);
        const voiceEnabled = savedVoiceEnabled !== null ? JSON.parse(savedVoiceEnabled) : true; // 默认启用
        
        if (voiceEnabled) {
          console.log('🔊 语音播放已启用，使用年轻女性声音播放AI回复');
          // 使用专门优化的年轻女性声音
          await VoiceService.speakWithFemaleVoice(aiResponse);
        } else {
          console.log('🔇 语音播放已禁用，跳过语音播放');
        }
      } catch (voiceError) {
        console.error('语音播放失败:', voiceError);
        // 语音播放失败不影响聊天功能
      }
    } catch (error) {
      console.error('聊天失败:', error);
      const errorMessage = { role: 'assistant', content: '抱歉，我现在有点忙，稍后再聊好吗？', timestamp: new Date() };
      setChatMessages([...newMessages, errorMessage]);
    }
  };

  const deleteChatMessage = (index) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('确定要删除这条消息吗？');
      if (confirmed) {
        const newMessages = chatMessages.filter((_, i) => i !== index);
        setChatMessages(newMessages);
      }
    } else {
      Alert.alert(
        '确认删除',
        '确定要删除这条消息吗？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '删除',
            style: 'destructive',
            onPress: () => {
              const newMessages = chatMessages.filter((_, i) => i !== index);
              setChatMessages(newMessages);
            }
          }
        ]
      );
    }
  };

  const renderRecentEntry = (entry, index) => {
    // 解析存储在content字段中的JSON数据
    const parseEntryData = (entry) => {
      try {
        if (typeof entry.content === 'string') {
          return JSON.parse(entry.content);
        }
        return entry.content || {};
      } catch (error) {
        console.log('解析条目数据失败:', error);
        return {};
      }
    };
    
    const entryData = parseEntryData(entry);
    
    const getEntryIcon = (type) => {
      switch (type) {
        case 'mood': return 'happy-outline';
        case 'thought': return 'bulb-outline';
        case 'milestone': return 'flag-outline';
        case 'preference': return 'heart-outline';
        case 'personal_info': return 'person-outline';
        case 'food_record': return 'restaurant-outline';
        default: return 'document-outline';
      }
    };

    const getEntryTitle = (entry, data) => {
      switch (entry.type) {
        case 'mood': 
          return `心情记录: ${data.mood_type || '一般'}`;
        case 'thought': 
          return data.title || (typeof data.content === 'string' ? data.content.substring(0, 20) + '...' : '新想法') || '新想法';
        case 'milestone': 
          return data.title || '里程碑';
        case 'preference':
          return `${data.preference_type === 'like' ? '喜欢' : '不喜欢'}: ${data.item || ''}`;
        case 'personal_info':
          return `个人信息: ${data.name || '更新'}`;
        case 'food_record':
          return `饮食记录: ${data.food_name || '美食'}`;
        default: return '记录';
      }
    };

    const getEntryContent = (entry, data) => {
      switch (entry.type) {
        case 'mood': 
          return `评分: ${data.mood_score}/10${data.description ? ' - ' + data.description : ''}`;
        case 'thought': 
          return (typeof data.content === 'string' ? data.content : '') || (typeof data.description === 'string' ? data.description : '') || '';
        case 'milestone': 
          return `${data.status || '计划中'} - ${data.description || ''}`;
        case 'preference':
          return `分类: ${data.category} (强度: ${data.intensity || 5}/10)`;
        case 'personal_info':
          const info = [];
          if (data.age) info.push(`年龄: ${data.age}`);
          if (data.occupation) info.push(`职业: ${data.occupation}`);
          return info.join(', ') || '基本信息';
        case 'food_record':
          const foodInfo = [];
          if (data.quantity) foodInfo.push(`${data.quantity}`);
          if (data.meal_time) foodInfo.push(`${data.meal_time}`);
          if (data.calories) foodInfo.push(`${data.calories}卡路里`);
          return foodInfo.join(' | ') || '饮食记录';
        default: 
          try {
            if (typeof data === 'object' && data !== null) {
              return JSON.stringify(data).substring(0, 50) + '...';
            }
            return String(data).substring(0, 50) + '...';
          } catch (error) {
            return '数据格式错误';
          }
      }
    };

    return (
      <View key={index} style={styles.recentEntry}>
        <Ionicons name={getEntryIcon(entry.type)} size={20} color="#34C759" />
        <View style={styles.entryContent}>
          <Text style={styles.entryTitle}>{getEntryTitle(entry, entryData)}</Text>
          <Text style={styles.entryText} numberOfLines={2}>{getEntryContent(entry, entryData)}</Text>
          <Text style={styles.entryDate}>{new Date(entry.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="heart" size={32} color="#FF6B6B" style={styles.titleIcon} />
          <Text style={styles.title}>心灵驿站</Text>
        </View>
        <Text style={styles.subtitle}>聆听内心，记录时光</Text>
      </View>

      {/* 主要功能按钮 */}
      <View style={styles.mainButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveJournal} disabled={isLoading}>
          <Ionicons name="create-outline" size={24} color="#2C2C2E" />
          <Text style={styles.primaryButtonText}>诗意记录</Text>
          {isLoading && <ActivityIndicator size="small" color="#2C2C2E" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleChatWithYuMiao}>
          <Ionicons name="chatbubble-outline" size={24} color="#2C2C2E" />
          <Text style={styles.secondaryButtonText}>心语对话</Text>
        </TouchableOpacity>
      </View>

      {/* 日记输入区域 */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>今天发生了什么？</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="分享你的生活、想法、心情..."
            value={journalText}
            onChangeText={setJournalText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <TouchableOpacity 
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]} 
              onPress={handleVoiceRecord}
            >
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={20} 
                color={isRecording ? "white" : "#34C759"} 
              />
          </TouchableOpacity>
        </View>
      </View>

      {/* 最近记录 */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近记录</Text>
          <TouchableOpacity style={styles.cleanupButton} onPress={handleCleanupData}>
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            <Text style={styles.cleanupButtonText}>清理</Text>
          </TouchableOpacity>
        </View>
        {recentEntries.length > 0 ? (
          recentEntries.map((entry, index) => renderRecentEntry(entry, index))
        ) : (
          <Text style={styles.emptyText}>暂无记录，开始记录你的生活吧！</Text>
        )}
      </View>

      {/* 聊天模态框 */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>心语对话</Text>
            <TouchableOpacity onPress={() => setChatModalVisible(false)}>
              <Ionicons name="close" size={24} color="#34C759" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.chatMessages}>
            {chatMessages.map((message, index) => (
              <View key={index} style={[
                styles.messageContainer,
                message.role === 'user' ? styles.userMessage : styles.aiMessage
              ]}>
                <View style={styles.messageHeader}>
                  <Text style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userMessageText : styles.aiMessageText
                  ]}>
                    {message.content}
                  </Text>
                  <TouchableOpacity 
                    style={styles.deleteMessageButton}
                    onPress={() => deleteChatMessage(index)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#999999" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="输入消息..."
              value={chatInput}
              onChangeText={setChatInput}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendChatMessage}>
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2C2C2E',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '400',
    opacity: 0.8,
  },
  mainButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    gap: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5E7',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#2C2C2E',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5E7',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#2C2C2E',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  voiceButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cleanupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFF2F2',
  },
  cleanupButtonText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
  },
  recentEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  entryContent: {
    flex: 1,
    marginLeft: 12,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  entryText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: '#999999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 16,
    marginTop: 20,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  chatMessages: {
    flex: 1,
    padding: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  deleteMessageButton: {
    padding: 4,
    marginLeft: 8,
    marginTop: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    padding: 12,
    borderRadius: 12,
    flex: 1,
  },
  userMessageText: {
    backgroundColor: '#34C759',
    color: 'white',
  },
  aiMessageText: {
    backgroundColor: '#F0F0F0',
    color: '#000000',
  },
  messageTime: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    textAlign: 'center',
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
});