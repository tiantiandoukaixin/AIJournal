import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';

// 导入组件
import BottomTabNavigator from './src/components/BottomTabNavigator';
import { initDatabase } from './src/database/database';
import { initWebDatabase } from './src/database/webDatabase';

export default function App() {
  useEffect(() => {
    // 初始化数据库
    const setupDatabase = async () => {
      try {
        if (Platform.OS === 'web') {
          await initWebDatabase();
          console.log('Web数据库初始化成功');
        } else {
          await initDatabase();
          console.log('数据库初始化成功');
        }
      } catch (error) {
        console.error('数据库初始化失败:', error);
      }
    };
    
    setupDatabase();
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <View style={styles.container}>
          <StatusBar style="dark" backgroundColor="#FFFFFF" />
          <BottomTabNavigator />
        </View>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});
