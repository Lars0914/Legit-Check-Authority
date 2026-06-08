import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ImageLightbox } from "./ImageLightbox";
import { resolveArchiveImageUrl } from "../lib/imageUrl";
import { theme } from "../theme";
import type { ArchiveImage as ArchiveImageType } from "../types/api";

interface Props {
  image: ArchiveImageType;
  priority?: boolean;
}

export function ArchiveImage({ image, priority = false }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const thumbUri = resolveArchiveImageUrl(image.url, "thumb");
  const fullUri = resolveArchiveImageUrl(image.url, "full");

  useEffect(() => {
    setLoading(true);
    setError(false);
    if (priority) {
      Image.prefetch(thumbUri).catch(() => undefined);
    }
  }, [image.url, priority, thumbUri]);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => !error && !loading && setLightboxOpen(true)}
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
            <Image
              source={{ uri: thumbUri, cache: "force-cache" }}
              style={styles.image}
              resizeMode="cover"
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          )}
        </View>
      </Pressable>

      <ImageLightbox
        uri={fullUri}
        visible={lightboxOpen}
        description={image.description}
        onClose={() => setLightboxOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
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
