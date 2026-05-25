import React, { memo } from 'react';
import ImageView from 'react-native-image-viewing';
import type { MediaUri } from '@core/types/media';

export interface ImageViewerModalProps {
  visible: boolean;
  images: MediaUri[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageViewerModal = memo<ImageViewerModalProps>(
  ({ visible, images, initialIndex = 0, onClose }) => {
    const imageSources = images.map(uri => ({ uri }));

    return (
      <ImageView
        images={imageSources}
        imageIndex={initialIndex}
        visible={visible}
        onRequestClose={onClose}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
        presentationStyle="overFullScreen"
        backgroundColor="#000000"
      />
    );
  },
);
