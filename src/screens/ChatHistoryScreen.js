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
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import DatabaseService from '../services/DatabaseService';
import ExportService from '../services/ExportService';

const { width } = Dimensions.get('window');

export default function ChatHistoryScreen() {
  const [chatData, setChatData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [groupBy, setGroupBy] = useState('date'); // 'date', 'session', 'none'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('csv');

  useEffect(() => {
    loadChatHistory();
    
    // 监听localStorage变化事件
    const handleStorageChange = () => {
      console.log('[DEBUG] ChatHistory检测到存储变化，重新加载数据');
      loadChatHistory();
    };

    if (Platform.OS === 'web') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('localStorageUpdate', handleStorageChange);
    }

    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('localStorageUpdate', handleStorageChange);
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  useEffect(() => {
    filterAndGroupData();
  }, [chatData, searchText, groupBy, sortOrder]);

  const loadChatHistory = async () => {
    setIsLoading(true);
    try {
      const data = await DatabaseService.getTableData('chat_history');
      setChatData(data);
      calculateStats(data);
    } catch (error) {
      console.error('加载聊天记录失败:', error);
      Alert.alert('错误', '加载聊天记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatHistory();
    setRefreshing(false);
  };

  const calculateStats = (data) => {
    const totalChats = data.length;
    const totalUserWords = data.reduce((sum, item) => {
      return sum + (item.user_message ? item.user_message.length : 0);
    }, 0);
    const totalAiWords = data.reduce((sum, item) => {
      return sum + (item.ai_response ? item.ai_response.length : 0);
    }, 0);
    
    const sessions = [...new Set(data.map(item => item.session_id))];
    const totalSessions = sessions.length;
    
    const dates = [...new Set(data.map(item => {
      const date = new Date(item.created_at);
      return date.toDateString();
    }))];
    const activeDays = dates.length;
    
    const avgChatsPerDay = activeDays > 0 ? (totalChats / activeDays).toFixed(1) : 0;
    const avgWordsPerChat = totalChats > 0 ? ((totalUserWords + totalAiWords) / totalChats).toFixed(0) : 0;

    setStats({
      totalChats,
      totalUserWords,
      totalAiWords,
      totalSessions,
      activeDays,
      avgChatsPerDay,
      avgWordsPerChat
    });
  };

  const filterAndGroupData = () => {
    let filtered = chatData;

    // 搜索过滤
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(item => 
        (item.user_message && item.user_message.toLowerCase().includes(searchLower)) ||
        (item.ai_response && item.ai_response.toLowerCase().includes(searchLower))
      );
    }

    // 排序
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // 分组
    let groupedData = [];
    if (groupBy === 'date') {
      const groups = {};
      filtered.forEach(item => {
        const date = new Date(item.created_at).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(item);
      });
      
      Object.keys(groups).forEach(date => {
        groupedData.push({ type: 'header', title: date, count: groups[date].length });
        groupedData.push(...groups[date].map(item => ({ ...item, type: 'chat' })));
      });
    } else if (groupBy === 'session') {
      const groups = {};
      filtered.forEach(item => {
        const sessionId = item.session_id || '未知会话';
        if (!groups[sessionId]) {
          groups[sessionId] = [];
        }
        groups[sessionId].push(item);
      });
      
      Object.keys(groups).forEach(sessionId => {
        const sessionDate = groups[sessionId][0] ? new Date(groups[sessionId][0].created_at).toLocaleString() : '';
        groupedData.push({ 
          type: 'header', 
          title: `会话 ${sessionId}`, 
          subtitle: sessionDate,
          count: groups[sessionId].length 
        });
        groupedData.push(...groups[sessionId].map(item => ({ ...item, type: 'chat' })));
      });
    } else {
      groupedData = filtered.map(item => ({ ...item, type: 'chat' }));
    }

    setFilteredData(groupedData);
  };

  const exportChatHistory = async (format) => {
    setExportLoading(true);
    try {
      let result;
      const filteredChatData = searchText.trim() ? filteredData.filter(item => item.type === 'chat') : null;
      
      switch (format) {
        case 'csv':
          result = await ExportService.exportChatHistory();
          break;
        case 'json':
          result = await exportAsJSON();
          break;
        case 'txt':
          result = await exportAsText();
          break;
        case 'pdf':
          result = await ExportService.exportChatHistoryAsPDF(filteredChatData);
          break;
        case 'word':
          result = await ExportService.exportChatHistoryAsWord(filteredChatData);
          break;
        default:
          throw new Error('不支持的导出格式');
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
      setExportModalVisible(false);
    }
  };

  const exportAsJSON = async () => {
    try {
      const data = searchText.trim() ? filteredData.filter(item => item.type === 'chat') : chatData;
      const jsonData = JSON.stringify(data, null, 2);
      
      const fileName = `聊天记录_${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        // Web环境下直接下载
        const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return { success: true, fileName };
      } else {
        // 移动端保存到文件系统
        await ExportService.ensureExportDirectory();
        const filePath = ExportService.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, jsonData, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const exportAsText = async () => {
    try {
      const data = searchText.trim() ? filteredData.filter(item => item.type === 'chat') : chatData;
      let textContent = '聊天记录导出\n';
      textContent += `导出时间: ${new Date().toLocaleString()}\n`;
      textContent += `总计: ${data.length} 条对话\n\n`;
      
      data.forEach((item, index) => {
        const time = new Date(item.created_at).toLocaleString();
        textContent += `=== 对话 ${index + 1} (${time}) ===\n`;
        textContent += `用户: ${item.user_message || ''}\n`;
        textContent += `AI: ${item.ai_response || ''}\n\n`;
      });
      
      const fileName = `聊天记录_${new Date().toISOString().split('T')[0]}.txt`;
      
      if (Platform.OS === 'web') {
        // Web环境下直接下载
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return { success: true, fileName };
      } else {
        // 移动端保存到文件系统
        await ExportService.ensureExportDirectory();
        const filePath = ExportService.exportDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, textContent, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, filePath, fileName };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteChatRecord = async (id) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('确定要删除这条聊天记录吗？');
      if (confirmed) {
        try {
          await DatabaseService.deleteRecord('chat_history', id);
          await loadChatHistory();
          window.alert('聊天记录已删除');
        } catch (error) {
          console.error('删除失败:', error);
          window.alert('删除失败');
        }
      }
    } else {
      Alert.alert(
        '确认删除',
        '确定要删除这条聊天记录吗？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '删除',
            style: 'destructive',
            onPress: async () => {
              try {
                await DatabaseService.deleteRecord('chat_history', id);
                await loadChatHistory();
                Alert.alert('成功', '聊天记录已删除');
              } catch (error) {
                console.error('删除失败:', error);
                Alert.alert('错误', '删除失败');
              }
            }
          }
        ]
      );
    }
  };

  const renderChatItem = ({ item, index }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{item.title}</Text>
          {item.subtitle && <Text style={styles.groupSubtitle}>{item.subtitle}</Text>}
          <Text style={styles.groupCount}>{item.count} 条对话</Text>
        </View>
      );
    }

    return (
      <View style={styles.chatItem}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTime}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteChatRecord(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.messageContainer}>
          <View style={styles.userMessage}>
            <Text style={styles.messageLabel}>用户:</Text>
            <Text style={styles.messageText}>{item.user_message || ''}</Text>
          </View>
          
          <View style={styles.aiMessage}>
            <Text style={styles.messageLabel}>AI:</Text>
            <Text style={styles.messageText}>{item.ai_response || ''}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStatsModal = () => (
    <Modal
      visible={showStats}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>聊天统计</Text>
          <TouchableOpacity onPress={() => setShowStats(false)}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalChats}</Text>
              <Text style={styles.statLabel}>总对话数</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>会话数</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activeDays}</Text>
              <Text style={styles.statLabel}>活跃天数</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.avgChatsPerDay}</Text>
              <Text style={styles.statLabel}>日均对话</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalUserWords}</Text>
              <Text style={styles.statLabel}>用户字数</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalAiWords}</Text>
              <Text style={styles.statLabel}>AI字数</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.avgWordsPerChat}</Text>
              <Text style={styles.statLabel}>平均字数/对话</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderExportModal = () => (
    <Modal
      visible={exportModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>导出聊天记录</Text>
          <TouchableOpacity onPress={() => setExportModalVisible(false)}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.exportContainer}>
          <Text style={styles.exportDescription}>
            选择导出格式:
          </Text>
          
          <TouchableOpacity
            style={[styles.formatButton, selectedFormat === 'csv' && styles.formatButtonActive]}
            onPress={() => setSelectedFormat('csv')}
          >
            <Ionicons name="document-outline" size={24} color={selectedFormat === 'csv' ? '#FFFFFF' : '#007AFF'} />
            <Text style={[styles.formatText, selectedFormat === 'csv' && styles.formatTextActive]}>CSV 表格</Text>
            <Text style={[styles.formatDesc, selectedFormat === 'csv' && styles.formatDescActive]}>适合数据分析</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.formatButton, selectedFormat === 'json' && styles.formatButtonActive]}
            onPress={() => setSelectedFormat('json')}
          >
            <Ionicons name="code-outline" size={24} color={selectedFormat === 'json' ? '#FFFFFF' : '#007AFF'} />
            <Text style={[styles.formatText, selectedFormat === 'json' && styles.formatTextActive]}>JSON 数据</Text>
            <Text style={[styles.formatDesc, selectedFormat === 'json' && styles.formatDescActive]}>适合程序处理</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.formatButton, selectedFormat === 'txt' && styles.formatButtonActive]}
            onPress={() => setSelectedFormat('txt')}
          >
            <Ionicons name="document-text-outline" size={24} color={selectedFormat === 'txt' ? '#FFFFFF' : '#007AFF'} />
            <Text style={[styles.formatText, selectedFormat === 'txt' && styles.formatTextActive]}>文本文件</Text>
            <Text style={[styles.formatDesc, selectedFormat === 'txt' && styles.formatDescActive]}>适合阅读查看</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.formatButton, selectedFormat === 'pdf' && styles.formatButtonActive]}
            onPress={() => setSelectedFormat('pdf')}
          >
            <Ionicons name="document-outline" size={24} color={selectedFormat === 'pdf' ? '#FFFFFF' : '#007AFF'} />
            <Text style={[styles.formatText, selectedFormat === 'pdf' && styles.formatTextActive]}>PDF 文档</Text>
            <Text style={[styles.formatDesc, selectedFormat === 'pdf' && styles.formatDescActive]}>专业文档格式</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.formatButton, selectedFormat === 'word' && styles.formatButtonActive]}
            onPress={() => setSelectedFormat('word')}
          >
            <Ionicons name="document-text" size={24} color={selectedFormat === 'word' ? '#FFFFFF' : '#007AFF'} />
            <Text style={[styles.formatText, selectedFormat === 'word' && styles.formatTextActive]}>Word 文档</Text>
            <Text style={[styles.formatDesc, selectedFormat === 'word' && styles.formatDescActive]}>可编辑文档</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => exportChatHistory(selectedFormat)}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="download-outline" size={20} color="white" />
            )}
            <Text style={styles.exportButtonText}>
              {exportLoading ? '导出中...' : '开始导出'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons 
              name="chatbubbles" 
              size={32} 
              color="#5AC8FA" 
              style={styles.titleIcon}
            />
            <Text style={styles.title}>聊天记录</Text>
          </View>
          <Text style={styles.subtitle}>心灵对话的印记，智慧交融的轨迹</Text>
        </View>

      {/* 搜索和控制栏 */}
      <View style={styles.controlBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索聊天内容..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 功能按钮栏 */}
      <View style={styles.actionBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.actionButton, groupBy === 'date' && styles.actionButtonActive]}
            onPress={() => setGroupBy('date')}
          >
            <Ionicons name="calendar-outline" size={16} color={groupBy === 'date' ? '#FFFFFF' : '#007AFF'} />
            <Text style={[styles.actionButtonText, groupBy === 'date' && styles.actionButtonTextActive]}>按日期</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, groupBy === 'session' && styles.actionButtonActive]}
            onPress={() => setGroupBy('session')}
          >
            <Ionicons name="chatbubbles-outline" size={16} color={groupBy === 'session' ? '#FFFFFF' : '#007AFF'} />
            <Text style={[styles.actionButtonText, groupBy === 'session' && styles.actionButtonTextActive]}>按会话</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, groupBy === 'none' && styles.actionButtonActive]}
            onPress={() => setGroupBy('none')}
          >
            <Ionicons name="list-outline" size={16} color={groupBy === 'none' ? '#FFFFFF' : '#007AFF'} />
            <Text style={[styles.actionButtonText, groupBy === 'none' && styles.actionButtonTextActive]}>列表</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          >
            <Ionicons name={sortOrder === 'desc' ? 'arrow-down-outline' : 'arrow-up-outline'} size={16} color="#007AFF" />
            <Text style={styles.actionButtonText}>{sortOrder === 'desc' ? '最新' : '最旧'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowStats(true)}
          >
            <Ionicons name="stats-chart-outline" size={16} color="#007AFF" />
            <Text style={styles.actionButtonText}>统计</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setExportModalVisible(true)}
          >
            <Ionicons name="download-outline" size={16} color="#007AFF" />
            <Text style={styles.actionButtonText}>导出</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 聊天记录列表 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderChatItem}
          keyExtractor={(item, index) => item.id ? item.id.toString() : `header-${index}`}
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchText.trim() ? '没有找到匹配的聊天记录' : '暂无聊天记录'}
            </Text>
          }
        />
      )}

      {renderStatsModal()}
      {renderExportModal()}
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
  controlBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  groupHeader: {
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    marginTop: 16,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  groupSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  groupCount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  chatItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chatTime: {
    fontSize: 12,
    color: '#999999',
  },
  deleteButton: {
    padding: 4,
  },
  messageContainer: {
    gap: 12,
  },
  userMessage: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  aiMessage: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
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
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 16,
    marginTop: 40,
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
  statsContainer: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#F8F8F8',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  exportContainer: {
    flex: 1,
    padding: 20,
  },
  exportDescription: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 20,
  },
  formatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  formatButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  formatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  formatTextActive: {
    color: '#FFFFFF',
  },
  formatDesc: {
    fontSize: 14,
    color: '#666666',
  },
  formatDescActive: {
    color: '#FFFFFF',
  },
  exportButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});