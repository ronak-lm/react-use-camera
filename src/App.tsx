import { useRef, useState } from "react";
import { Camera, CameraElement } from "./lib";

export default function App() {
  const [fit, setFit] = useState<"fill" | "contain" | "cover" | "blur">("blur");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const ref = useRef<CameraElement>(null);

  const handleCapture = async () => {
    const imageData = await ref.current?.capture();
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
          alert((error as any).message);
        }}
        errorLayout={<div>Camera Error</div>}
      />

      <hr />
      <button onClick={handleCapture}>Capture</button>
      <button onClick={handleClear}>Clear</button>

      <hr />
      <button onClick={() => setFacingMode("user")}>Front Camera</button>
      <button onClick={() => setFacingMode("environment")}>Back Camera</button>

      <hr />
      <button onClick={() => setFit("fill")}>Fill</button>
      <button onClick={() => setFit("contain")}>Contain</button>
      <button onClick={() => setFit("cover")}>Cover</button>
      <button onClick={() => setFit("blur")}>Blur</button>
    </div>
  );
}
