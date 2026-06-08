import React from "react";
import { Image } from "react-native";

const FastImage = (props) => <Image {...props} source={{ uri: props.source?.uri }} />;

FastImage.resizeMode = {
  contain: "contain",
  cover: "cover",
  stretch: "stretch",
  center: "center",
};

FastImage.priority = {
  low: "low",
  normal: "normal",
  high: "high",
};

FastImage.preload = () => undefined;
FastImage.clearMemoryCache = () => Promise.resolve();
FastImage.clearDiskCache = () => Promise.resolve();

export default FastImage;
