import React, { memo, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { MAX_CAR_IMAGES } from '@core/constants/app';
import { ensureAndroidCameraPermission } from '@core/helpers/androidMediaPermissions';
import i18n from '@core/i18n';
import type { MediaUri } from '@core/types/media';
import { ImageSlider } from './ImageSlider';

interface MediaUploaderProps {
  images: MediaUri[];
  onChange: (images: MediaUri[]) => void;
  maxImages?: number;
  imageHeight?: number;
}

const showPickerError = (response: ImagePickerResponse): void => {
  if (response.didCancel) {
    return;
  }
  if (response.errorMessage) {
    Alert.alert(i18n.t('media.couldNotOpenPhotos'), response.errorMessage);
  } else if (response.errorCode === 'permission') {
    Alert.alert(
      i18n.t('media.permissionRequiredTitle'),
      i18n.t('media.permissionRequiredMessage'),
    );
  }
};

const pickFromLibrary = async (selectionLimit: number): Promise<MediaUri[]> =>
  new Promise(resolve => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit,
        quality: 0.8,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          resolve([]);
          return;
        }
        if (response.errorCode || response.errorMessage) {
          showPickerError(response);
          resolve([]);
          return;
        }
        const uris =
          response.assets?.map(a => a.uri).filter((u): u is string => !!u) ?? [];
        resolve(uris);
      },
    );
  });

const pickFromCamera = async (): Promise<MediaUri | null> => {
  const allowed = await ensureAndroidCameraPermission();
  if (!allowed) {
    return null;
  }

  return new Promise(resolve => {
    launchCamera({ mediaType: 'photo', quality: 0.8 }, res => {
      if (res.didCancel) {
        resolve(null);
        return;
      }
      if (res.errorCode || res.errorMessage) {
        showPickerError(res);
        resolve(null);
        return;
      }
      resolve(res.assets?.[0]?.uri ?? null);
    });
  });
};

const showImageSourcePicker = (
  onGallery: () => void,
  onCamera: () => void,
): void => {
  if (Platform.OS === 'ios') {
    Alert.alert(i18n.t('media.choosePhoto'), undefined, [
      { text: i18n.t('media.photoLibrary'), onPress: onGallery },
      { text: i18n.t('media.camera'), onPress: onCamera },
      { text: i18n.t('common.cancel'), style: 'cancel' },
    ]);
  } else {
    Alert.alert(i18n.t('media.choosePhoto'), undefined, [
      { text: i18n.t('media.gallery'), onPress: onGallery },
      { text: i18n.t('media.camera'), onPress: onCamera },
      { text: i18n.t('common.cancel'), style: 'cancel' },
    ]);
  }
};

export const MediaUploader = memo<MediaUploaderProps>(
  ({ images, onChange, maxImages = MAX_CAR_IMAGES, imageHeight = 160 }) => {
    const handleAdd = useCallback(() => {
      const remaining = maxImages - images.length;
      if (remaining <= 0) {
        Alert.alert(
          i18n.t('media.limitReachedTitle'),
          i18n.t('media.limitReachedMessage', { max: maxImages }),
        );
        return;
      }

      showImageSourcePicker(
        async () => {
          const picked = await pickFromLibrary(remaining);
          if (picked.length) {
            onChange([...images, ...picked]);
          }
        },
        async () => {
          const uri = await pickFromCamera();
          if (uri) {
            onChange([...images, uri]);
          }
        },
      );
    }, [images, maxImages, onChange]);

    const handleDelete = useCallback(
      (index: number) => {
        Alert.alert(i18n.t('media.removePhotoTitle'), i18n.t('media.removePhotoMessage'), [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          {
            text: i18n.t('common.remove'),
            style: 'destructive',
            onPress: () => onChange(images.filter((_, i) => i !== index)),
          },
        ]);
      },
      [images, onChange],
    );

    const handleReplace = useCallback(
      (index: number) => {
        showImageSourcePicker(
          async () => {
            const picked = await pickFromLibrary(1);
            if (picked[0]) {
              const next = [...images];
              next[index] = picked[0];
              onChange(next);
            }
          },
          async () => {
            const uri = await pickFromCamera();
            if (uri) {
              const next = [...images];
              next[index] = uri;
              onChange(next);
            }
          },
        );
      },
      [images, onChange],
    );

    return (
      <ImageSlider
        images={images}
        editable
        maxImages={maxImages}
        onAddImage={handleAdd}
        onDeleteImage={handleDelete}
        onReplaceImage={handleReplace}
        imageHeight={imageHeight}
      />
    );
  },
);
