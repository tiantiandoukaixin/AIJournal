import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// 格式化日期时间
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 导出饮食记录为TXT格式
export const exportDietRecordsToTxt = async (records) => {
  try {
    let content = '饮食记录导出\n';
    content += '=' * 50 + '\n\n';
    
    if (records.length === 0) {
      content += '暂无饮食记录\n';
    } else {
      records.forEach((record, index) => {
        content += `记录 ${index + 1}\n`;
        content += `-`.repeat(20) + '\n';
        content += `食物名称: ${record.food_name}\n`;
        content += `热量: ${record.calories || 0} 卡路里\n`;
        content += `蛋白质: ${record.protein || 0} 克\n`;
        content += `碳水化合物: ${record.carbs || 0} 克\n`;
        content += `脂肪: ${record.fat || 0} 克\n`;
        content += `食用量: ${record.quantity || '未知'}\n`;
        content += `备注: ${record.notes || '无'}\n`;
        content += `记录时间: ${formatDateTime(record.created_at)}\n\n`;
      });
    }
    
    content += `\n导出时间: ${formatDateTime(new Date().toISOString())}\n`;
    
    const fileName = `饮食记录_${new Date().toISOString().split('T')[0]}.txt`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    await Sharing.shareAsync(fileUri);
    return { success: true, message: '导出成功' };
  } catch (error) {
    console.error('导出饮食记录失败:', error);
    return { success: false, message: '导出失败: ' + error.message };
  }
};

// 导出运动记录为TXT格式
export const exportExerciseRecordsToTxt = async (records) => {
  try {
    let content = '运动记录导出\n';
    content += '=' * 50 + '\n\n';
    
    if (records.length === 0) {
      content += '暂无运动记录\n';
    } else {
      records.forEach((record, index) => {
        content += `记录 ${index + 1}\n`;
        content += `-`.repeat(20) + '\n';
        content += `运动名称: ${record.exercise_name}\n`;
        content += `运动时长: ${record.duration || 0} 分钟\n`;
        content += `消耗热量: ${record.calories_burned || 0} 卡路里\n`;
        content += `运动强度: ${record.intensity || '未知'}\n`;
        content += `备注: ${record.notes || '无'}\n`;
        content += `记录时间: ${formatDateTime(record.created_at)}\n\n`;
      });
    }
    
    content += `\n导出时间: ${formatDateTime(new Date().toISOString())}\n`;
    
    const fileName = `运动记录_${new Date().toISOString().split('T')[0]}.txt`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    await Sharing.shareAsync(fileUri);
    return { success: true, message: '导出成功' };
  } catch (error) {
    console.error('导出运动记录失败:', error);
    return { success: false, message: '导出失败: ' + error.message };
  }
};

// 导出聊天记录为TXT格式
export const exportChatRecordsToTxt = async (records) => {
  try {
    let content = '聊天记录导出\n';
    content += '=' * 50 + '\n\n';
    
    if (records.length === 0) {
      content += '暂无聊天记录\n';
    } else {
      records.forEach((record, index) => {
        content += `对话 ${index + 1}\n`;
        content += `-`.repeat(20) + '\n';
        content += `用户: ${record.message}\n\n`;
        content += `于渺: ${record.response}\n\n`;
        content += `时间: ${formatDateTime(record.created_at)}\n\n`;
      });
    }
    
    content += `\n导出时间: ${formatDateTime(new Date().toISOString())}\n`;
    
    const fileName = `聊天记录_${new Date().toISOString().split('T')[0]}.txt`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    await Sharing.shareAsync(fileUri);
    return { success: true, message: '导出成功' };
  } catch (error) {
    console.error('导出聊天记录失败:', error);
    return { success: false, message: '导出失败: ' + error.message };
  }
};

// 导出建议记录为TXT格式
export const exportSuggestionsToTxt = async (records) => {
  try {
    let content = '营养建议记录导出\n';
    content += '=' * 50 + '\n\n';
    
    if (records.length === 0) {
      content += '暂无建议记录\n';
    } else {
      records.forEach((record, index) => {
        content += `建议 ${index + 1}\n`;
        content += `-`.repeat(20) + '\n';
        content += `${record.suggestion_text}\n\n`;
        content += `生成时间: ${formatDateTime(record.created_at)}\n\n`;
      });
    }
    
    content += `\n导出时间: ${formatDateTime(new Date().toISOString())}\n`;
    
    const fileName = `营养建议_${new Date().toISOString().split('T')[0]}.txt`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    await Sharing.shareAsync(fileUri);
    return { success: true, message: '导出成功' };
  } catch (error) {
    console.error('导出建议记录失败:', error);
    return { success: false, message: '导出失败: ' + error.message };
  }
};

// 导出所有数据为综合报告
export const exportAllDataToTxt = async (dietRecords, exerciseRecords, chatRecords, suggestions) => {
  try {
    let content = '饮食教练 - 综合数据报告\n';
    content += '=' * 60 + '\n\n';
    
    // 统计信息
    content += '数据统计\n';
    content += '-' * 30 + '\n';
    content += `饮食记录总数: ${dietRecords.length}\n`;
    content += `运动记录总数: ${exerciseRecords.length}\n`;
    content += `聊天记录总数: ${chatRecords.length}\n`;
    content += `营养建议总数: ${suggestions.length}\n\n`;
    
    // 饮食记录部分
    content += '饮食记录\n';
    content += '=' * 30 + '\n';
    if (dietRecords.length === 0) {
      content += '暂无饮食记录\n\n';
    } else {
      dietRecords.slice(0, 10).forEach((record, index) => {
        content += `${index + 1}. ${record.food_name} - ${record.calories || 0}卡路里 (${formatDateTime(record.created_at)})\n`;
      });
      if (dietRecords.length > 10) {
        content += `... 还有 ${dietRecords.length - 10} 条记录\n`;
      }
      content += '\n';
    }
    
    // 运动记录部分
    content += '运动记录\n';
    content += '=' * 30 + '\n';
    if (exerciseRecords.length === 0) {
      content += '暂无运动记录\n\n';
    } else {
      exerciseRecords.slice(0, 10).forEach((record, index) => {
        content += `${index + 1}. ${record.exercise_name} - ${record.duration || 0}分钟 (${formatDateTime(record.created_at)})\n`;
      });
      if (exerciseRecords.length > 10) {
        content += `... 还有 ${exerciseRecords.length - 10} 条记录\n`;
      }
      content += '\n';
    }
    
    // 最近聊天记录
    content += '最近聊天记录\n';
    content += '=' * 30 + '\n';
    if (chatRecords.length === 0) {
      content += '暂无聊天记录\n\n';
    } else {
      chatRecords.slice(0, 5).forEach((record, index) => {
        content += `${index + 1}. ${record.message.substring(0, 50)}... (${formatDateTime(record.created_at)})\n`;
      });
      if (chatRecords.length > 5) {
        content += `... 还有 ${chatRecords.length - 5} 条记录\n`;
      }
      content += '\n';
    }
    
    content += `\n报告生成时间: ${formatDateTime(new Date().toISOString())}\n`;
    
    const fileName = `饮食教练综合报告_${new Date().toISOString().split('T')[0]}.txt`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    await Sharing.shareAsync(fileUri);
    return { success: true, message: '导出成功' };
  } catch (error) {
    console.error('导出综合报告失败:', error);
    return { success: false, message: '导出失败: ' + error.message };
  }
};

// 计算今日营养摄入总结
export const calculateTodayNutrition = (todayDietRecords, todayExerciseRecords) => {
  const totalCaloriesIn = todayDietRecords.reduce((sum, record) => sum + (record.calories || 0), 0);
  const totalProtein = todayDietRecords.reduce((sum, record) => sum + (record.protein || 0), 0);
  const totalCarbs = todayDietRecords.reduce((sum, record) => sum + (record.carbs || 0), 0);
  const totalFat = todayDietRecords.reduce((sum, record) => sum + (record.fat || 0), 0);
  
  const totalCaloriesOut = todayExerciseRecords.reduce((sum, record) => sum + (record.calories_burned || 0), 0);
  const totalExerciseTime = todayExerciseRecords.reduce((sum, record) => sum + (record.duration || 0), 0);
  
  return {
    caloriesIn: totalCaloriesIn,
    caloriesOut: totalCaloriesOut,
    netCalories: totalCaloriesIn - totalCaloriesOut,
    protein: totalProtein,
    carbs: totalCarbs,
    fat: totalFat,
    exerciseTime: totalExerciseTime,
    dietRecordsCount: todayDietRecords.length,
    exerciseRecordsCount: todayExerciseRecords.length
  };
};