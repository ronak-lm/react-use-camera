import { useCallback } from "react";
import { CaptureSettings, CapturedImage } from "./types";

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

  const capture = useCallback(
    (
      stream: MediaStream | undefined,
      settings?: CaptureSettings
    ): Promise<CapturedImage | undefined> => {
      return new Promise((resolve, reject) => {
        // Validate if stream is active
        if (!stream) {
          reject("Stream is undefined");
          return;
        }

        // Create a video element and play the stream on it
        const video = document.createElement("video");
        video.playsInline = true;
        video.autoplay = true;
        video.muted = true;
        video.srcObject = stream;

        // When the video is playing, draw it on a canvas
        video.addEventListener("playing", () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext("2d") as CanvasRenderingContext2D;
          if (settings?.mirror) {
            context.scale(-1, 1);
            context.drawImage(video, 0, 0, canvas.width * -1, canvas.height);
          } else {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
          }

          // Convert the canvas to a data URL and blob and resolve the promise
          const imgUrl = canvas.toDataURL("image/jpeg");
          canvas.toBlob((blob) => {
            resolve({
              url: imgUrl,
              blob,
            });
          });

          // Cleanup
          video.remove();
          canvas.remove();
        });
        video.play();
      });
    },
    []
  );

  return {
    startCamera,
    stopCamera,
    capture,
  };
};
