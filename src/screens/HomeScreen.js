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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from '../services/DatabaseService';
import DeepSeekService from '../services/DeepSeekService';
import VoiceService from '../services/VoiceService';

const { width } = Dimensions.get('window');

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
        Alert.alert(
          '录音完成',
          '语音识别功能需要集成第三方服务，请手动输入文字内容',
          [{ text: '确定' }]
        );
      }
    } else {
      // 开始录音
      const success = await VoiceService.startRecording();
      if (success) {
        setIsRecording(true);
      } else {
        Alert.alert('错误', '无法开始录音，请检查麦克风权限');
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
      
      // 语音播放AI回复
      await VoiceService.speakText(aiResponse);
    } catch (error) {
      console.error('聊天失败:', error);
      const errorMessage = { role: 'assistant', content: '抱歉，我现在有点忙，稍后再聊好吗？', timestamp: new Date() };
      setChatMessages([...newMessages, errorMessage]);
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
        <Ionicons name={getEntryIcon(entry.type)} size={20} color="#007AFF" />
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
        <Text style={styles.title}>我的数据</Text>
        <Text style={styles.subtitle}>记录生活，了解自己</Text>
      </View>

      {/* 主要功能按钮 */}
      <View style={styles.mainButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveJournal} disabled={isLoading}>
          <Ionicons name="create-outline" size={24} color="white" />
          <Text style={styles.primaryButtonText}>记录生活</Text>
          {isLoading && <ActivityIndicator size="small" color="white" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleChatWithYuMiao}>
          <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>和于渺聊天</Text>
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
              color={isRecording ? "white" : "#007AFF"} 
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
            <Text style={styles.chatTitle}>与于渺聊天</Text>
            <TouchableOpacity onPress={() => setChatModalVisible(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.chatMessages}>
            {chatMessages.map((message, index) => (
              <View key={index} style={[
                styles.messageContainer,
                message.role === 'user' ? styles.userMessage : styles.aiMessage
              ]}>
                <Text style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userMessageText : styles.aiMessageText
                ]}>
                  {message.content}
                </Text>
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
  mainButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
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
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  voiceButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
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
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  },
  userMessageText: {
    backgroundColor: '#007AFF',
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
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});