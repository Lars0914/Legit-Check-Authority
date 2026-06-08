import { useCallback, useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
} from "react-native";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_ZOOM = 2.5;

interface Offset {
  x: number;
  y: number;
}

interface TouchPoint {
  pageX: number;
  pageY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function panBounds(
  scale: number,
  baseW: number,
  baseH: number,
  viewportW: number,
  viewportH: number,
) {
  const extraX = (baseW * scale - viewportW) / 2;
  const extraY = (baseH * scale - viewportH) / 2;

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
  baseW: number,
  baseH: number,
  viewportW: number,
  viewportH: number,
): Offset {
  const bounds = panBounds(scale, baseW, baseH, viewportW, viewportH);
  return {
    x: clamp(next.x, bounds.minX, bounds.maxX),
    y: clamp(next.y, bounds.minY, bounds.maxY),
  };
}

function touchDistance(a: TouchPoint, b: TouchPoint): number {
  const dx = a.pageX - b.pageX;
  const dy = a.pageY - b.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function touchMidpoint(
  a: TouchPoint,
  b: TouchPoint,
  viewportW: number,
  viewportH: number,
): Offset {
  return {
    x: (a.pageX + b.pageX) / 2 - viewportW / 2,
    y: (a.pageY + b.pageY) / 2 - viewportH / 2,
  };
}

export function useZoomableImage(baseW: number, baseH: number) {
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ w: baseW, h: baseH });

  const zoomRef = useRef(zoomLevel);
  const offsetRef = useRef(offset);
  const panStartRef = useRef<Offset>({ x: 0, y: 0 });
  const viewportRef = useRef(viewport);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(MIN_ZOOM);
  const pinchMidpointRef = useRef<Offset>({ x: 0, y: 0 });
  const pinchStartOffsetRef = useRef<Offset>({ x: 0, y: 0 });
  const lastTapRef = useRef(0);
  const isPinchingRef = useRef(false);

  zoomRef.current = zoomLevel;
  offsetRef.current = offset;
  viewportRef.current = viewport;

  const resetZoom = useCallback(() => {
    setZoomLevel(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  }, []);

  const applyZoom = useCallback(
    (next: number, focal?: Offset) => {
      const currentZoom = zoomRef.current;
      const newZoom = clamp(next, MIN_ZOOM, MAX_ZOOM);
      if (Math.abs(newZoom - currentZoom) < 0.001) return;

      const ratio = newZoom / currentZoom;
      const { w, h } = viewportRef.current;
      const currentOffset = offsetRef.current;
      const focalPoint = focal ?? { x: 0, y: 0 };

      const nextOffset = clampOffset(
        {
          x: focalPoint.x - (focalPoint.x - currentOffset.x) * ratio,
          y: focalPoint.y - (focalPoint.y - currentOffset.y) * ratio,
        },
        newZoom,
        baseW,
        baseH,
        w,
        h,
      );

      setZoomLevel(newZoom);
      setOffset(nextOffset);
    },
    [baseH, baseW],
  );

  const adjustZoom = useCallback(
    (delta: number) => {
      applyZoom(zoomRef.current + delta);
    },
    [applyZoom],
  );

  const handleDoubleTap = useCallback(
    (event: GestureResponderEvent) => {
      const { w, h } = viewportRef.current;
      const touch = event.nativeEvent;
      const focal = {
        x: touch.locationX - w / 2,
        y: touch.locationY - h / 2,
      };

      if (zoomRef.current > MIN_ZOOM + 0.05) {
        resetZoom();
        return;
      }

      applyZoom(DOUBLE_TAP_ZOOM, focal);
    },
    [applyZoom, resetZoom],
  );

  const handleViewportLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width <= 0 || height <= 0) return;
      setViewport({ w: width, h: height });
      setOffset((prev) =>
        clampOffset(prev, zoomRef.current, baseW, baseH, width, height),
      );
    },
    [baseH, baseW],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          isPinchingRef.current ||
          gesture.numberActiveTouches >= 2 ||
          zoomRef.current > MIN_ZOOM + 0.01,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const touches = event.nativeEvent.touches;
          if (touches.length >= 2) {
            isPinchingRef.current = true;
            const a = touches[0];
            const b = touches[1];
            pinchStartDistanceRef.current = touchDistance(a, b);
            pinchStartZoomRef.current = zoomRef.current;
            pinchStartOffsetRef.current = { ...offsetRef.current };
            const { w, h } = viewportRef.current;
            pinchMidpointRef.current = touchMidpoint(a, b, w, h);
            return;
          }

          const now = Date.now();
          if (now - lastTapRef.current < DOUBLE_TAP_MS) {
            lastTapRef.current = 0;
            handleDoubleTap(event);
            return;
          }
          lastTapRef.current = now;
          panStartRef.current = { ...offsetRef.current };
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches;

          if (touches.length >= 2) {
            isPinchingRef.current = true;
            const a = touches[0];
            const b = touches[1];
            const distance = touchDistance(a, b);

            if (!pinchStartDistanceRef.current) {
              pinchStartDistanceRef.current = distance;
              pinchStartZoomRef.current = zoomRef.current;
              pinchStartOffsetRef.current = { ...offsetRef.current };
              const { w, h } = viewportRef.current;
              pinchMidpointRef.current = touchMidpoint(a, b, w, h);
              return;
            }

            const scaleFactor = distance / pinchStartDistanceRef.current;
            const nextZoom = pinchStartZoomRef.current * scaleFactor;
            applyZoom(nextZoom, pinchMidpointRef.current);
            return;
          }

          if (isPinchingRef.current) {
            return;
          }

          if (zoomRef.current <= MIN_ZOOM + 0.01) {
            return;
          }

          const { w, h } = viewportRef.current;
          setOffset(
            clampOffset(
              {
                x: panStartRef.current.x + gesture.dx,
                y: panStartRef.current.y + gesture.dy,
              },
              zoomRef.current,
              baseW,
              baseH,
              w,
              h,
            ),
          );
        },
        onPanResponderRelease: () => {
          pinchStartDistanceRef.current = null;
          isPinchingRef.current = false;
        },
        onPanResponderTerminate: () => {
          pinchStartDistanceRef.current = null;
          isPinchingRef.current = false;
        },
      }),
    [applyZoom, baseH, baseW, handleDoubleTap],
  );

  return {
    zoomLevel,
    offset,
    viewport,
    resetZoom,
    applyZoom,
    adjustZoom,
    handleViewportLayout,
    panHandlers: panResponder.panHandlers,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    zoomStep: ZOOM_STEP,
    baseW,
    baseH,
  };
}
