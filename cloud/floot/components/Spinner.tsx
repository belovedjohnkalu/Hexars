import React from "react";
import styles from "./Spinner.module.css";
import { AppMark } from './AppMark';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  className,
  ...props
}) => {
  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${className || ""}`}
      {...props}
      role="status"
    >
      <AppMark className={styles.spinnerInner}/>
    </div>
  );
};
