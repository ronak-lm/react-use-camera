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
import { CameraElement, CameraHandle, CapturedImage, CaptureSettings } from "./types";

import "./style.css";

export type CameraProps = ComponentProps<"div"> & {
  fit?: "fill" | "contain" | "cover" | "blur";
  constraints?: MediaTrackConstraints;
  errorLayout?: ReactNode;
  onReady?: () => void;
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
    onReady,
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

  const { startCamera, stopCamera, capture } = useCamera();

  // MediaStream
  const streamRef = useRef<MediaStream>(); // Used inside unmount function
  const [stream, _setStream] = useState<MediaStream>();
  const setStream = (stream: MediaStream | undefined) => {
    streamRef.current = stream;
    _setStream(stream);
  };

  // MediaStream Error
  const [error, _setError] = useState<unknown>();
  const setError = (error: unknown) => {
    _setError(error);
    if (error) onError?.(error); // Inform the parent component
  };

  // Camera Constraints
  const [appliedConstraintsJson, setAppliedConstraintsJson] = useState<string>(); // Used to track if constraints have changed
  const cameraConstraints = useMemo<MediaTrackConstraints>(
    () => ({
      facingMode: "user",
      width: { ideal: 1920 },
      height: { ideal: 1920 },
      ...constraints,
    }),
    [constraints]
  );

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
    return () => stopCamera(streamRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2 - VIDEO ELEMENT SETUP

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoBlurRef = useRef<HTMLVideoElement>(null);

  // Attach the stream to the video element
  useEffect(() => {
    if (!stream) return;
    if (videoRef.current) {
      videoRef.current.addEventListener("playing", () => onReady?.());
      videoRef.current.srcObject = stream;
    }
    if (videoBlurRef.current && fit === "blur") videoBlurRef.current.srcObject = stream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, fit]);

  // 3 - CAPTURE & CLEAR IMAGE FUNCTION

  const [imageDataURL, setImageDataURL] = useState<string | undefined>();

  // Check if the camera is front facing
  const isFront = useMemo(() => {
    const { facingMode } = cameraConstraints || {};
    if (Array.isArray(facingMode) && facingMode.length > 0) {
      return facingMode[0] === "user";
    } else if (typeof facingMode === "string") {
      return facingMode === "user";
    } else {
      return false;
    }
  }, [cameraConstraints]);

  const handleCapture = useCallback(
    async (settings?: CaptureSettings): Promise<CapturedImage | undefined> => {
      const capturedImage = await capture({ videoRef }, { mirror: isFront, ...settings });
      if (capturedImage) {
        setImageDataURL(capturedImage.url);
        return capturedImage;
      }
    },
    [isFront, capture]
  );

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
