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
import { platformStyles, colors, spacing, fontSize } from '../utils/platformStyles';
import { webComponentStyles } from '../utils/webStyles';

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
  const [currentSessionId, setCurrentSessionId] = useState(null);
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
      const confirmed = window.confirm('这将清空所有记录数据，此操作不可恢复！是否继续？');
      if (confirmed) {
        try {
          console.log('🚀 开始执行数据清空');
          setIsLoading(true);
          const success = await DatabaseService.clearAllData();
          if (success) {
            await loadRecentData();
            console.log('✅ 数据清空完成');
            window.alert('所有记录已清空！');
          } else {
            window.alert('数据清空失败，请稍后重试');
          }
        } catch (error) {
          console.error('❌ 数据清空失败:', error);
          window.alert('数据清空失败，请稍后重试');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      Alert.alert(
        '清空所有记录',
        '这将清空所有记录数据，此操作不可恢复！是否继续？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定清空',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🚀 开始执行数据清空');
                setIsLoading(true);
                const success = await DatabaseService.clearAllData();
                if (success) {
                  await loadRecentData();
                  console.log('✅ 数据清空完成');
                  Alert.alert('成功', '所有记录已清空！');
                } else {
                  Alert.alert('错误', '数据清空失败，请稍后重试');
                }
              } catch (error) {
                console.error('❌ 数据清空失败:', error);
                Alert.alert('错误', '数据清空失败，请稍后重试');
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

  const handleVoiceRecord = () => {
    Alert.alert('提示', '语音识别功能待后续开发，敬请期待！');
  };

  const handleChatWithYuMiao = async () => {
    if (!userData) {
      const data = await DatabaseService.getRecentData(30);
      setUserData(data);
    }
    
    // 生成新的会话ID或使用现有的
    if (!currentSessionId) {
      const sessionId = Date.now().toString();
      setCurrentSessionId(sessionId);
    }
    
    // 每次打开聊天界面都加载最近的聊天记录
    await loadRecentChatMessages();
    
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
      
      // 保存完整的聊天记录（只保存一次，包含用户消息和AI回复）
      await DatabaseService.insertChatHistory(userMessage, aiResponse, currentSessionId || Date.now().toString());
      console.log('✅ 聊天记录已保存到数据库');
      
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
      
      // 保存错误消息到数据库
      try {
        await DatabaseService.insertChatHistory(userMessage, errorMessage.content, currentSessionId || Date.now().toString());
      } catch (dbError) {
        console.error('保存错误消息失败:', dbError);
      }
    }
  };

  const deleteChatMessage = async (index) => {
    const deleteMessage = async () => {
      const messageToDelete = chatMessages[index];
      const newMessages = chatMessages.filter((_, i) => i !== index);
      setChatMessages(newMessages);
      
      // 从数据库中删除对应的聊天记录
      try {
        // 根据消息内容和时间戳查找并删除对应的数据库记录
        const chatHistory = await DatabaseService.getTableData('chat_history');
        const recordToDelete = chatHistory.find(record => {
          if (messageToDelete.role === 'user') {
            return record.user_message === messageToDelete.content;
          } else {
            return record.ai_response === messageToDelete.content;
          }
        });
        
        if (recordToDelete) {
          await DatabaseService.deleteChatMessage(recordToDelete.id);
          console.log('删除消息成功:', messageToDelete);
        }
      } catch (error) {
        console.error('删除消息失败:', error);
      }
    };
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('确定要删除这条消息吗？');
      if (confirmed) {
        await deleteMessage();
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
            onPress: deleteMessage
          }
        ]
      );
    }
  };

  // 加载最近的聊天记录
  const loadRecentChatMessages = async () => {
    try {
      const recentChats = await DatabaseService.getTableData('chat_history');
      const sortedChats = recentChats
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .slice(-10); // 只加载最近10条
      
      const messages = [];
      sortedChats.forEach(chat => {
        if (chat.user_message) {
          messages.push({
            role: 'user',
            content: chat.user_message,
            timestamp: new Date(chat.created_at)
          });
        }
        if (chat.ai_response) {
          messages.push({
            role: 'assistant',
            content: chat.ai_response,
            timestamp: new Date(chat.created_at)
          });
        }
      });
      
      setChatMessages(messages);
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    }
  };

  // 播放指定消息的语音
  const playMessageVoice = async (message) => {
    try {
      const savedVoiceEnabled = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_ENABLED);
      const voiceEnabled = savedVoiceEnabled !== null ? JSON.parse(savedVoiceEnabled) : true;
      
      if (voiceEnabled && message.role === 'assistant') {
        console.log('🔊 播放指定消息的语音');
        await VoiceService.speakWithFemaleVoice(message.content);
      }
    } catch (error) {
      console.error('语音播放失败:', error);
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
          <Text style={styles.entryText}>{getEntryContent(entry, entryData)}</Text>
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
        <ScrollView style={styles.recentEntriesContainer} showsVerticalScrollIndicator={true}>
          {recentEntries.length > 0 ? (
            recentEntries.map((entry, index) => renderRecentEntry(entry, index))
          ) : (
            <Text style={styles.emptyText}>暂无记录，开始记录你的生活吧！</Text>
          )}
        </ScrollView>
      </View>

      {/* 聊天模态框 */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>心语对话</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setChatModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#5AC8FA" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.length === 0 ? (
              <View style={styles.emptyChatContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#E0E0E0" />
                <Text style={styles.emptyChatText}>开始你的心语对话吧</Text>
                <Text style={styles.emptyChatSubtext}>与AI助手分享你的想法和感受</Text>
              </View>
            ) : (
              chatMessages.map((message, index) => (
                <View key={index} style={[
                  styles.messageContainer,
                  message.role === 'user' ? styles.userMessage : styles.aiMessage
                ]}>
                  <View style={styles.messageContent}>
                    <Text style={[
                      styles.messageText,
                      message.role === 'user' ? styles.userMessageText : styles.aiMessageText
                    ]}>
                      {message.content}
                    </Text>
                    <Text style={[
                      styles.messageTime,
                      message.role === 'user' ? styles.userMessageTime : styles.aiMessageTime
                    ]}>
                      {message.timestamp.toLocaleTimeString()}
                    </Text>
                  </View>
                  <View style={styles.messageActions}>
                    {message.role === 'assistant' && (
                      <TouchableOpacity 
                        style={styles.voiceButton}
                        onPress={() => playMessageVoice(message)}
                      >
                        <Ionicons name="volume-high-outline" size={16} color="#29B6F6" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={styles.deleteMessageButton}
                      onPress={() => deleteChatMessage(index)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#29B6F6" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
          
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="输入消息..."
              value={chatInput}
              onChangeText={setChatInput}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !chatInput.trim() && styles.sendButtonDisabled]} 
              onPress={sendChatMessage}
              disabled={!chatInput.trim()}
            >
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
    backgroundColor: colors.background,
    ...webComponentStyles.mainContainer,
  },
  header: {
    padding: platformStyles.responsive.padding,
    paddingTop: platformStyles.safeAreaTop,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
    fontSize: fontSize.title,
    fontWeight: platformStyles.fontWeight.heavy,
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: platformStyles.fontWeight.normal,
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
    backgroundColor: colors.background,
    paddingVertical: platformStyles.button.paddingVertical,
    borderRadius: platformStyles.button.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...platformStyles.lightShadow,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: platformStyles.fontWeight.semibold,
    marginLeft: spacing.sm,
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
  inputVoiceButton: {
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
    flex: 1,
  },
  recentEntriesContainer: {
    maxHeight: Dimensions.get('window').height * 0.4,
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
    flexWrap: 'wrap',
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
    backgroundColor: '#F8F9FA',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: platformStyles.responsive.padding,
    paddingTop: platformStyles.safeAreaTop,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...platformStyles.shadow,
  },
  chatTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C2C2E',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyChatContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  messageContent: {
    flex: 1,
    maxWidth: '75%',
    minWidth: 100,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 6,
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 4,
    minWidth: 60,
    flexShrink: 1,
  },
  userMessageText: {
    backgroundColor: '#29B6F6',
    color: 'white',
    borderBottomRightRadius: 6,
    alignSelf: 'flex-end',
  },
  aiMessageText: {
    backgroundColor: '#FFFFFF',
    color: '#2C2C2E',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  messageTime: {
    fontSize: 11,
    marginHorizontal: 14,
  },
  userMessageTime: {
    color: '#B3E5FC',
    textAlign: 'right',
  },
  aiMessageTime: {
    color: '#8E8E93',
    textAlign: 'left',
  },
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#81D4FA',
    shadowColor: '#81D4FA',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteMessageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#81D4FA',
    shadowColor: '#81D4FA',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    paddingBottom: platformStyles.safeAreaBottom,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.chat.inputBackground,
    borderRadius: 22,
    paddingHorizontal: platformStyles.input.paddingHorizontal,
    paddingVertical: platformStyles.input.paddingVertical,
    fontSize: platformStyles.input.fontSize,
    lineHeight: platformStyles.input.lineHeight,
    maxHeight: 120,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chat.sendButton,
    alignItems: 'center',
    justifyContent: 'center',
    ...platformStyles.shadow,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
});