import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function contentSize(
  zoom: number,
  viewportW: number,
  viewportH: number,
): { w: number; h: number } {
  return {
    w: Math.max(viewportW, BASE_IMAGE_W * zoom),
    h: Math.max(viewportH, BASE_IMAGE_H * zoom),
  };
}

export function ImageLightbox({
  uri,
  visible,
  label,
  cropHint,
  onClose,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffset = useRef({ x: 0, y: 0 });
  const pendingScroll = useRef<{ x: number; y: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [viewport, setViewport] = useState({ w: SCREEN_W, h: SCREEN_H * 0.55 });

  const { w: contentW, h: contentH } = contentSize(
    zoomLevel,
    viewport.w,
    viewport.h,
  );
  const imageW = BASE_IMAGE_W * zoomLevel;
  const imageH = BASE_IMAGE_H * zoomLevel;
  const canPan = contentW > viewport.w || contentH > viewport.h;

  const resetZoom = useCallback(() => {
    pendingScroll.current = null;
    setZoomLevel(MIN_ZOOM);
    scrollOffset.current = { x: 0, y: 0 };
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, []);

  const handleClose = useCallback(() => {
    resetZoom();
    onClose();
  }, [onClose, resetZoom]);

  const applyZoom = useCallback(
    (next: number) => {
      const newZoom = clamp(next, MIN_ZOOM, MAX_ZOOM);
      if (newZoom === zoomLevel) return;

      const oldSize = contentSize(zoomLevel, viewport.w, viewport.h);
      const newSize = contentSize(newZoom, viewport.w, viewport.h);
      const { x: sx, y: sy } = scrollOffset.current;

      const focalX = (sx + viewport.w / 2) / oldSize.w;
      const focalY = (sy + viewport.h / 2) / oldSize.h;

      const targetX = focalX * newSize.w - viewport.w / 2;
      const targetY = focalY * newSize.h - viewport.h / 2;

      pendingScroll.current = {
        x: clamp(targetX, 0, Math.max(0, newSize.w - viewport.w)),
        y: clamp(targetY, 0, Math.max(0, newSize.h - viewport.h)),
      };

      setZoomLevel(newZoom);
    },
    [viewport.h, viewport.w, zoomLevel],
  );

  const adjustZoom = useCallback(
    (delta: number) => {
      applyZoom(zoomLevel + delta);
    },
    [applyZoom, zoomLevel],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffset.current = {
        x: event.nativeEvent.contentOffset.x,
        y: event.nativeEvent.contentOffset.y,
      };
    },
    [],
  );

  const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setViewport({ w: width, h: height });
    }
  }, []);

  useLayoutEffect(() => {
    if (!pendingScroll.current) return;
    const { x, y } = pendingScroll.current;
    pendingScroll.current = null;
    scrollRef.current?.scrollTo({ x, y, animated: false });
    scrollOffset.current = { x, y };
  }, [zoomLevel, contentW, contentH]);

  useEffect(() => {
    if (!visible) {
      resetZoom();
    }
  }, [visible, resetZoom]);

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
              justifyContent: "center",
              alignItems: "center",
            }}
            scrollEnabled={canPan}
            showsHorizontalScrollIndicator={canPan}
            showsVerticalScrollIndicator={canPan}
            bounces={canPan}
            nestedScrollEnabled
            directionalLockEnabled={false}
            scrollEventThrottle={16}
            onScroll={handleScroll}>
            <Image
              source={{ uri }}
              style={{ width: imageW, height: imageH }}
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
