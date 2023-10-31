import { RefObject } from "react";

export type CameraHandle = {
  capture: (settings?: CaptureSettings) => Promise<CapturedImage | undefined>;
  setCaptured: (url: string) => void;
  clear: () => void;
};

export type CameraElement = HTMLDivElement & CameraHandle;

export type CaptureSource = {
  stream?: MediaStream;
  videoRef?: RefObject<HTMLVideoElement>;
};

export type CaptureSettings = {
  mirror?: boolean;
  width?: number; // Either width or height must be specified
  height?: number;
};

export type CapturedImage = {
  url: string;
  blob: Blob | null;
};
