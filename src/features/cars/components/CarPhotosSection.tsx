import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { MAX_CAR_IMAGES } from '@core/constants/app';
import type { MediaUri } from '@core/types/media';
import { MediaUploader } from '@shared/media';

interface CarPhotosSectionProps {
  images: MediaUri[];
  onChange: (images: MediaUri[]) => void;
}

export const CarPhotosSection = memo<CarPhotosSectionProps>(({ images, onChange }) => {
  const { colors } = useThemeContext();

  return (
    <View style={styles.wrap}>
      <Text style={typography.h3}>Car photos</Text>
      <Text style={styles.hint}>
        Add up to {MAX_CAR_IMAGES} photos. Tap a photo to view full screen, use × to remove, + to
        add, or tap the refresh icon on a photo to replace it.
      </Text>
      <MediaUploader images={images} onChange={onChange} imageHeight={180} />
      {images.length >= MAX_CAR_IMAGES ? (
        <Text style={[styles.limitHint, { color: colors.warning }]}>
          Maximum reached — remove a photo to add another.
        </Text>
      ) : null}
      {images.length === 0 ? (
        <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
          No photos yet — tap “Add photo” to upload.
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  hint: { ...typography.bodySmall, marginTop: spacing.xs, marginBottom: spacing.md },
  limitHint: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  emptyHint: {
    ...typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
