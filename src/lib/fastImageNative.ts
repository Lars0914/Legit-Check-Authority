import { NativeModules } from "react-native";

/** True when a native rebuild included @d11/react-native-fast-image. */
export function isFastImageNativeAvailable(): boolean {
  return Boolean(NativeModules.FastImageView);
}
