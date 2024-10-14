import React from 'react';

export const Tabs = ({ children, ...props }) => (
  <div className="tabs" {...props}>{children}</div>
);

export const TabsList = ({ children, ...props }) => (
  <div className="tabs-list" {...props}>{children}</div>
);

export const TabsTrigger = ({ children, ...props }) => (
  <button className="tabs-trigger" {...props}>{children}</button>
);

export const TabsContent = ({ children, ...props }) => (
  <div className="tabs-content" {...props}>{children}</div>
);
