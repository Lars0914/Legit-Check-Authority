import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CachedImage } from "./CachedImage";
import { ImageLightbox } from "./ImageLightbox";
import { resolveGuideImageUrl } from "../lib/imageUrl";
import { theme } from "../theme";
import type { PhotoRef } from "../types/api";

interface Props {
  photo: PhotoRef;
  label: string;
  fullWidth?: boolean;
  paired?: boolean;
}

export function GuideImage({
  photo,
  label,
  fullWidth = false,
  paired = false,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageUri = resolveGuideImageUrl(photo.url, retrying);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setRetrying(false);
  }, [photo.url]);

  if (!photo.found) {
    return (
      <View style={[styles.box, styles.missing]}>
        <Text style={styles.missingText}>Image not found: {photo.fileName}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {photo.cropHint ? (
          <View style={styles.hintPill}>
            <Text style={styles.hint}>{photo.cropHint}</Text>
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={() => !error && !loading && setLightboxOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Zoom ${label} image`}
        style={({ pressed }) => [pressed && styles.pressed]}>
        <View
          style={[
            styles.box,
            paired && !fullWidth && styles.boxPaired,
            fullWidth && styles.boxFullWidth,
          ]}>
          {loading ? (
            <ActivityIndicator style={styles.loader} color={theme.colors.accentCyan} />
          ) : null}
          {error ? (
            <Text style={styles.missingText}>Failed to load image</Text>
          ) : (
            <CachedImage
              key={imageUri}
              uri={imageUri}
              style={[
                styles.image,
                paired && !fullWidth && styles.imagePaired,
                fullWidth && styles.imageFullWidth,
              ]}
              resizeMode="contain"
              priority="normal"
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
          {!loading && !error ? (
            <View style={styles.zoomBadge}>
              <Text style={styles.zoomBadgeText}>Tap to zoom</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      {photo.caption ? (
        <Text style={styles.caption}>{photo.caption}</Text>
      ) : null}

      <ImageLightbox
        slides={[
          {
            uri: imageUri,
            label,
            cropHint: photo.cropHint,
          },
        ]}
        index={0}
        visible={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  hintPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  hint: {
    fontSize: 10,
    color: theme.colors.accentCyan,
    textTransform: "capitalize",
  },
  pressed: { opacity: 0.92 },
  box: {
    minHeight: 160,
    backgroundColor: theme.colors.imageBg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  boxPaired: {
    width: "100%",
  },
  boxFullWidth: {
    minHeight: 220,
    width: "100%",
  },
  image: { width: "100%", height: 220 },
  imagePaired: { width: "100%", height: undefined, aspectRatio: 4 / 3 },
  imageFullWidth: { height: 280 },
  loader: { position: "absolute" },
  missing: { padding: 12 },
  missingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  zoomBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
  },
  zoomBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#F8FAFC",
    letterSpacing: 0.3,
  },
  caption: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
});
