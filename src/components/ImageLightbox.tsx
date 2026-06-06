import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
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
const BASE_IMAGE_W = SCREEN_W;
const BASE_IMAGE_H = SCREEN_H * 0.62;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

export function ImageLightbox({
  uri,
  visible,
  label,
  cropHint,
  onClose,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [viewport, setViewport] = useState({ w: SCREEN_W, h: SCREEN_H * 0.55 });

  const contentW = BASE_IMAGE_W * zoomLevel;
  const contentH = BASE_IMAGE_H * zoomLevel;
  const canPan = zoomLevel > MIN_ZOOM;

  const scrollToCenter = useCallback(
    (level: number) => {
      const w = BASE_IMAGE_W * level;
      const h = BASE_IMAGE_H * level;
      const x = Math.max(0, (w - viewport.w) / 2);
      const y = Math.max(0, (h - viewport.h) / 2);
      scrollRef.current?.scrollTo({ x, y, animated: true });
    },
    [viewport.h, viewport.w],
  );

  const resetZoom = useCallback(() => {
    setZoomLevel(MIN_ZOOM);
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, []);

  const handleClose = useCallback(() => {
    resetZoom();
    onClose();
  }, [onClose, resetZoom]);

  const applyZoom = useCallback((next: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    setZoomLevel(clamped);
  }, []);

  const adjustZoom = useCallback(
    (delta: number) => {
      applyZoom(zoomLevel + delta);
    },
    [applyZoom, zoomLevel],
  );

  const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setViewport({ w: width, h: height });
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      resetZoom();
    }
  }, [visible, resetZoom]);

  useEffect(() => {
    if (!visible) return;
    if (zoomLevel <= MIN_ZOOM) {
      scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      return;
    }
    scrollToCenter(zoomLevel);
  }, [visible, zoomLevel, viewport.w, viewport.h, scrollToCenter]);

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
            {cropHint ? (
              <Text style={styles.hint}>{cropHint}</Text>
            ) : null}
          </View>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.viewport} onLayout={handleViewportLayout}>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={{
              width: contentW,
              height: contentH,
            }}
            scrollEnabled={canPan}
            showsHorizontalScrollIndicator={canPan}
            showsVerticalScrollIndicator={canPan}
            bounces={canPan}
            nestedScrollEnabled
            directionalLockEnabled={false}>
            <Image
              source={{ uri }}
              style={{ width: contentW, height: contentH }}
              resizeMode="contain"
            />
          </ScrollView>
        </View>

        <View style={styles.controls}>
          <Text style={styles.hintText}>
            Use +/- to zoom · Drag to view corners · Tap ✕ to close
          </Text>
          <View style={styles.zoomRow}>
            <Pressable
              style={styles.zoomBtn}
              onPress={() => adjustZoom(-ZOOM_STEP)}
              disabled={zoomLevel <= MIN_ZOOM}>
              <Text style={styles.zoomBtnText}>−</Text>
            </Pressable>
            <Text style={styles.zoomLevel}>{Math.round(zoomLevel * 100)}%</Text>
            <Pressable
              style={styles.zoomBtn}
              onPress={() => adjustZoom(ZOOM_STEP)}
              disabled={zoomLevel >= MAX_ZOOM}>
              <Text style={styles.zoomBtnText}>+</Text>
            </Pressable>
          </View>
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
  scroll: { flex: 1 },
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
