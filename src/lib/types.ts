export type CameraHandle = {
  capture: (settings?: CaptureSettings) => Promise<CaptureReturnType | undefined>;
  setCaptured: (url: string) => void;
  clear: () => void;
};

export type CameraElement = HTMLDivElement & CameraHandle;

export type CaptureSettings = {
  mirror?: boolean;
};

export type CaptureReturnType = {
  url: string;
  blob: Blob | null;
};
