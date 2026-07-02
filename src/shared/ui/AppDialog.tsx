import React, { memo, type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Dialog, Portal, Text } from 'react-native-paper';

interface AppDialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  children?: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
  dismissOnBackdrop?: boolean;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AppDialog = memo<AppDialogProps>(
  ({
    visible,
    title,
    message,
    children,
    actions,
    onDismiss,
    dismissOnBackdrop = false,
    scrollable = false,
    style,
  }) => {
    const { height } = useWindowDimensions();
    const content = children ?? <Text>{message}</Text>;

    return (
      <Portal>
        <Dialog
          visible={visible}
          dismissable={dismissOnBackdrop}
          dismissableBackButton={dismissOnBackdrop}
          onDismiss={dismissOnBackdrop ? onDismiss : () => undefined}
          style={[styles.dialog, { maxHeight: height * 0.86 }, style]}
        >
          {title ? <Dialog.Title>{title}</Dialog.Title> : null}
          {message || children ? (
            <Dialog.Content style={scrollable ? styles.scrollWrapper : null}>
              {scrollable ? (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  contentContainerStyle={styles.scrollContent}
                >
                  {content}
                </ScrollView>
              ) : (
                content
              )}
            </Dialog.Content>
          ) : null}
          {actions ? <Dialog.Actions>{actions}</Dialog.Actions> : null}
        </Dialog>
      </Portal>
    );
  },
);

const styles = StyleSheet.create({
  dialog: {
    overflow: 'hidden',
  },
  scrollWrapper: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 1,
  },
});
