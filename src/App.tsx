import { useRef, useState } from "react";
import { Camera, CameraElement } from "./lib";

export default function App() {
  const [fit, setFit] = useState<"fill" | "contain" | "cover" | "blur">("blur");
  const [scale, setScale] = useState(1);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const ref = useRef<CameraElement>(null);

  const handleCapture = async () => {
    const imageData = await ref.current?.capture({ scale });
    console.log(imageData);
  };

  const handleClear = () => {
    ref.current?.clear();
  };

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
      <div style={{ marginBottom: "4px" }}>Capture Size (Scale)</div>
      <button onClick={() => setScale(0.25)}>0.25</button>
      <button onClick={() => setScale(0.5)}>0.5</button>
      <button onClick={() => setScale(1)}>1</button>
      <button onClick={() => setScale(1.5)}>1.5</button>
      <button onClick={() => setScale(2)}>2</button>

      <hr />
      <div style={{ marginBottom: "4px" }}>Actions</div>
      <button onClick={handleCapture}>Capture</button>
      <button onClick={handleClear}>Clear</button>
    </div>
  );
}
