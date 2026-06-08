import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ArchiveImage } from "./ArchiveImage";
import { formatArchiveDescription } from "../lib/archiveDescription";
import { theme } from "../theme";
import type { ArchiveImage as ArchiveImageType } from "../types/api";

interface Props {
  images: ArchiveImageType[];
  onOpenImage: (index: number) => void;
}

/** Static list — renders inside ArchiveScreen ScrollView (no nested FlatList). */
export function ArchiveModelImageList({ images, onOpenImage }: Props) {
  const imageUrls = images.map((image) => image.url);

  return (
    <View style={styles.list}>
      {images.map((item, index) => {
        const insight = formatArchiveDescription(item.description);
        return (
          <ArchiveImage
            key={item.storagePath}
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
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
  },
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
