import { useCallback } from "react";
import { CaptureSettings, CapturedImage } from "./types";

// Global MediaStream Instance
let stream: MediaStream | undefined = undefined;

export const useCamera = () => {
  const startCamera = useCallback(async (constraints?: MediaTrackConstraints) => {
    // Check if the browser supports the MediaDevices API
    const isSupported = "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices;
    if (!isSupported) throw new Error("Camera not supported");

    // Stop the camera if it is already running
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = undefined;
    }

    // Start the camera and return the stream
    stream = await navigator.mediaDevices.getUserMedia({
      video: constraints,
    });
    return stream;
  }, []);

  const stopCamera = useCallback(() => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  }, []);

  const capture = useCallback(
    (settings: CaptureSettings = {}): Promise<CapturedImage | undefined> => {
      return new Promise((resolve, reject) => {
        const { videoRef, mirror, width, height } = settings;

        // Validate if stream is active
        if (!stream && !videoRef?.current) {
          reject("No source provided...");
          return;
        }

        // Create a video element and play the stream on it
        let myVideo = videoRef?.current;
        let isVirtualVideoTag = false; // If the video tag is created by this function
        if (!myVideo) {
          myVideo = document.createElement("video");
          myVideo.playsInline = true;
          myVideo.disablePictureInPicture = true;
          myVideo.autoplay = true;
          myVideo.muted = true;
          myVideo.srcObject = stream!;
          myVideo.style.display = "none";
          document.body.appendChild(myVideo);
          isVirtualVideoTag = true;
        }

        // Helper function that draws the video frame on the canvas and converts it to image
        const addToCanvasAndCapture = () => {
          const canvas = document.createElement("canvas");
          // Width specified, calculate height
          if (typeof width === "number") {
            canvas.width = width;
            canvas.height = myVideo!.videoHeight * (width / myVideo!.videoWidth);
          }
          // Height specified, calculate width
          else if (typeof height === "number") {
            canvas.width = myVideo!.videoWidth * (height / myVideo!.videoHeight);
            canvas.height = height;
          }
          // No width or height specified, use video width and height
          else {
            canvas.width = myVideo!.videoWidth;
            canvas.height = myVideo!.videoHeight;
          }
          // Add to DOM
          canvas.style.display = "none";
          document.body.appendChild(canvas);

          // Draw the video frame on the canvas
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
