import React from 'react';

export const Table = React.forwardRef(({ className, ...props }, ref) => (
  <table ref={ref} className={`table ${className}`} {...props} />
));

export const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={`table-header ${className}`} {...props} />
));

export const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={`table-body ${className}`} {...props} />
));

export const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={`table-footer ${className}`} {...props} />
));

export const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={`table-row ${className}`} {...props} />
));

export const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={`table-head ${className}`} {...props} />
));

export const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={`table-cell ${className}`} {...props} />
));

Table.displayName = "Table";
TableHeader.displayName = "TableHeader";
TableBody.displayName = "TableBody";
TableFooter.displayName = "TableFooter";
TableRow.displayName = "TableRow";
TableHead.displayName = "TableHead";
TableCell.displayName = "TableCell";
