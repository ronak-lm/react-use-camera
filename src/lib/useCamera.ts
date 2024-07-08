import { useCallback, useEffect } from "react";
import { CaptureSettings, VideoCaptureSettings, CapturedImage, CapturedVideo } from "./types";

// Global MediaStream Instance
let stream: MediaStream | undefined = undefined;

// Global MediaRecorder Instance & Data

let recorder: MediaRecorder | undefined = undefined;
let recordedData: Blob[] | undefined = undefined;
let recordingRequestId: number | undefined = undefined; // Used to cancel the requestAnimationFrame
let recordingVideoElement: HTMLVideoElement | undefined = undefined;
let recordingCanvasElement: HTMLCanvasElement | undefined = undefined;

const getRecordedDataAsVideo = () => {
  return new Promise<CapturedVideo>((resolve, reject) => {
    if (!Array.isArray(recordedData)) return reject("No data recorded");

    // Convert the recorded data to a blob and URL
    const blob = new Blob(recordedData, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    resolve({ blob, url });
  });
};

// Clean up functions

const stopExistingCameraStreams = () => {
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = undefined;
};

const stopExistingRecordings = () => {
  if (recordingRequestId) cancelAnimationFrame(recordingRequestId);
  recordingRequestId = undefined;

  if (recordingCanvasElement) {
    recordingCanvasElement.remove();
    recordingCanvasElement = undefined;
  }

  if (recordingVideoElement) {
    recordingVideoElement.remove();
    recordingVideoElement = undefined;
  }

  if (recorder && recorder.state !== "inactive") recorder.stop();
  recorder = undefined;
  recordedData = undefined;
};

const stopExistingRecordingsAndCameraStreams = () => {
  stopExistingRecordings();
  stopExistingCameraStreams();
};

export const useCamera = () => {
  // 1 - CAMERA SETUP

  const startCamera = useCallback(async (constraints?: MediaTrackConstraints) => {
    // Check if the browser supports the MediaDevices API
    const isSupported = "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices;
    if (!isSupported) throw new Error("Camera not supported");

    // Cleanup if already active
    stopExistingRecordingsAndCameraStreams();

    // Start the camera and return the stream
    stream = await navigator.mediaDevices.getUserMedia({
      video: constraints,
    });
    return stream;
  }, []);

  const stopCamera = useCallback(() => {
    stopExistingRecordingsAndCameraStreams();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopExistingRecordingsAndCameraStreams();
  }, []);

  // 2 - IMAGE CAPTURE

  const capture = useCallback((settings: CaptureSettings): Promise<CapturedImage | undefined> => {
    return new Promise((resolve, reject) => {
      const { videoRef, mirror, width, height } = settings;
      if (!stream && !videoRef?.current) reject("No source provided for capture");

      // Create a video element and play the stream on it
      let myVideo = videoRef!.current;
      let isVirtualVideoTag = false; // If the video tag is created by this function
      if (!myVideo) {
        myVideo = document.createElement("video");
        myVideo.playsInline = true;
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
        // Both width and height specified (aspect ratio might change)
        if (typeof width === "number" && typeof height === "number") {
          canvas.width = width;
          canvas.height = height;
        }
        // Width specified, calculate height
        else if (typeof width === "number") {
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
  }, []);

  // 3 - VIDEO CAPTURE

  const startRecording = useCallback((params?: VideoCaptureSettings) => {
    const { videoRef, mirror, width, height, frameRate, onDataAvailable } = params || {};

    // Check if the browser supports the MediaRecorder API
    const isSupported = "MediaRecorder" in window;
    if (!isSupported) throw new Error("Recording not supported");

    // Check if source is provided for capture
    if (!stream && !videoRef?.current) throw new Error("No source provided for recording");

    // Stop the recording if it is already running
    stopExistingRecordings();

    // Create a video element (if not provided) and play the stream on it
    let myVideo = videoRef?.current;
    if (!myVideo) {
      myVideo = document.createElement("video");
      myVideo.playsInline = true;
      myVideo.autoplay = true;
      myVideo.muted = true;
      myVideo.srcObject = stream!;
      myVideo.style.display = "none";
      document.body.appendChild(myVideo);
      recordingVideoElement = myVideo;
    }

    // Prepare canvas for resizing video
    const canvas = document.createElement("canvas");
    // Both width and height specified (aspect ratio might change)
    if (typeof width === "number" && typeof height === "number") {
      canvas.width = width;
      canvas.height = height;
    }
    // Width specified, calculate height
    else if (typeof width === "number") {
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
    recordingCanvasElement = canvas;

    // Render video on the canvas
    const context = canvas.getContext("2d")!;
    const renderVideoOnCanvas = () => {
      if (mirror) {
        context.scale(-1, 1);
        context.drawImage(myVideo, 0, 0, -1 * canvas.width, canvas.height);
      } else {
        context.drawImage(myVideo, 0, 0, canvas.width, canvas.height);
      }
      // Render on every frame
      recordingRequestId = requestAnimationFrame(renderVideoOnCanvas);
    };
    renderVideoOnCanvas(); // Render initial frame

    // Start recording
    const canvasStream = canvas.captureStream(frameRate);
    recorder = new MediaRecorder(canvasStream);
    recorder.ondataavailable = (e) => {
      if (!recordedData) recordedData = [];
      recordedData.push(e.data);
      onDataAvailable?.(e);
    };
    recorder.start();
    return recorder;
  }, []);

  const getRecordedVideo = useCallback(() => getRecordedDataAsVideo(), []);

  const stopRecording = useCallback(() => {
    return new Promise<CapturedVideo>((resolve, reject) => {
      if (!recorder) return reject("Recording not started");
      recorder.onstop = async () => {
        const video = await getRecordedDataAsVideo();
        resolve(video);
        stopExistingRecordings(); // Cleanup
      };

      // Stop the recording
      recorder.stop();
    });
  }, []);

  return {
    startCamera,
    stopCamera,
    capture,

    startRecording,
    getRecordedVideo,
    stopRecording,
  };
};
