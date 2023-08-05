import {
  ComponentProps,
  ForwardedRef,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCamera } from "./useCamera";
import { CameraElement, CameraHandle, CapturedImage } from "./types";

import "./style.css";

export type CameraProps = ComponentProps<"div"> & {
  fit?: "fill" | "contain" | "cover" | "blur";
  constraints?: MediaTrackConstraints;
  errorLayout?: ReactNode;
  onError?: (error: unknown) => void;

  videoProps?: ComponentProps<"video">;
  videoBlurProps?: ComponentProps<"video">;
  imgProps?: ComponentProps<"img">;
  imgBlurProps?: ComponentProps<"img">;
};

export default forwardRef<CameraElement, CameraProps>(function Camera(
  {
    className = "",
    fit = "contain",
    constraints,
    errorLayout,
    onError,

    videoProps = {},
    videoBlurProps = {},
    imgProps = {},
    imgBlurProps = {},

    ...otherProps
  },
  ref
) {
  // 0 - SPLIT PROPS AND CLASSES
  const { className: videoClassName = "", ...otherVideoProps } = videoProps;
  const { className: videoBlurClassName = "", ...otherVideoBlurProps } = videoBlurProps;
  const { className: imgClassName = "", ...otherImgProps } = imgProps;
  const { className: imgBlurClassName = "", ...otherImgBlurProps } = imgBlurProps;

  // 1 - CAMERA STREAM SETUP

  const { startCamera, stopCamera } = useCamera();

  const cameraConstraints = useMemo<MediaTrackConstraints>(
    () => ({
      facingMode: "user",
      width: { ideal: 1440 },
      height: { ideal: 1080 },
      ...constraints,
    }),
    [constraints]
  );

  const [stream, setStream] = useState<MediaStream>();
  const [appliedConstraintsJson, setAppliedConstraintsJson] = useState<string>(); // Used to check if constraints have changed

  const [error, _setError] = useState<unknown>();
  const setError = (error: unknown) => {
    _setError(error);
    if (error) onError?.(error);
  };

  // Start the camera when the component mounts or when the constraints change
  useEffect(() => {
    // If constraints haven't changed and the camera is already running, do nothing
    if (JSON.stringify(cameraConstraints) === appliedConstraintsJson) return;

    // If constraints have changed and the camera is running, stop the camera
    if (stream) {
      stopCamera(stream);
      setError(undefined);
      setStream(undefined);
      setAppliedConstraintsJson(undefined);
    }

    // Start the camera with the specified constraints
    startCamera(cameraConstraints)
      .then((stream) => {
        setError(undefined);
        setStream(stream);
        setAppliedConstraintsJson(JSON.stringify(cameraConstraints));
      })
      .catch((error) => {
        console.error(error);
        setError(error);
        setStream(undefined);
        setAppliedConstraintsJson(undefined);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraConstraints]);

  // Stop the camera when the component unmounts
  useEffect(() => {
    return () => stopCamera(stream);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2 - VIDEO ELEMENT SETUP

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoBlurRef = useRef<HTMLVideoElement>(null);

  // Attach the stream to the video element
  useEffect(() => {
    if (!stream) return;
    if (videoRef.current) videoRef.current.srcObject = stream;
    if (videoBlurRef.current && fit === "blur") videoBlurRef.current.srcObject = stream;
  }, [stream, fit]);

  // 3 - CAPTURE & CLEAR IMAGE FUNCTION

  const [imageDataURL, setImageDataURL] = useState<string | undefined>();

  // Check if the camera is front facing
  const isFront = useMemo(() => {
    const { facingMode } = cameraConstraints || {};
    if (Array.isArray(facingMode)) {
      return facingMode.includes("user");
    } else if (typeof facingMode === "string") {
      return facingMode === "user";
    } else {
      return false;
    }
  }, [cameraConstraints]);

  const handleCapture = useCallback(async (): Promise<CapturedImage | undefined> => {
    return new Promise((resolve, reject) => {
      // Validate if stream is active
      if (stream === undefined || !videoRef.current) {
        reject("Stream is undefined");
        return;
      }

      // Draw the video frame to the canvas
      const videoElement = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      if (isFront) {
        context.scale(-1, 1);
        context.drawImage(videoElement, 0, 0, canvas.width * -1, canvas.height);
      } else {
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      }

      // Set the captured image preview
      const imgUrl = canvas.toDataURL("image/jpeg");
      setImageDataURL(imgUrl);

      // Convert the canvas to a blob and resolve the promise
      canvas.toBlob((blob) => {
        resolve({
          url: imgUrl,
          blob,
        });
      });

      // Cleanup
      canvas.remove();
    });
  }, [stream, isFront]);

  const handleSetCaptured = useCallback((url: string) => {
    setImageDataURL(url);
  }, []);

  const handleClear = useCallback(() => {
    setImageDataURL(undefined);
  }, []);

  // Expose the capture and clear functions to the parent component
  useImperativeHandle(
    ref as ForwardedRef<CameraHandle>,
    () => ({
      capture: handleCapture,
      setCaptured: handleSetCaptured,
      clear: handleClear,
    }),
    [handleCapture, handleSetCaptured, handleClear]
  );

  // 4 - ERROR JSX

  if (error) {
    return (
      <div ref={ref} className={`usecam-root ${className}`} {...otherProps}>
        {errorLayout}
      </div>
    );
  }

  // 5 - SUCCESS JSX

  let objectFitClass = "usecam-fill";
  if (fit === "contain" || fit === "blur") {
    objectFitClass = "usecam-contain";
  } else if (fit === "cover") {
    objectFitClass = "usecam-cover";
  }

  return (
    <div ref={ref} className={`usecam-root ${className}`} {...otherProps}>
      {/* Camera Blurred Background */}
      {fit === "blur" && (
        <video
          ref={videoBlurRef}
          className={`usecam-video usecam-blur usecam-cover ${
            isFront ? "usecam-flip-zoom" : "usecam-zoom"
          } ${imageDataURL !== undefined ? "usecam-hide" : ""} ${videoBlurClassName}`}
          autoPlay
          playsInline
          {...otherVideoBlurProps}
        />
      )}

      {/* Camera */}
      <video
        ref={videoRef}
        className={`usecam-video ${objectFitClass} ${isFront ? "usecam-flip" : ""} ${
          imageDataURL !== undefined ? "usecam-hide" : ""
        } ${videoClassName}`}
        autoPlay
        playsInline
        {...otherVideoProps}
      />

      {/* Image Preview: Blurred Background */}
      {fit === "blur" && (
        <img
          className={`usecam-video usecam-zoom usecam-blur usecam-cover ${
            imageDataURL === undefined ? "usecam-hide" : ""
          } ${imgBlurClassName}`}
          src={imageDataURL}
          {...otherImgBlurProps}
        />
      )}

      {/* Image Preview */}
      <img
        className={`usecam-video ${objectFitClass} ${
          imageDataURL === undefined ? "usecam-hide" : ""
        } ${imgClassName}`}
        src={imageDataURL}
        {...otherImgProps}
      />
    </div>
  );
});
