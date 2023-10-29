import { RefObject, useCallback } from "react";
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
      source: { stream?: MediaStream; videoRef?: RefObject<HTMLVideoElement> },
      settings?: CaptureSettings
    ): Promise<CapturedImage | undefined> => {
      return new Promise((resolve, reject) => {
        const { stream, videoRef } = source;
        const { mirror, scale } = {
          mirror: false,
          scale: 1,
          ...settings,
        };

        // Validate if stream is active
        if (!stream && !videoRef?.current) {
          reject("Either stream or video is required.");
          return;
        }

        // Create a video element and play the stream on it
        let myVideo = videoRef?.current;
        let isVirtualVideoTag = false; // If the video tag is created by this function
        if (!myVideo) {
          myVideo = document.createElement("video");
          myVideo.playsInline = true;
          myVideo.autoplay = true;
          myVideo.muted = true;
          myVideo.srcObject = stream!;
          isVirtualVideoTag = true;
        }

        // Helper function that draws the video frame on the canvas and converts it to image
        const addToCanvasAndCapture = () => {
          const canvas = document.createElement("canvas");
          canvas.width = myVideo!.videoWidth * scale;
          canvas.height = myVideo!.videoHeight * scale;
          const context = canvas.getContext("2d") as CanvasRenderingContext2D;
          if (mirror) {
            context.scale(-1, 1);
            context.drawImage(myVideo!, 0, 0, -1 * canvas.width, canvas.height);
          } else {
            context.drawImage(myVideo!, 0, 0, canvas.width, canvas.height);
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
          canvas.remove();
          if (isVirtualVideoTag) {
            myVideo!.remove();
          }
        };

        // If the video is already playing, capture the frame, else wait for it to play
        if (!myVideo.paused) {
          addToCanvasAndCapture();
        } else {
          myVideo.addEventListener("playing", addToCanvasAndCapture);
          myVideo.play();
        }
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
