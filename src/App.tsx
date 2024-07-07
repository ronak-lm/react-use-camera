import { useRef, useState } from "react";
import { Camera, CameraElement } from "./lib";

export default function App() {
  // 1 - OPTIONS

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [fit, setFit] = useState<"fill" | "contain" | "cover" | "blur">("blur");

  const [width, _setWidth] = useState<number>();
  const setWidth = (width: number | undefined) => {
    if (width !== undefined) {
      _setHeight(undefined);
    }
    _setWidth(width);
  };

  const [height, _setHeight] = useState<number>();
  const setHeight = (height: number | undefined) => {
    if (height !== undefined) {
      _setWidth(undefined);
    }
    _setHeight(height);
  };

  // 2 - CAPTURE

  const ref = useRef<CameraElement>(null);

  const handleCapture = async () => {
    const imageData = await ref.current?.capture({ width, height });
    console.log(imageData);
  };

  const handleClear = () => {
    ref.current?.clear();
  };

  // 3 - RECORDING

  const [isRecording, setIsRecording] = useState(false);
  const [recordedURL, setRecordedURL] = useState<string>();

  const handleStartRecording = async () => {
    setRecordedURL(undefined);
    setIsRecording(true);
    ref.current?.startRecording();
  };

  const handleStopRecording = async () => {
    const { blob, url } = await ref.current!.stopRecording();
    console.log(blob);
    setRecordedURL(url);
    setIsRecording(false);
  };

  const handleViewRecordedVideo = () => {
    window.open(recordedURL, "_blank");
  };

  // 3 - JSX

  return (
    <div>
      <Camera
        ref={ref}
        style={{ width: "400px", height: "400px" }}
        fit={fit}
        constraints={{
          facingMode: facingMode,
        }}
        onError={(error) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          alert((error as any).message);
        }}
        errorLayout={<div>Camera Error</div>}
      />

      <hr />
      <div style={{ marginBottom: "4px" }}>Direction</div>
      <button onClick={() => setFacingMode("user")}>Front Camera</button>
      <button onClick={() => setFacingMode("environment")}>Back Camera</button>

      <hr />
      <div style={{ marginBottom: "4px" }}>Fit Type</div>
      <button onClick={() => setFit("fill")}>Fill</button>
      <button onClick={() => setFit("contain")}>Contain</button>
      <button onClick={() => setFit("cover")}>Cover</button>
      <button onClick={() => setFit("blur")}>Blur</button>

      <hr />
      <div style={{ marginBottom: "4px" }}>
        Captured Image Width ({width ? width + "px" : "Default"})
      </div>
      <button onClick={() => setWidth(undefined)}>Default</button>
      <button onClick={() => setWidth(256)}>256px</button>
      <button onClick={() => setWidth(512)}>512px</button>
      <button onClick={() => setWidth(1024)}>1024px</button>
      <button onClick={() => setWidth(2048)}>2048px</button>

      <hr />
      <div style={{ marginBottom: "4px" }}>
        Captured Image Height ({height ? height + "px" : "Default"})
      </div>
      <button onClick={() => setHeight(undefined)}>Default</button>
      <button onClick={() => setHeight(256)}>256px</button>
      <button onClick={() => setHeight(512)}>512px</button>
      <button onClick={() => setHeight(1024)}>1024px</button>
      <button onClick={() => setHeight(2048)}>2048px</button>

      <hr />
      <div style={{ marginBottom: "4px" }}>Photo Actions</div>
      <button onClick={handleCapture}>Capture</button>
      <button onClick={handleClear}>Clear</button>

      <hr />
      <div style={{ marginBottom: "4px" }}>Video Actions: {isRecording && "Recording"}</div>
      <button onClick={handleStartRecording}>Start Recording</button>
      <button onClick={handleStopRecording}>Stop Recording</button>
      {recordedURL && <button onClick={handleViewRecordedVideo}>View Recorded Video</button>}
    </div>
  );
}
