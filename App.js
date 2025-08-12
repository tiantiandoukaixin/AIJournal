import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import DatabaseScreen from './src/screens/DatabaseScreen';
import ChatHistoryScreen from './src/screens/ChatHistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DatabaseService from './src/services/DatabaseService';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      console.log('🔄 正在初始化数据库...');
      const success = await DatabaseService.init();
      if (success) {
        console.log('✅ 数据库初始化成功');
        setIsDbInitialized(true);
      } else {
        console.error('❌ 数据库初始化失败');
      }
    } catch (error) {
      console.error('❌ 数据库初始化异常:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666666' }}>正在初始化应用...</Text>
      </View>
    );
  }
  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Database') {
              iconName = focused ? 'server' : 'server-outline';
            } else if (route.name === 'ChatHistory') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E0E0E0',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            tabBarLabel: '我的数据',
          }}
        />
        <Tab.Screen 
          name="Database" 
          component={DatabaseScreen} 
          options={{
            tabBarLabel: '数据库',
          }}
        />
        <Tab.Screen 
          name="ChatHistory" 
          component={ChatHistoryScreen} 
          options={{
            tabBarLabel: '聊天记录',
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{
            tabBarLabel: '设置',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
