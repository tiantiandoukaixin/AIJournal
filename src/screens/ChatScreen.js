import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// 导入数据库和服务
import { chatOperations, dietOperations, exerciseOperations } from '../database/database';
import { chatWithYumiao } from '../services/aiService';

const ChatScreen = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: '你好！我是于渺，你的专属健身和营养顾问～ 😊\n\n我会根据你的饮食和运动数据，为你提供个性化的建议哦！有什么想聊的吗？',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  // 滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // 获取用户数据
  const getUserData = async () => {
    try {
      const dietRecords = await dietOperations.getAll();
      const exerciseRecords = await exerciseOperations.getAll();
      const todayDiet = await dietOperations.getToday();
      const todayExercise = await exerciseOperations.getToday();
      
      return {
        totalDietRecords: dietRecords.length,
        totalExerciseRecords: exerciseRecords.length,
        recentDietRecords: dietRecords.slice(0, 10),
        recentExerciseRecords: exerciseRecords.slice(0, 10),
        todayDiet,
        todayExercise
      };
    } catch (error) {
      console.error('获取用户数据失败:', error);
      return null;
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setCurrentResponse('');
    scrollToBottom();

    try {
      // 获取用户数据
      const userData = await getUserData();
      
      // 添加AI响应占位符
      const aiMessageId = Date.now() + 1;
      const aiMessage = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      scrollToBottom();

      // 调用AI聊天服务
      const fullResponse = await chatWithYumiao(
        userMessage.content,
        userData,
        (chunk) => {
          setCurrentResponse(prev => {
            const newResponse = prev + chunk;
            // 更新消息列表中的AI响应
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: newResponse }
                  : msg
              )
            );
            return newResponse;
          });
          scrollToBottom();
        }
      );

      // 保存聊天记录到数据库
      await chatOperations.add(userMessage.content, fullResponse);
      
    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 添加错误消息
      const errorMessage = {
        id: Date.now() + 2,
        type: 'ai',
        content: '抱歉，我现在有点忙不过来 😅 请稍后再试试吧～',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = errorMessage;
        return newMessages;
      });
      
      Alert.alert('错误', '发送消息失败: ' + error.message);
    } finally {
      setIsTyping(false);
      setCurrentResponse('');
      scrollToBottom();
    }
  };

  // 清空聊天记录
  const clearChat = () => {
    Alert.alert(
      '确认清空',
      '确定要清空所有聊天记录吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            setMessages([
              {
                id: 1,
                type: 'ai',
                content: '你好！我是于渺，你的专属健身和营养顾问～ 😊\n\n我会根据你的饮食和运动数据，为你提供个性化的建议哦！有什么想聊的吗？',
                timestamp: new Date().toISOString()
              }
            ]);
          }
        }
      ]
    );
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>于渺</Text>
          <Text style={styles.headerSubtitle}>你的健身营养顾问</Text>
        </View>
        
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* 消息列表 */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View key={message.id} style={[
            styles.messageWrapper,
            message.type === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper
          ]}>
            <View style={[
              styles.messageBubble,
              message.type === 'user' ? styles.userMessage : styles.aiMessage
            ]}>
              <Text style={[
                styles.messageText,
                message.type === 'user' ? styles.userMessageText : styles.aiMessageText
              ]}>
                {message.content}
              </Text>
            </View>
            <Text style={[
              styles.messageTime,
              message.type === 'user' ? styles.userMessageTime : styles.aiMessageTime
            ]}>
              {formatTime(message.timestamp)}
            </Text>
          </View>
        ))}
        
        {/* 正在输入指示器 */}
        {isTyping && (
          <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
            <View style={[styles.messageBubble, styles.aiMessage, styles.typingIndicator]}>
              <ActivityIndicator size="small" color="#8E8E93" />
              <Text style={styles.typingText}>于渺正在输入...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 输入区域 */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="输入消息..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isTyping}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]} 
            onPress={sendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={(!inputText.trim() || isTyping) ? '#8E8E93' : '#007AFF'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  clearButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  aiMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
  },
  aiMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 16,
  },
  userMessageTime: {
    color: '#8E8E93',
    textAlign: 'right',
  },
  aiMessageTime: {
    color: '#8E8E93',
    textAlign: 'left',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen;