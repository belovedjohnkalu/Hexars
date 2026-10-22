"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import styles from "./Slider.module.css";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { appearance?: "default" | "spectrum"; thumbLabel?:string; thumbValueText?:string; preserveInputFocusOnTouch?:boolean }
>(({ className, appearance="default", thumbLabel, thumbValueText, preserveInputFocusOnTouch=false, ...props }, ref) => {
  const gesture=React.useRef<{id:number;value:number;start:number}|null>(null);
  // Radix focuses its thumb during value updates. For a touch color gesture
  // beside an active text field, drive this controlled slider without moving focus.
  const touchValue=(event:React.PointerEvent<HTMLSpanElement>)=>{
    const bounds=event.currentTarget.getBoundingClientRect(),min=props.min??0,max=props.max??100,step=props.step??1;
    const reversed=(props.dir==='rtl')!==!!props.inverted;
    const fraction=Math.max(0,Math.min(1,(event.clientX-bounds.left)/Math.max(1,bounds.width)));
    const raw=min+(reversed?1-fraction:fraction)*(max-min);
    const value=Math.max(min,Math.min(max,Number((min+Math.round((raw-min)/step)*step).toFixed(10))));
    if(gesture.current)gesture.current.value=value;
    props.onValueChange?.([value]);
  };
  const pointerDown=(event:React.PointerEvent<HTMLSpanElement>)=>{
    props.onPointerDown?.(event);
    if(gesture.current){event.preventDefault();return;}
    const active=event.currentTarget.ownerDocument.activeElement;
    if(event.defaultPrevented||!preserveInputFocusOnTouch||appearance!=='spectrum'||props.disabled||props.value?.length!==1||props.orientation==='vertical'||event.button!==0||!['touch','pen'].includes(event.pointerType)||!active?.matches('input:not([type]),input[type="text"],textarea')||active.closest('form')!==event.currentTarget.closest('form')||!active.closest('form'))return;
    event.preventDefault();
    gesture.current={id:event.pointerId,value:props.value?.[0]??0,start:props.value?.[0]??0};
    event.currentTarget.setPointerCapture(event.pointerId);touchValue(event);
  };
  const pointerMove=(event:React.PointerEvent<HTMLSpanElement>)=>{
    props.onPointerMove?.(event);if(event.defaultPrevented||gesture.current?.id!==event.pointerId)return;
    event.preventDefault();if(!props.disabled)touchValue(event);
  };
  const endPointer=(event:React.PointerEvent<HTMLSpanElement>,cancel=false)=>{
    if(cancel)props.onPointerCancel?.(event);else props.onPointerUp?.(event);
    const current=gesture.current;if(current?.id!==event.pointerId)return;
    event.preventDefault();gesture.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    if(!cancel&&current.value!==current.start)props.onValueCommit?.([current.value]);
  };
  const isRange =
    (Array.isArray(props.defaultValue) && props.defaultValue.length > 1) ||
    (Array.isArray(props.value) && props.value.length > 1);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={`${styles.slider} ${appearance==="spectrum"?styles.spectrum:""} ${className ?? ""}`}
      {...props}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={event=>endPointer(event)}
      onPointerCancel={event=>endPointer(event,true)}
      onLostPointerCapture={event=>{props.onLostPointerCapture?.(event);if(gesture.current?.id===event.pointerId)gesture.current=null;}}
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
