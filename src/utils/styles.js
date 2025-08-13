import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#E0E0E0',
  shadow: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 21,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 13,
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 44, // iOS status bar height
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  buttonText: {
    ...typography.headline,
    color: colors.background,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.headline,
    color: colors.primary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.title2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.footnote,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  successText: {
    ...typography.footnote,
    color: colors.success,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  listItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listItemTitle: {
    ...typography.headline,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  listItemSubtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    margin: spacing.lg,
    maxHeight: height * 0.8,
    width: width * 0.9,
  },
  modalTitle: {
    ...typography.title2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default {
  colors,
  spacing,
  typography,
  commonStyles,
};