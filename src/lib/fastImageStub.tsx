import React from "react";
import {
  Image,
  type ImageProps,
  type ImageStyle,
  type StyleProp,
} from "react-native";

type FastImageSource = { uri: string; priority?: string };

interface FastImageStubProps
  extends Omit<ImageProps, "source" | "onLoad" | "onError"> {
  source: FastImageSource;
  /** Matches @d11/react-native-fast-image — not RN Image's onLoad. */
  onLoad?: () => void;
  onError?: () => void;
}

const priority = {
  low: "low",
  normal: "normal",
  high: "high",
} as const;

const resizeMode = {
  contain: "contain",
  cover: "cover",
  stretch: "stretch",
  center: "center",
} as const;

function FastImageStub({
  source,
  onLoad,
  onError,
  style,
  ...rest
}: FastImageStubProps) {
  return (
    <Image
      {...rest}
      style={style as StyleProp<ImageStyle>}
      source={{ uri: source.uri }}
      onLoadEnd={onLoad}
      onError={onError}
    />
  );
}

FastImageStub.preload = (sources: FastImageSource[]) => {
  for (const source of sources) {
    if (source.uri) {
      Image.prefetch(source.uri).catch(() => undefined);
    }
  }
};

FastImageStub.priority = priority;
FastImageStub.resizeMode = resizeMode;

export default FastImageStub;
