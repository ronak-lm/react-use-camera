import { useCallback, useEffect, useMemo, useState } from "react";
import { CaptureReturnType, CaptureSettings } from "./types";

const defaultConstraints: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 1440 },
  height: { ideal: 1080 },
};

export const useCamera = (customConstraints?: MediaTrackConstraints) => {
  // 1 - SETUP / MERGE CONSTRAINTS
  const constraints = useMemo(() => {
    return {
      ...defaultConstraints,
      ...customConstraints,
    };
  }, [customConstraints]);

  // 2 - LOAD STREAM

  const [stream, setStream] = useState<MediaStream>();
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    (async () => {
      // Check if the browser supports the MediaDevices API
      const isSupported = "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices;
      if (!isSupported) {
        setError(new Error("Camera not supported"));
        return;
      }

      // Load the stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: constraints,
        });
        setStream(stream);
      } catch (error) {
        console.error(error);
        setError(error);
      }
    })();

    // Clear the stream when the component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constraints]);

  // 3 - CAPTURE IMAGE

  const capture = useCallback(
    async (settings?: CaptureSettings): Promise<CaptureReturnType | undefined> => {
      return new Promise((resolve, reject) => {
        if (stream === undefined || error !== undefined) {
          reject(error);
          return;
        }

        // Create a video element and play the stream on it
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.play();

        // When the video is ready, draw it on a canvas
        video.addEventListener("loadedmetadata", () => {
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
      });
    },
    [stream, error]
  );

  return {
    stream,
    error,
    capture,
  };
};
