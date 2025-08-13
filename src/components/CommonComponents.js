import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors, typography, spacing } from '../utils/styles';

// 自定义按钮组件
export const CustomButton = ({ title, onPress, style, textStyle, disabled, loading, icon }) => {
  return (
    <TouchableOpacity
      style={[
        commonStyles.button,
        disabled && { backgroundColor: colors.textSecondary },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.background} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={colors.background}
              style={{ marginRight: spacing.sm }}
            />
          )}
          <Text style={[commonStyles.buttonText, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// 次要按钮组件
export const SecondaryButton = ({ title, onPress, style, textStyle, disabled, loading, icon }) => {
  return (
    <TouchableOpacity
      style={[
        commonStyles.secondaryButton,
        disabled && { backgroundColor: colors.surface, borderColor: colors.textSecondary },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={colors.primary}
              style={{ marginRight: spacing.sm }}
            />
          )}
          <Text style={[commonStyles.secondaryButtonText, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// 自定义输入框组件
export const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  style,
  error,
  ...props
}) => {
  return (
    <View>
      {label && <Text style={commonStyles.label}>{label}</Text>}
      <TextInput
        style={[
          multiline ? commonStyles.textArea : commonStyles.input,
          error && { borderColor: colors.danger },
          style,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        {...props}
      />
      {error && <Text style={commonStyles.errorText}>{error}</Text>}
    </View>
  );
};

// 卡片组件
export const Card = ({ children, style, onPress }) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent style={[commonStyles.card, style]} onPress={onPress}>
      {children}
    </CardComponent>
  );
};

// 列表项组件
export const ListItem = ({ title, subtitle, onPress, rightIcon, leftIcon, style }) => {
  return (
    <TouchableOpacity style={[commonStyles.listItem, style]} onPress={onPress}>
      <View style={commonStyles.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={24}
              color={colors.primary}
              style={{ marginRight: spacing.md }}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={commonStyles.listItemTitle}>{title}</Text>
            {subtitle && <Text style={commonStyles.listItemSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        {rightIcon && (
          <Ionicons name={rightIcon} size={20} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
};

// 加载指示器组件
export const LoadingSpinner = ({ size = 'large', color = colors.primary }) => {
  return (
    <View style={commonStyles.loadingContainer}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

// 模态框组件
export const CustomModal = ({ visible, onClose, title, children, showCloseButton = true }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={commonStyles.modalContainer}>
        <View style={commonStyles.modalContent}>
          <View style={commonStyles.row}>
            <Text style={commonStyles.modalTitle}>{title}</Text>
            {showCloseButton && (
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// 浮动操作按钮
export const FloatingActionButton = ({ onPress, icon = 'add', style }) => {
  return (
    <TouchableOpacity style={[commonStyles.floatingButton, style]} onPress={onPress}>
      <Ionicons name={icon} size={28} color={colors.background} />
    </TouchableOpacity>
  );
};

// 分割线组件
export const Divider = ({ style }) => {
  return <View style={[commonStyles.divider, style]} />;
};

// 空状态组件
export const EmptyState = ({ icon, title, subtitle, actionTitle, onAction }) => {
  return (
    <View style={commonStyles.centerContent}>
      <Ionicons name={icon} size={64} color={colors.textSecondary} />
      <Text style={[typography.title3, { color: colors.textSecondary, marginTop: spacing.md }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
          {subtitle}
        </Text>
      )}
      {actionTitle && onAction && (
        <CustomButton
          title={actionTitle}
          onPress={onAction}
          style={{ marginTop: spacing.lg }}
        />
      )}
    </View>
  );
};

// 确认对话框
export const showConfirmDialog = (title, message, onConfirm, onCancel) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: '取消',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: '确认',
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
    { cancelable: false }
  );
};

// 成功提示
export const showSuccessAlert = (title, message) => {
  Alert.alert(title, message, [{ text: '确定' }]);
};

// 错误提示
export const showErrorAlert = (title, message) => {
  Alert.alert(title, message, [{ text: '确定' }]);
};

export default {
  CustomButton,
  SecondaryButton,
  CustomInput,
  Card,
  ListItem,
  LoadingSpinner,
  CustomModal,
  FloatingActionButton,
  Divider,
  EmptyState,
  showConfirmDialog,
  showSuccessAlert,
  showErrorAlert,
};