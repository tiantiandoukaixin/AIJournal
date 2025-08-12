import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

class VoiceService {
  constructor() {
    this.recording = null;
    this.isRecording = false;
  }

  // 初始化音频权限
  async initializeAudio() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('需要麦克风权限才能使用语音功能');
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      return true;
    } catch (error) {
      console.error('初始化音频失败:', error);
      return false;
    }
  }

  // 开始录音
  async startRecording() {
    try {
      if (this.isRecording) {
        console.log('已在录音中');
        return false;
      }

      const hasPermission = await this.initializeAudio();
      if (!hasPermission) {
        throw new Error('没有音频权限');
      }

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();
      this.isRecording = true;
      
      console.log('开始录音');
      return true;
    } catch (error) {
      console.error('开始录音失败:', error);
      this.isRecording = false;
      return false;
    }
  }

  // 停止录音
  async stopRecording() {
    try {
      if (!this.isRecording || !this.recording) {
        console.log('没有在录音');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.isRecording = false;
      this.recording = null;
      
      console.log('录音完成:', uri);
      return uri;
    } catch (error) {
      console.error('停止录音失败:', error);
      this.isRecording = false;
      this.recording = null;
      return null;
    }
  }

  // 文本转语音
  async speakText(text, options = {}) {
    try {
      const defaultOptions = {
        language: 'zh-CN',
        pitch: 1.0,
        rate: 0.9,
        voice: null, // 使用默认语音
        ...options
      };

      // 检查是否正在播放，如果是则停止
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
      }

      console.log('🔊 开始语音播放:', {
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        options: defaultOptions
      });

      await Speech.speak(text, defaultOptions);
      return true;
    } catch (error) {
      console.error('文本转语音失败:', error);
      return false;
    }
  }

  // 使用最佳女性声音播放文本
  async speakWithFemaleVoice(text) {
    try {
      const femaleVoiceConfig = await this.getBestFemaleVoice();
      console.log('🎀 使用女性声音配置播放:', femaleVoiceConfig);
      return await this.speakText(text, femaleVoiceConfig);
    } catch (error) {
      console.error('女性声音播放失败:', error);
      // 降级到默认配置
      return await this.speakText(text, {
        language: 'zh-CN',
        pitch: 1.2,
        rate: 0.85
      });
    }
  }

  // 停止语音播放
  async stopSpeaking() {
    try {
      await Speech.stop();
      return true;
    } catch (error) {
      console.error('停止语音播放失败:', error);
      return false;
    }
  }

  // 检查是否正在播放语音
  async isSpeaking() {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      console.error('检查语音状态失败:', error);
      return false;
    }
  }

  // 获取可用的语音列表
  async getAvailableVoices() {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      // 过滤中文语音
      const chineseVoices = voices.filter(voice => 
        voice.language.startsWith('zh') || 
        voice.language.includes('Chinese')
      );
      return chineseVoices;
    } catch (error) {
      console.error('获取语音列表失败:', error);
      return [];
    }
  }

  // 获取最佳的年轻女性声音配置
  async getBestFemaleVoice() {
    try {
      const voices = await this.getAvailableVoices();
      console.log('🎤 可用的中文语音:', voices.map(v => `${v.name} (${v.language})`));
      
      // 优先选择女性声音，按优先级排序
      const femaleVoiceKeywords = [
        'female', 'woman', 'girl', '女', '小', 'xiaoxiao', 'xiaoyan', 'xiaoli',
        'tingting', 'yaoyao', 'xiaoqian', 'xiaorui', 'xiaomeng'
      ];
      
      // 查找最佳女性声音
      let bestVoice = null;
      for (const keyword of femaleVoiceKeywords) {
        const foundVoice = voices.find(voice => 
          voice.name.toLowerCase().includes(keyword.toLowerCase()) ||
          voice.identifier.toLowerCase().includes(keyword.toLowerCase())
        );
        if (foundVoice) {
          bestVoice = foundVoice;
          break;
        }
      }
      
      if (bestVoice) {
        console.log('🎯 选择的女性声音:', bestVoice.name, bestVoice.identifier);
        return {
          voice: bestVoice.identifier,
          language: bestVoice.language,
          pitch: 1.15, // 稍高音调，更年轻
          rate: 0.85,  // 适中语速，清晰易懂
        };
      } else {
        console.log('⚠️ 未找到专门的女性声音，使用默认配置');
        return {
          voice: null,
          language: 'zh-CN',
          pitch: 1.2,  // 更高音调补偿
          rate: 0.8,   // 稍慢语速
        };
      }
    } catch (error) {
      console.error('获取女性声音配置失败:', error);
      return {
        voice: null,
        language: 'zh-CN',
        pitch: 1.2,
        rate: 0.85,
      };
    }
  }

  // 语音识别功能
  async speechToText(audioUri) {
    try {
      console.log('开始语音识别，音频文件:', audioUri);
      
      // 在Web环境下使用Web Speech API
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        return await this.webSpeechRecognition();
      }
      
      // 在移动端环境下，由于Expo没有内置语音识别，返回提示
      return {
        success: false,
        text: '',
        message: '移动端语音识别功能需要集成第三方服务，Web端支持语音识别'
      };
    } catch (error) {
      console.error('语音识别失败:', error);
      return {
        success: false,
        text: '',
        message: '语音识别失败: ' + error.message
      };
    }
  }

  // 检查网络连接状态
  async checkNetworkConnection() {
    try {
      // 首先检查浏览器的在线状态
      if (!navigator.onLine) {
        console.log('浏览器显示离线状态');
        return false;
      }
      
      // 尝试访问一个简单的网络资源进行验证
      // 使用当前域名的根路径，避免跨域问题
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(window.location.origin + '/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.log('网络连接检查失败:', error);
      // 如果fetch失败，但navigator.onLine为true，可能是网络延迟
      // 在这种情况下，我们仍然允许尝试语音识别
      return navigator.onLine;
    }
  }

  // Web Speech API 语音识别
  async webSpeechRecognition() {
    return new Promise(async (resolve) => {
      try {
        // 检查浏览器支持
        if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
          resolve({
            success: false,
            text: '',
            message: '当前浏览器不支持语音识别功能，请使用Chrome、Edge或Safari浏览器'
          });
          return;
        }

        // 检查是否为HTTPS环境（语音识别需要安全上下文）
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
          resolve({
            success: false,
            text: '',
            message: '语音识别需要HTTPS环境或本地环境，请使用安全连接'
          });
          return;
        }

        // 简化网络检查，只检查基本在线状态
        if (!navigator.onLine) {
          resolve({
            success: false,
            text: '',
            message: '设备显示离线状态，语音识别需要网络连接。请检查网络设置后重试'
          });
          return;
        }
        
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        let hasResult = false;
        
        recognition.onstart = () => {
          console.log('🎤 语音识别已启动，请开始说话...');
        };
        
        recognition.onresult = (event) => {
          if (event.results.length > 0) {
            const transcript = event.results[0][0].transcript;
            console.log('🎯 语音识别结果:', transcript);
            hasResult = true;
            resolve({
              success: true,
              text: transcript,
              message: '语音识别成功'
            });
          }
        };
        
        recognition.onerror = (event) => {
          console.error('❌ 语音识别错误:', event.error);
          if (!hasResult) {
            let errorMessage = '语音识别失败';
            switch (event.error) {
              case 'network':
                errorMessage = '语音识别服务连接失败。Web Speech API依赖Google服务，在国内可能无法正常使用。建议：\n1. 检查网络连接\n2. 尝试使用VPN\n3. 或直接手动输入文字';
                break;
              case 'not-allowed':
                errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许使用麦克风';
                break;
              case 'no-speech':
                errorMessage = '未检测到语音，请确保麦克风正常工作并重新尝试';
                break;
              case 'audio-capture':
                errorMessage = '麦克风无法访问，请检查设备连接';
                break;
              case 'service-not-allowed':
                errorMessage = '语音识别服务不可用，请稍后重试';
                break;
              case 'aborted':
                errorMessage = '语音识别被中断';
                break;
              case 'language-not-supported':
                errorMessage = '不支持中文语音识别';
                break;
              default:
                errorMessage = '语音识别失败: ' + event.error;
            }
            resolve({
              success: false,
              text: '',
              message: errorMessage
            });
          }
        };
        
        recognition.onend = () => {
          console.log('🔚 语音识别结束');
          if (!hasResult) {
            resolve({
              success: false,
              text: '',
              message: '未识别到语音内容'
            });
          }
        };
        
        recognition.start();
        console.log('开始Web语音识别...');
        
        // 设置超时
        setTimeout(() => {
          if (!hasResult) {
            recognition.stop();
            resolve({
              success: false,
              text: '',
              message: '语音识别超时'
            });
          }
        }, 15000); // 增加到15秒超时
        
      } catch (error) {
        console.error('Web语音识别初始化失败:', error);
        resolve({
          success: false,
          text: '',
          message: '浏览器不支持语音识别功能'
        });
      }
    });
  }

  // 直接语音识别（不需要先录音）
  async startDirectSpeechRecognition() {
    return new Promise((resolve) => {
      // 检查浏览器是否支持语音识别
      if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        resolve({
          success: false,
          message: '当前环境不支持语音识别功能。在移动端，请尝试使用手机浏览器的语音输入功能。'
        });
        return;
      }

      // 检查网络连接
      if (!navigator.onLine) {
        resolve({
          success: false,
          message: '设备显示离线状态，语音识别需要网络连接。请检查网络设置后重试'
        });
        return;
      }

      this.webSpeechRecognition().then(resolve).catch((error) => {
        resolve({
          success: false,
          message: error.message || '语音识别失败'
        });
      });
    });
  }

  // 清理资源
  async cleanup() {
    try {
      if (this.isRecording && this.recording) {
        await this.stopRecording();
      }
      await this.stopSpeaking();
    } catch (error) {
      console.error('清理语音资源失败:', error);
    }
  }
}

export default new VoiceService();