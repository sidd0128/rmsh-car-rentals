import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import { spacing } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { useLoaderStore } from '@zustand/useLoaderStore';
import { useModalStore } from '@zustand/useModalStore';
import { useToastStore } from '@zustand/useToastStore';
import { AppDialog } from './AppDialog';
import { AppButton } from './AppButton';

export const GlobalUiHost = () => {
  const { colors } = useThemeContext();
  const toastColors = {
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  };
  const { visible: loaderVisible, message: loaderMessage } = useLoaderStore();
  const {
    visible: toastVisible,
    message: toastMessage,
    type,
    duration,
    hideToast,
  } = useToastStore();
  const { alert, hideAlert, modal, hideModal } = useModalStore();

  const handleAlertOk = () => {
    const onOk = alert?.onOk;
    hideAlert();
    onOk?.();
  };

  const handleModalOk = () => {
    const onOk = modal?.onOk;
    hideModal();
    onOk?.();
  };

  const handleModalCancel = () => {
    const onCancel = modal?.onCancel;
    hideModal();
    onCancel?.();
  };

  return (
    <>
      <AppDialog
        visible={Boolean(alert)}
        title={alert?.title}
        message={alert?.message}
        onDismiss={hideAlert}
        actions={
          <AppButton label={alert?.okText ?? 'OK'} onPress={handleAlertOk} />
        }
      >
        {alert?.content}
      </AppDialog>

      <AppDialog
        visible={Boolean(modal)}
        title={modal?.title}
        message={modal?.message}
        onDismiss={handleModalCancel}
        actions={
          <>
            {modal?.cancelText ? (
              <AppButton
                label={modal.cancelText}
                variant="outline"
                onPress={handleModalCancel}
              />
            ) : null}
            <AppButton label={modal?.okText ?? 'OK'} onPress={handleModalOk} />
          </>
        }
      >
        {modal?.content}
      </AppDialog>

      <Snackbar
        visible={toastVisible}
        duration={duration}
        onDismiss={hideToast}
        style={[styles.toast, { backgroundColor: toastColors[type] }]}
      >
        {toastMessage}
      </Snackbar>

      <Modal visible={loaderVisible} transparent animationType="fade">
        <View
          style={[styles.loaderOverlay, { backgroundColor: colors.overlay }]}
        >
          <View style={[styles.loaderBox, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            {loaderMessage ? (
              <Text style={[styles.loaderText, { color: colors.text }]}>
                {loaderMessage}
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  toast: {
    margin: spacing.md,
  },
  loaderOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loaderBox: {
    minWidth: 180,
    gap: spacing.md,
    alignItems: 'center',
    borderRadius: 12,
    padding: spacing.xl,
  },
  loaderText: {
    textAlign: 'center',
  },
});
