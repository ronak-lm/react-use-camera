# React Use Camera

The lightweight library _`(1.9kb minified + gzipped)`_ to add camera & photo capture functionality in your React app.

**Note**: WebRTC is only supported over http**s** so you will need an SSL certificate in production. For development, chrome supports WebRTC even without SSL / https as long as it's running on "localhost".

# Install

#### npm

    npm i react-use-camera

#### yarn

    yarn add react-use-camera

# Instructions

There are 2 ways to use this library:

1. The `<Camera />` component (_recommended_)
2. The `useCamera()` hook.

## The Camera Component

This gives you a raw camera interface **without** any opinionated UI elements or buttons. Draw your own UI over the camera stream.

```jsx
import { useRef } from "react";
import { Camera, CameraElement } from "react-use-camera";

export default function App() {
  const cameraRef = useRef<CameraElement>(null);

  const handleCapture = async () => {
    const imageData = await cameraRef.current?.capture(); // Camera view will pause after capture
    // imageData.url can be used as src for an <img/> tag
    // imageData.blob contains a blob string to send to your server
  };

  const handleClear = () => {
    cameraRef.current?.clear(); // Discards the captured photo and resumes the camera view
  };

  return (
    <div>
      <Camera
        ref={cameraRef}
        className="your-classes-here"
        style={/* width, height, etc */}
        errorLayout={<div>Oops!</div>}
        onReady={() => console.log("Camera is not visibile to the user")}
        onError={(e) => console.error("Camera couldn't load :(")}
      />

      {/* Add your own UI here... */}
      <button onClick={handleCapture}>Capture</button>
      <button onClick={handleClear}>Clear</button>
    </div>
  );
}
```

### Props

- **fit**

  - Type: `fill | contain | cover | blur`
  - Default: `contain`
  - Notes:
    - `fill` will stretch or squish the video to match the exact width or height that you give to camera component
    - `contain` will maintain its aspect ratio while fitting within the camera component's width and height. There might be empty spaces around the camera stream.
    - `cover` will keep the aspect ratio and crop the camera stream to fit the width and height that you give to the camera component.
    - `blur` will work similar to contain BUT instead of empty spaces around the camera, it will show a blurred version of the camera stream as the background.

- **constraints**

  - Type: [`MediaTrackConstraints`](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints)
  - Default: `{ facingMode: "user", width: { ideal:  1440 }, height: { ideal:  1080 }}`
  - Notes:
    - If you want to select the front or back camera, you will need to pass `facingMode` as `user` or `environment` respectively. Default is set to `user` i.e. the front camera.

- **errorLayout**

  - Type: [`ReactNode | JSX`](https://reactnative.dev/docs/react-node)
  - Default: `undefined`
  - Notes: This layout will be shown instead of the camera stream in case of an error. For example:
    - Browser doesn't support the camera API
    - No camera found on the device
    - User denied the camera permission

- **onError**

  - Type: `(error: unknown) =>  void`

- **onReady**

  - Type: `() =>  void`

## The useCamera() Hook

This give you no UI. You just get a `MediaStream` instance that you have to attach to a `<video />` tag. To capture an image, call the hook's `capture` function with the `MediaStream` instance as a parameter.

```jsx
import { useEffect, useState, useRef } from "react";
import { useCamera } from "react-use-camera";

export const MyCustomCameraComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { startCamera, stopCamera, capture } = useCamera();
  const [stream, setStream] = useState<MediaStream>();

  const handleStartCamera = async () => {
    try {
      const stream = await startCamera({ /* MediaTrackConstraints */ })
      setStream(stream);
      videoRef.current!.srcObject = stream;
    } catch (e) {
      alert("Oops! Camera failed to start!");
      console.error(e);
    }
  }

  const handleStopCamera = () => {
    stopCamera(stream);
  }

  const handleCapture = async () => {
    if (!stream) return; // Don't capture if the stream isn't active!
    try {
      const capturedImage = await capture(stream, {
        mirror: false // Pass true if you want to mirror the captured image (recommended for front camera)
      });
      if (capturedImage) {
        console.log("URL:" + capturedImage.url);
        console.log("Blob: " + capturedImage.blob);
      }
    } catch {
      alert("Oops! Unable to capture image. Check if the camera stream is active.");
    }
  }

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
      />
      <button onClick={handleStartCamera}>Start Camera</button>
      <button onClick={handleStopCamera}>Stop Camera</button>
      <button onClick={handleCapture}>Capture</button>
    </div>
  );
}
```

## License

MIT
