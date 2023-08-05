export type CameraHandle = {
  capture: (settings?: CaptureSettings) => Promise<CapturedImage | undefined>;
  setCaptured: (url: string) => void;
  clear: () => void;
};

export type CameraElement = HTMLDivElement & CameraHandle;

export type CaptureSettings = {
  mirror?: boolean;
};

export type CapturedImage = {
  url: string;
  blob: Blob | null;
};
