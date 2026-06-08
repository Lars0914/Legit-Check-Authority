import React, { useCallback, useRef } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  type ViewToken,
} from "react-native";
import { ArchiveImage } from "./ArchiveImage";
import { formatArchiveDescription } from "../lib/archiveDescription";
import { prefetchAheadArchiveThumbs } from "../lib/imagePrefetch";
import { theme } from "../theme";
import type { ArchiveImage as ArchiveImageType } from "../types/api";

interface Props {
  images: ArchiveImageType[];
  onOpenImage: (index: number) => void;
}

export function ArchiveModelImageList({ images, onOpenImage }: Props) {
  const imageUrls = images.map((image) => image.url);
  const lastPrefetchFrom = useRef(-1);

  const prefetchFromIndex = useCallback(
    (fromIndex: number) => {
      if (fromIndex === lastPrefetchFrom.current) return;
      lastPrefetchFrom.current = fromIndex;
      prefetchAheadArchiveThumbs(imageUrls, fromIndex, 2);
    },
    [imageUrls],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length === 0) return;
      const maxIndex = Math.max(
        ...viewableItems.map((item) => item.index ?? 0),
      );
      prefetchFromIndex(maxIndex);
    },
  ).current;

  return (
    <FlatList
      data={images}
      keyExtractor={(item) => item.storagePath}
      renderItem={({ item, index }) => {
        const insight = formatArchiveDescription(item.description);
        return (
          <ArchiveImage
            image={item}
            listIndex={index}
            imageUrls={imageUrls}
            priority={index < 3}
            onPress={() => onOpenImage(index)}
            footer={
              insight ? (
                <Text style={styles.imageInsight}>{insight}</Text>
              ) : null
            }
          />
        );
      }}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 20 }}
      scrollEventThrottle={16}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  imageInsight: {
    marginTop: 10,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderBright,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: "500",
  },
});
