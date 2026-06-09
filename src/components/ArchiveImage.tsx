import React, { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CachedImage } from "./CachedImage";
import { prefetchAheadArchiveThumbs } from "../lib/imagePrefetch";
import { resolveArchiveImageUrl } from "../lib/imageUrl";
import { theme } from "../theme";
import type { ArchiveImage as ArchiveImageType } from "../types/api";

interface Props {
  image: ArchiveImageType;
  priority?: boolean;
  listIndex?: number;
  imageUrls?: string[];
  footer?: ReactNode;
  onPress?: () => void;
}

export function ArchiveImage({
  image,
  priority = false,
  listIndex,
  imageUrls,
  footer,
  onPress,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const thumbUri = resolveArchiveImageUrl(image.url, "thumb", retrying);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setRetrying(false);
  }, [image.url]);

  useEffect(() => {
    if (listIndex == null || !imageUrls?.length) return;
    prefetchAheadArchiveThumbs(imageUrls, listIndex, 2);
  }, [imageUrls, listIndex]);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => !error && !loading && onPress?.()}
        accessibilityRole="button"
        accessibilityLabel="View watch image"
        style={({ pressed }) => [pressed && styles.pressed]}>
        <View style={styles.box}>
          {loading ? (
            <ActivityIndicator
              style={styles.loader}
              color={theme.colors.accentCyan}
            />
          ) : null}
          {error ? (
            <Text style={styles.errorText}>Failed to load image</Text>
          ) : (
            <CachedImage
              key={thumbUri}
              uri={thumbUri}
              style={styles.image}
              resizeMode="cover"
              priority={priority ? "high" : "normal"}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                if (!retrying) {
                  setRetrying(true);
                  setLoading(true);
                  return;
                }
                setLoading(false);
                setError(true);
              }}
            />
          )}
        </View>
      </Pressable>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 0 },
  pressed: { opacity: 0.92 },
  box: {
    minHeight: 220,
    backgroundColor: theme.colors.imageBg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 280,
  },
  loader: { position: "absolute" },
  errorText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    padding: 12,
  },
});
