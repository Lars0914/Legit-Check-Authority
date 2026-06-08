import React from "react";
import {
  Image,
  type ImageResizeMode,
  type ImageStyle,
  type StyleProp,
} from "react-native";
import { isFastImageNativeAvailable } from "../lib/fastImageNative";

type ResizeMode = "contain" | "cover" | "stretch" | "center";
type ImagePriority = "low" | "normal" | "high";

interface Props {
  uri: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ResizeMode;
  priority?: ImagePriority;
  onLoadEnd?: () => void;
  onError?: () => void;
}

const RN_RESIZE: Record<ResizeMode, ImageResizeMode> = {
  contain: "contain",
  cover: "cover",
  stretch: "stretch",
  center: "center",
};

function FastImageImpl({
  uri,
  style,
  resizeMode = "cover",
  priority = "normal",
  onLoadEnd,
  onError,
}: Props) {
  const FastImage = require("@d11/react-native-fast-image").default;
  return (
    <FastImage
      source={{ uri, priority: FastImage.priority[priority] }}
      style={style as object}
      resizeMode={FastImage.resizeMode[resizeMode]}
      onLoad={onLoadEnd}
      onError={onError}
    />
  );
}

export function CachedImage(props: Props) {
  if (isFastImageNativeAvailable()) {
    return <FastImageImpl {...props} />;
  }

  return (
    <Image
      source={{ uri: props.uri, cache: "force-cache" }}
      style={props.style}
      resizeMode={RN_RESIZE[props.resizeMode ?? "cover"]}
      onLoadEnd={props.onLoadEnd}
      onError={props.onError}
    />
  );
}
