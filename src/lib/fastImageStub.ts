import React from "react";
import { Image, type ImageProps } from "react-native";

type FastImageSource = { uri: string; priority?: string };

interface FastImageProps extends Omit<ImageProps, "source"> {
  source: FastImageSource;
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
  ...rest
}: FastImageProps) {
  return (
    <Image
      {...rest}
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
