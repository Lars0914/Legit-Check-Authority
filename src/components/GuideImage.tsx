import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { resolveGuideImageUrl } from "../lib/imageUrl";
import { theme } from "../theme";
import type { PhotoRef } from "../types/api";

const PAIRED_IMAGE_HEIGHT = 200;

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
          <Image
            key={imageUri}
            source={{ uri: imageUri, cache: "reload" }}
            style={[
              styles.image,
              paired && !fullWidth && styles.imagePaired,
              fullWidth && styles.imageFullWidth,
            ]}
            resizeMode="contain"
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
      {photo.caption ? (
        <Text style={styles.caption}>{photo.caption}</Text>
      ) : null}
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
    minHeight: PAIRED_IMAGE_HEIGHT,
    height: PAIRED_IMAGE_HEIGHT,
    width: "100%",
  },
  boxFullWidth: {
    minHeight: 220,
    width: "100%",
  },
  image: { width: "100%", height: 220 },
  imagePaired: { height: PAIRED_IMAGE_HEIGHT },
  imageFullWidth: { height: 280 },
  loader: { position: "absolute" },
  missing: { padding: 12 },
  missingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  caption: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
});
