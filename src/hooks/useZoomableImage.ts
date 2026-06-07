import { useCallback, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder } from "react-native";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

interface Offset {
  x: number;
  y: number;
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

export function useZoomableImage(baseW: number, baseH: number) {
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ w: baseW, h: baseH });

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

  const applyZoom = useCallback(
    (next: number) => {
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
          baseW,
          baseH,
          w,
          h,
        ),
      );
    },
    [baseH, baseW],
  );

  const adjustZoom = useCallback(
    (delta: number) => {
      applyZoom(zoomRef.current + delta);
    },
    [applyZoom],
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
              baseW,
              baseH,
              w,
              h,
            ),
          );
        },
      }),
    [baseH, baseW],
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
