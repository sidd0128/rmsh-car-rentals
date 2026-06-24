import React, { memo, useMemo } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { radius, spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDateTimeAmPm } from '@core/helpers/date';
import { useTranslation } from '@core/i18n';
import type { RentalAgreementUpload } from '@core/types/domain';
import { ImageSlider } from '@shared/media';

interface SignedRentalAgreementDocumentsProps {
  documents: RentalAgreementUpload[];
}

const documentIsImage = (document: RentalAgreementUpload): boolean =>
  document.contentType.startsWith('image/');

const documentIsPdf = (document: RentalAgreementUpload): boolean =>
  document.contentType === 'application/pdf' ||
  document.fileName.toLowerCase().endsWith('.pdf');

const documentLabel = (document: RentalAgreementUpload, index: number): string =>
  document.fileName || `Signed agreement ${index + 1}`;

export const SignedRentalAgreementDocuments = memo<SignedRentalAgreementDocumentsProps>(
  ({ documents }) => {
    const { t } = useTranslation();
    const { colors } = useThemeContext();
    const imageDocuments = useMemo(
      () => documents.filter(documentIsImage),
      [documents],
    );
    const fileDocuments = useMemo(
      () => documents.filter(document => !documentIsImage(document)),
      [documents],
    );

    const openDocument = async (document: RentalAgreementUpload) => {
      const canOpen = await Linking.canOpenURL(document.url);
      if (!canOpen) {
        Alert.alert(
          t('rentalAgreements.openFailedTitle'),
          t('rentalAgreements.openFailedMessage'),
        );
        return;
      }

      await Linking.openURL(document.url);
    };

    if (!documents.length) {
      return (
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
          {t('rentalAgreements.noSignedDocuments')}
        </Text>
      );
    }

    return (
      <View style={styles.wrap}>
        {imageDocuments.length ? (
          <ImageSlider
            images={imageDocuments.map(document => document.url)}
            imageHeight={140}
          />
        ) : null}

        {fileDocuments.map((document, index) => (
          <Pressable
            key={`${document.url}-${index}`}
            onPress={() => openDocument(document)}
            accessibilityRole="button"
            style={[
              styles.fileRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Icon
              name={documentIsPdf(document) ? 'file-pdf-box' : 'file-document-outline'}
              size={24}
              color={documentIsPdf(document) ? colors.error : colors.primary}
            />
            <View style={styles.fileText}>
              <Text numberOfLines={1} style={[styles.fileName, { color: colors.text }]}>
                {documentLabel(document, index)}
              </Text>
              <Text numberOfLines={1} style={[typography.caption, { color: colors.textMuted }]}>
                {t('rentalAgreements.uploadedAt', {
                  datetime: formatDateTimeAmPm(document.uploadedAt),
                })}
              </Text>
            </View>
            <Icon name="open-in-new" size={20} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  fileRow: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fileText: {
    flex: 1,
    gap: spacing.xxs,
  },
  fileName: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
});
