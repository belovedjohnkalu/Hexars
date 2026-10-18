"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import styles from "./Slider.module.css";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { appearance?: "default" | "spectrum"; thumbLabel?:string; thumbValueText?:string }
>(({ className, appearance="default", thumbLabel, thumbValueText, ...props }, ref) => {
  const isRange =
    (Array.isArray(props.defaultValue) && props.defaultValue.length > 1) ||
    (Array.isArray(props.value) && props.value.length > 1);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={`${styles.slider} ${appearance==="spectrum"?styles.spectrum:""} ${className ?? ""}`}
      {...props}
    >
      <SliderPrimitive.Track className={styles.track}>
        <SliderPrimitive.Range className={styles.range} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={styles.thumb} aria-label={thumbLabel} aria-valuetext={thumbValueText} />
      {isRange && <SliderPrimitive.Thumb className={styles.thumb} aria-label={thumbLabel} aria-valuetext={thumbValueText} />}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
