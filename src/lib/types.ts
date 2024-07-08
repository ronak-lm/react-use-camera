import { RefObject } from "react";

export type CameraHandle = {
  capture: (settings?: CaptureSettings) => Promise<CapturedImage>;
  setCaptured: (url: string) => void;
  clear: () => void;

  startRecording: (params?: VideoCaptureSettings) => MediaRecorder;
  getRecordedVideo: () => Promise<CapturedVideo>;
  stopRecording: () => Promise<CapturedVideo>;
};

export type CameraElement = HTMLDivElement & CameraHandle;

export type CaptureSettings = {
  videoRef?: RefObject<HTMLVideoElement>; // If not passed, the global stream will be used
  mirror?: boolean;
  width?: number;
  height?: number;
};

export type VideoCaptureSettings = {
  videoRef?: RefObject<HTMLVideoElement>; // If not passed, the global stream will be used
  mirror?: boolean;
  width?: number;
  height?: number;
  frameRate?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDataAvailable?: (ev: BlobEvent) => any;
};

export type CapturedImage = {
  url: string;
  blob: Blob | null;
};

export type CapturedVideo = {
  url: string;
  blob: Blob;
};
