import React, { useCallback, useEffect } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useZoomableImage } from "../hooks/useZoomableImage";
import { theme } from "../theme";

interface Props {
  uri: string;
  visible: boolean;
  label?: string;
  cropHint?: string | null;
  description?: string | null;
  onClose: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const BASE_IMAGE_W = SCREEN_W;
const BASE_IMAGE_H = SCREEN_H * 0.62;

export function ImageLightbox({
  uri,
  visible,
  label,
  cropHint,
  description,
  onClose,
}: Props) {
  const zoom = useZoomableImage(BASE_IMAGE_W, BASE_IMAGE_H);

  const handleClose = useCallback(() => {
    zoom.resetZoom();
    onClose();
  }, [onClose, zoom.resetZoom]);

  useEffect(() => {
    if (!visible) {
      zoom.resetZoom();
    }
  }, [visible, zoom.resetZoom]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.topBar}>
          <View style={styles.labelWrap}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            {cropHint ? <Text style={styles.hint}>{cropHint}</Text> : null}
          </View>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View
          style={styles.viewport}
          onLayout={zoom.handleViewportLayout}
          {...zoom.panHandlers}>
          <View
            style={[
              styles.stage,
              { width: zoom.viewport.w, height: zoom.viewport.h },
            ]}>
            <View
              style={{
                width: zoom.baseW,
                height: zoom.baseH,
                transform: [
                  { translateX: zoom.offset.x },
                  { translateY: zoom.offset.y },
                  { scale: zoom.zoomLevel },
                ],
              }}>
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
          {zoom.zoomLevel > zoom.minZoom + 0.05 ? (
            <Text style={styles.zoomLevel}>
              {Math.round(zoom.zoomLevel * 100)}%
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 54 : 24,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  labelWrap: { flex: 1, marginRight: 12 },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  hint: {
    fontSize: 12,
    color: theme.colors.accentCyan,
    marginTop: 4,
    textTransform: "capitalize",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "600",
  },
  viewport: {
    flex: 1,
    overflow: "hidden",
  },
  stage: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: BASE_IMAGE_W,
    height: BASE_IMAGE_H,
  },
  controls: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    alignItems: "center",
    gap: 8,
    maxHeight: 200,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(248, 250, 252, 0.9)",
    textAlign: "center",
    marginBottom: 4,
  },
  zoomLevel: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
  },
});
