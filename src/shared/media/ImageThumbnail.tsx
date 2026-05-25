import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { colors } from '@app/theme';
import { radius } from '@app/theme/radius';
import type { MediaUri } from '@core/types/media';

interface ImageThumbnailProps {
  uri: MediaUri;
  size?: number;
  onPress?: () => void;
  onDelete?: () => void;
  editable?: boolean;
}

export const ImageThumbnail = memo<ImageThumbnailProps>(
  ({ uri, size = 88, onPress, onDelete, editable }) => (
    <Pressable onPress={onPress} style={[styles.wrapper, { width: size, height: size }]}>
      <Image source={{ uri }} style={[styles.image, { width: size, height: size }]} />
      {editable && onDelete ? (
        <View style={styles.deleteBtn}>
          <IconButton icon="close-circle" size={20} iconColor={colors.error} onPress={onDelete} />
        </View>
      ) : null}
    </Pressable>
  ),
);

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginRight: 8,
  },
  image: {
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
  },
  deleteBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
});
