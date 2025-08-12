import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

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

      await Speech.speak(text, defaultOptions);
      return true;
    } catch (error) {
      console.error('文本转语音失败:', error);
      return false;
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

  // 模拟语音识别（实际项目中可以集成真实的语音识别服务）
  async speechToText(audioUri) {
    try {
      // 这里应该调用真实的语音识别API
      // 由于Expo没有内置的语音识别，这里返回一个提示
      console.log('语音文件路径:', audioUri);
      
      // 在实际应用中，你可以：
      // 1. 将音频文件上传到云端语音识别服务（如百度、腾讯、阿里云等）
      // 2. 使用第三方语音识别库
      // 3. 集成原生语音识别功能
      
      return {
        success: false,
        text: '',
        message: '语音识别功能需要集成第三方服务，当前版本请手动输入文字'
      };
    } catch (error) {
      console.error('语音识别失败:', error);
      return {
        success: false,
        text: '',
        message: '语音识别失败'
      };
    }
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