import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "../theme";

interface Props {
  uri: string;
  visible: boolean;
  label?: string;
  cropHint?: string | null;
  onClose: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export function ImageLightbox({
  uri,
  visible,
  label,
  cropHint,
  onClose,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const [zoomLevel, setZoomLevel] = useState(1);

  const resetZoom = useCallback(() => {
    scale.setValue(1);
    setZoomLevel(1);
  }, [scale]);

  const handleClose = useCallback(() => {
    resetZoom();
    onClose();
  }, [onClose, resetZoom]);

  const toggleZoom = useCallback(() => {
    const next = zoomLevel >= 2 ? 1 : 2.5;
    setZoomLevel(next);
    Animated.spring(scale, {
      toValue: next,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [scale, zoomLevel]);

  const adjustZoom = useCallback(
    (delta: number) => {
      const next = Math.min(4, Math.max(1, zoomLevel + delta));
      setZoomLevel(next);
      Animated.spring(scale, {
        toValue: next,
        useNativeDriver: true,
        friction: 7,
      }).start();
    },
    [scale, zoomLevel],
  );

  if (!visible) return null;

  const imageNode = (
    <Animated.Image
      source={{ uri }}
      style={[
        styles.image,
        Platform.OS === "android" && { transform: [{ scale }] },
      ]}
      resizeMode="contain"
    />
  );

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
            {cropHint ? (
              <Text style={styles.hint}>{cropHint}</Text>
            ) : null}
          </View>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {Platform.OS === "ios" ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            bouncesZoom
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}>
            <Pressable onPress={toggleZoom}>
              <Animated.Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
              />
            </Pressable>
          </ScrollView>
        ) : (
          <Pressable style={styles.androidImageWrap} onPress={toggleZoom}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              maximumZoomScale={1}
              minimumZoomScale={1}
              bounces={false}
              scrollEnabled={zoomLevel > 1}>
              {imageNode}
            </ScrollView>
          </Pressable>
        )}

        <View style={styles.controls}>
          <Text style={styles.hintText}>
            {Platform.OS === "ios"
              ? "Pinch to zoom · Double-tap image · Tap ✕ to close"
              : "Tap image to zoom · Use +/- buttons"}
          </Text>
          {Platform.OS === "android" ? (
            <View style={styles.zoomRow}>
              <Pressable
                style={styles.zoomBtn}
                onPress={() => adjustZoom(-0.5)}
                disabled={zoomLevel <= 1}>
                <Text style={styles.zoomBtnText}>−</Text>
              </Pressable>
              <Text style={styles.zoomLevel}>{Math.round(zoomLevel * 100)}%</Text>
              <Pressable
                style={styles.zoomBtn}
                onPress={() => adjustZoom(0.5)}
                disabled={zoomLevel >= 4}>
                <Text style={styles.zoomBtnText}>+</Text>
              </Pressable>
            </View>
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
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: SCREEN_H * 0.55,
  },
  androidImageWrap: {
    flex: 1,
    justifyContent: "center",
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H * 0.62,
  },
  controls: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    alignItems: "center",
    gap: 12,
  },
  hintText: {
    fontSize: 12,
    color: "rgba(248, 250, 252, 0.55)",
    textAlign: "center",
  },
  zoomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnText: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 24,
  },
  zoomLevel: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "600",
    minWidth: 48,
    textAlign: "center",
  },
});
