import React from 'react';

export const Progress = React.forwardRef(({ value, max = 100, className, ...props }, ref) => {
  return (
    <progress
      ref={ref}
      className={`progress ${className}`}
      value={value}
      max={max}
      {...props}
    />
  )
});

Progress.displayName = "Progress";
