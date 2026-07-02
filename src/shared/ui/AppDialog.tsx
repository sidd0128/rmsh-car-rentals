import React, { memo, type ReactNode } from 'react';
import { Dialog, Portal, Text } from 'react-native-paper';

interface AppDialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  children?: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
  dismissOnBackdrop?: boolean;
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
  }) => (
    <Portal>
      <Dialog
        visible={visible}
        dismissable={dismissOnBackdrop}
        dismissableBackButton={dismissOnBackdrop}
        onDismiss={dismissOnBackdrop ? onDismiss : () => undefined}
      >
        {title ? <Dialog.Title>{title}</Dialog.Title> : null}
        {message || children ? (
          <Dialog.Content>{children ?? <Text>{message}</Text>}</Dialog.Content>
        ) : null}
        {actions ? <Dialog.Actions>{actions}</Dialog.Actions> : null}
      </Dialog>
    </Portal>
  ),
);
