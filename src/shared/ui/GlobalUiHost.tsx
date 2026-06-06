import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { Dialog, Portal, Snackbar, Text } from 'react-native-paper';
import { colors, spacing, typography } from '@app/theme';
import { AppBottomSheet, type AppBottomSheetRef } from '@shared/bottomSheets/AppBottomSheet';
import { useBottomSheetStore } from '@zustand/useBottomSheetStore';
import { useLoaderStore } from '@zustand/useLoaderStore';
import { useModalStore } from '@zustand/useModalStore';
import { useToastStore } from '@zustand/useToastStore';
import { AppButton } from './AppButton';

const toastColors = {
  info: colors.info,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
};

export const GlobalUiHost = () => {
  const { visible: loaderVisible, message: loaderMessage } = useLoaderStore();
  const { visible: toastVisible, message: toastMessage, type, duration, hideToast } =
    useToastStore();
  const { alert, hideAlert, modal, hideModal } = useModalStore();
  const { sheet, hideBottomSheet } = useBottomSheetStore();
  const bottomSheetRef = useRef<AppBottomSheetRef>(null);

  useEffect(() => {
    if (sheet) {
      bottomSheetRef.current?.open();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [sheet]);

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
      <Portal>
        <Dialog visible={Boolean(alert)} onDismiss={hideAlert}>
          <Dialog.Title>{alert?.title}</Dialog.Title>
          {alert?.message || alert?.content ? (
            <Dialog.Content>
              {alert.content ?? <Text>{alert.message}</Text>}
            </Dialog.Content>
          ) : null}
          <Dialog.Actions>
            <AppButton label={alert?.okText ?? 'OK'} onPress={handleAlertOk} />
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={Boolean(modal)} onDismiss={handleModalCancel}>
          <Dialog.Title>{modal?.title}</Dialog.Title>
          {modal?.message || modal?.content ? (
            <Dialog.Content>{modal.content ?? <Text>{modal.message}</Text>}</Dialog.Content>
          ) : null}
          <Dialog.Actions>
            {modal?.cancelText ? (
              <AppButton label={modal.cancelText} variant="outline" onPress={handleModalCancel} />
            ) : null}
            <AppButton label={modal?.okText ?? 'OK'} onPress={handleModalOk} />
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={toastVisible}
        duration={duration}
        onDismiss={hideToast}
        style={[styles.toast, { backgroundColor: toastColors[type] }]}
      >
        {toastMessage}
      </Snackbar>

      <Modal visible={loaderVisible} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            {loaderMessage ? <Text style={styles.loaderText}>{loaderMessage}</Text> : null}
          </View>
        </View>
      </Modal>

      <AppBottomSheet
        ref={bottomSheetRef}
        snapPoints={sheet?.snapPoints}
        scrollable={sheet?.scrollable}
        onDismiss={() => {
          const onDismiss = sheet?.onDismiss;
          hideBottomSheet();
          onDismiss?.();
        }}
      >
        {sheet?.title ? <Text style={typography.h3}>{sheet.title}</Text> : null}
        {sheet?.content}
      </AppBottomSheet>
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
    backgroundColor: colors.overlay,
    padding: spacing.xl,
  },
  loaderBox: {
    minWidth: 180,
    gap: spacing.md,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  loaderText: {
    color: colors.text,
    textAlign: 'center',
  },
});
