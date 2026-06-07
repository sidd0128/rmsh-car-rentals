import React, { memo, useCallback, useState } from 'react';
import {
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { spacing } from '@app/theme/spacing';
import { radius } from '@app/theme/radius';
import type { MediaUri } from '@core/types/media';
import { ImageViewerModal } from './ImageViewerModal';
import { reportImageLoadError } from './reportImageLoadError';

export interface ImageSliderProps {
  images: MediaUri[];
  editable?: boolean;
  maxImages?: number;
  onAddImage?: () => void;
  onDeleteImage?: (index: number) => void;
  onReplaceImage?: (index: number) => void;
  imageHeight?: number;
  imageWidth?: number;
}

export const ImageSlider = memo<ImageSliderProps>(
  ({
    images,
    editable = false,
    maxImages = 4,
    onAddImage,
    onDeleteImage,
    onReplaceImage,
    imageHeight = 200,
    imageWidth,
  }) => {
    const { colors } = useThemeContext();
    const [activeIndex, setActiveIndex] = useState(0);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [loading, setLoading] = useState<Record<number, boolean>>({});

    const itemWidth = imageWidth ?? 280;

    const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / (itemWidth + spacing.sm));
      setActiveIndex(index);
    }, [itemWidth]);

    const openViewer = useCallback((index: number) => {
      setViewerIndex(index);
      setViewerVisible(true);
    }, []);

    if (!images.length && !editable) {
      return (
        <View
          style={[
            styles.empty,
            { height: imageHeight, backgroundColor: colors.borderLight },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No images</Text>
        </View>
      );
    }

    if (!images.length && editable && onAddImage) {
      return (
        <Pressable
          onPress={onAddImage}
          style={[
            styles.addBtn,
            styles.emptyAdd,
            {
              height: imageHeight,
              borderColor: colors.border,
            },
          ]}
        >
          <IconButton icon="camera-plus" size={40} iconColor={colors.primary} />
          <Text style={[styles.addText, { color: colors.primary }]}>Add photo</Text>
        </Pressable>
      );
    }

    return (
      <View>
        <FlatList
          horizontal
          data={images}
          keyExtractor={(_, i) => `img-${i}`}
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemWidth + spacing.sm}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <View style={[styles.slide, { width: itemWidth, marginRight: spacing.sm }]}>
              <Pressable onPress={() => openViewer(index)}>
                {loading[index] !== false && (
                  <ActivityIndicator style={styles.loader} color={colors.primary} />
                )}
                <Image
                  source={{ uri: item }}
                  style={[
                    styles.image,
                    {
                      width: itemWidth,
                      height: imageHeight,
                      backgroundColor: colors.borderLight,
                    },
                  ]}
                  onLoadStart={() => setLoading(p => ({ ...p, [index]: true }))}
                  onLoadEnd={() => setLoading(p => ({ ...p, [index]: false }))}
                  onError={() => reportImageLoadError(item, 'ImageSlider')}
                />
              </Pressable>
              {editable ? (
                <View style={styles.actions} pointerEvents="box-none">
                  {onReplaceImage ? (
                    <IconButton
                      icon="image-sync"
                      size={20}
                      iconColor={colors.textInverse}
                      style={styles.replace}
                      onPress={() => onReplaceImage(index)}
                      accessibilityLabel="Replace photo"
                    />
                  ) : null}
                  {onDeleteImage ? (
                    <IconButton
                      icon="close-circle"
                      size={22}
                      iconColor={colors.error}
                      style={styles.delete}
                      onPress={() => onDeleteImage(index)}
                      accessibilityLabel="Remove photo"
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          )}
          ListFooterComponent={
            editable && images.length < maxImages && onAddImage ? (
              <Pressable
                onPress={onAddImage}
                style={[
                  styles.addBtn,
                  {
                    width: itemWidth,
                    height: imageHeight,
                    borderColor: colors.border,
                  },
                ]}
              >
                <IconButton icon="camera-plus" size={32} iconColor={colors.primary} />
                <Text style={[styles.addText, { color: colors.primary }]}>Add photo</Text>
              </Pressable>
            ) : null
          }
        />
        {images.length > 1 ? (
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: colors.border },
                  i === activeIndex && [
                    styles.dotActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
              />
            ))}
          </View>
        ) : null}
        <ImageViewerModal
          visible={viewerVisible}
          images={images}
          initialIndex={viewerIndex}
          onClose={() => setViewerVisible(false)}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  slide: { position: 'relative' },
  image: { borderRadius: radius.md },
  loader: { position: 'absolute', alignSelf: 'center', top: '40%', zIndex: 1 },
  actions: { position: 'absolute', top: 0, right: 0, flexDirection: 'row' },
  delete: { margin: 0 },
  replace: {
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  emptyAdd: {
    width: '100%',
    marginRight: 0,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 18 },
  empty: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {},
  addBtn: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  addText: { fontSize: 12 },
});
