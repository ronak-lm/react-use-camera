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
import { CameraElement, CameraHandle } from "./types";

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
    constraints = {},
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

  // 1 - VIDEO STREAM SETUP

  const { stream, error, capture } = useCamera(constraints);

  const videoBlurRef = useRef<HTMLVideoElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!stream) return;
    if (videoRef.current) videoRef.current.srcObject = stream;
    if (videoBlurRef.current && fit === "blur") videoBlurRef.current.srcObject = stream;
  }, [stream, fit]);

  useEffect(() => {
    if (error) onError?.(error);
  }, [error, onError]);

  const isFront = useMemo(() => {
    // Check if the camera is front facing
    const { facingMode } = constraints;
    if (Array.isArray(facingMode)) {
      return facingMode.includes("user");
    } else if (typeof facingMode === "string") {
      return facingMode === "user";
    } else {
      return false;
    }
  }, [constraints]);

  // 2 - CAPTURE & CLEAR IMAGE FUNCTION

  const [imageDataURL, setImageDataURL] = useState<string | undefined>();

  const handleCapture = useCallback(async () => {
    const capturedData = await capture({ mirror: isFront });
    if (capturedData) {
      setImageDataURL(capturedData.url);
    }
    return capturedData;
  }, [capture, isFront]);

  const handleClear = useCallback(() => {
    setImageDataURL(undefined);
  }, []);

  // Expose the capture and clear functions to the parent component
  useImperativeHandle(
    ref as ForwardedRef<CameraHandle>,
    () => ({
      capture: handleCapture,
      clear: handleClear,
    }),
    [handleCapture, handleClear]
  );

  // 3 - ERROR JSX

  if (error) {
    return (
      <div ref={ref} className={`usecam-root ${className}`} {...otherProps}>
        {errorLayout}
      </div>
    );
  }

  // 4 - SUCCESS JSX

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
