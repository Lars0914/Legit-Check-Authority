import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Platform,
  Pressable,
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

interface Offset {
  x: number;
  y: number;
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

function panBounds(
  scale: number,
  viewportW: number,
  viewportH: number,
): { minX: number; maxX: number; minY: number; maxY: number } {
  const extraX = (BASE_IMAGE_W * scale - viewportW) / 2;
  const extraY = (BASE_IMAGE_H * scale - viewportH) / 2;

  return {
    minX: extraX > 0 ? -extraX : 0,
    maxX: extraX > 0 ? extraX : 0,
    minY: extraY > 0 ? -extraY : 0,
    maxY: extraY > 0 ? extraY : 0,
  };
}

function clampOffset(
  next: Offset,
  scale: number,
  viewportW: number,
  viewportH: number,
): Offset {
  const bounds = panBounds(scale, viewportW, viewportH);
  return {
    x: clamp(next.x, bounds.minX, bounds.maxX),
    y: clamp(next.y, bounds.minY, bounds.maxY),
  };
}

export function ImageLightbox({
  uri,
  visible,
  label,
  cropHint,
  onClose,
}: Props) {
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ w: SCREEN_W, h: SCREEN_H * 0.55 });

  const zoomRef = useRef(zoomLevel);
  const offsetRef = useRef(offset);
  const panStartRef = useRef<Offset>({ x: 0, y: 0 });
  const viewportRef = useRef(viewport);

  zoomRef.current = zoomLevel;
  offsetRef.current = offset;
  viewportRef.current = viewport;

  const resetZoom = useCallback(() => {
    setZoomLevel(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleClose = useCallback(() => {
    resetZoom();
    onClose();
  }, [onClose, resetZoom]);

  const applyZoom = useCallback((next: number) => {
    const currentZoom = zoomRef.current;
    const newZoom = clamp(next, MIN_ZOOM, MAX_ZOOM);
    if (newZoom === currentZoom) return;

    const ratio = newZoom / currentZoom;
    const { w, h } = viewportRef.current;
    const currentOffset = offsetRef.current;

    setZoomLevel(newZoom);
    setOffset(
      clampOffset(
        {
          x: currentOffset.x * ratio,
          y: currentOffset.y * ratio,
        },
        newZoom,
        w,
        h,
      ),
    );
  }, []);

  const adjustZoom = useCallback(
    (delta: number) => {
      applyZoom(zoomRef.current + delta);
    },
    [applyZoom],
  );

  const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setViewport({ w: width, h: height });
      setOffset((prev) =>
        clampOffset(prev, zoomRef.current, width, height),
      );
    }
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => zoomRef.current > MIN_ZOOM,
        onMoveShouldSetPanResponder: () => zoomRef.current > MIN_ZOOM,
        onPanResponderGrant: () => {
          panStartRef.current = { ...offsetRef.current };
        },
        onPanResponderMove: (_, gesture) => {
          const { w, h } = viewportRef.current;
          setOffset(
            clampOffset(
              {
                x: panStartRef.current.x + gesture.dx,
                y: panStartRef.current.y + gesture.dy,
              },
              zoomRef.current,
              w,
              h,
            ),
          );
        },
      }),
    [],
  );

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

        <View
          style={styles.viewport}
          onLayout={handleViewportLayout}
          {...panResponder.panHandlers}>
          <View
            style={[
              styles.stage,
              { width: viewport.w, height: viewport.h },
            ]}>
            <View
              style={{
                width: BASE_IMAGE_W,
                height: BASE_IMAGE_H,
                transform: [
                  { translateX: offset.x },
                  { translateY: offset.y },
                  { scale: zoomLevel },
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
