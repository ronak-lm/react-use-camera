import { useCallback } from "react";

export const useCamera = () => {
  const startCamera = useCallback(async (constraints?: MediaTrackConstraints) => {
    // Check if the browser supports the MediaDevices API
    const isSupported = "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices;
    if (!isSupported) throw new Error("Camera not supported");

    // Load the stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: constraints,
    });
    return stream;
  }, []);

  const stopCamera = useCallback((stream: MediaStream | undefined) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  }, []);

  return {
    startCamera,
    stopCamera,
  };
};
