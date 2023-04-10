import styles from "./Camera.module.css";

export type CameraProps = {
  testProp?: string;
};

export const Camera = ({ testProp }: CameraProps) => {
  return <div className={styles.test}>Test {testProp}</div>;
};
