import React from 'react';

export const Button = ({ children, onClick, className, ...props }) => {
  return (
    <button onClick={onClick} className={`button ${className}`} {...props}>
      {children}
    </button>
  );
};

Button.displayName = "Button";
