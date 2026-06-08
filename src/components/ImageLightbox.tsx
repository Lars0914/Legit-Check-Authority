import React, { useCallback, useEffect } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useZoomableImage } from "../hooks/useZoomableImage";
import { formatArchiveDescription } from "../lib/archiveDescription";
import { theme } from "../theme";

export interface LightboxSlide {
  uri: string;
  description?: string | null;
  label?: string;
  cropHint?: string | null;
}

interface Props {
  slides: LightboxSlide[];
  index: number;
  visible: boolean;
  onIndexChange?: (index: number) => void;
  onClose: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const BASE_IMAGE_W = SCREEN_W;
const BASE_IMAGE_H = SCREEN_H * 0.55;

export function ImageLightbox({
  slides,
  index,
  visible,
  onIndexChange,
  onClose,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const sideNavInset = screenWidth >= 1024 ? 24 : screenWidth >= 768 ? 16 : 12;
  const zoom = useZoomableImage(BASE_IMAGE_W, BASE_IMAGE_H);
  const slide = slides[index];
  const canNavigate = slides.length > 1 && typeof onIndexChange === "function";
  const canGoPrevious = canNavigate && index > 0;
  const canGoNext = canNavigate && index < slides.length - 1;

  const handleClose = useCallback(() => {
    zoom.resetZoom();
    onClose();
  }, [onClose, zoom.resetZoom]);

  const goPrevious = useCallback(() => {
    if (!canGoPrevious || !onIndexChange) return;
    zoom.resetZoom();
    onIndexChange(index - 1);
  }, [canGoPrevious, index, onIndexChange, zoom.resetZoom]);

  const goNext = useCallback(() => {
    if (!canGoNext || !onIndexChange) return;
    zoom.resetZoom();
    onIndexChange(index + 1);
  }, [canGoNext, index, onIndexChange, zoom.resetZoom]);

  useEffect(() => {
    if (!visible) {
      zoom.resetZoom();
    }
  }, [visible, zoom.resetZoom]);

  useEffect(() => {
    zoom.resetZoom();
  }, [slide?.uri, zoom.resetZoom]);

  if (!visible || !slide) return null;

  const description = formatArchiveDescription(slide.description);

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
            {slide.label ? <Text style={styles.label}>{slide.label}</Text> : null}
            {slide.cropHint ? (
              <Text style={styles.hint}>{slide.cropHint}</Text>
            ) : null}
          </View>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.viewerWrap}>
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
                  key={slide.uri}
                  source={{ uri: slide.uri }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          {canNavigate ? (
            <>
              <View style={[styles.sideNavSlot, { left: sideNavInset }]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.navBtn,
                    !canGoPrevious && styles.navBtnDisabled,
                    pressed && canGoPrevious && styles.navBtnPressed,
                  ]}
                  onPress={goPrevious}
                  disabled={!canGoPrevious}
                  accessibilityRole="button"
                  accessibilityLabel="Previous image">
                  <Text
                    style={[
                      styles.navBtnText,
                      !canGoPrevious && styles.navBtnTextDisabled,
                    ]}>
                    {"<"}
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.sideNavSlot, { right: sideNavInset }]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.navBtn,
                    !canGoNext && styles.navBtnDisabled,
                    pressed && canGoNext && styles.navBtnPressed,
                  ]}
                  onPress={goNext}
                  disabled={!canGoNext}
                  accessibilityRole="button"
                  accessibilityLabel="Next image">
                  <Text
                    style={[
                      styles.navBtnText,
                      !canGoNext && styles.navBtnTextDisabled,
                    ]}>
                    {">"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.footer}>
          {description ? (
            <ScrollView
              style={styles.descriptionScroll}
              contentContainerStyle={styles.descriptionScrollContent}
              showsVerticalScrollIndicator={false}>
              <Text style={styles.description}>{description}</Text>
            </ScrollView>
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
  viewerWrap: {
    flex: 1,
    position: "relative",
  },
  viewport: {
    flex: 1,
    overflow: "hidden",
  },
  sideNavSlot: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 2,
  },
  stage: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: BASE_IMAGE_W,
    height: BASE_IMAGE_H,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    gap: 12,
    maxHeight: SCREEN_H * 0.32,
  },
  descriptionScroll: {
    maxHeight: SCREEN_H * 0.22,
  },
  descriptionScrollContent: {
    paddingHorizontal: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(248, 250, 252, 0.9)",
    textAlign: "center",
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F8FAFC",
    lineHeight: 22,
    marginTop: -1,
  },
  navBtnTextDisabled: {
    color: "rgba(248, 250, 252, 0.45)",
  },
});
