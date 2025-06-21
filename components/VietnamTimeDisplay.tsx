import React from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { getCurrentVietnamTimeDisplay } from '../utils/dateUtils';

interface VietnamTimeDisplayProps extends Omit<TypographyProps, 'children'> {
  date: string | Date;
  showTime?: boolean;
  format?: 'short' | 'long' | 'display';
}

export const VietnamTimeDisplay: React.FC<VietnamTimeDisplayProps> = ({ 
  date, 
  showTime = true, 
  format = 'display',
  ...typographyProps 
}) => {
  const formatDate = () => {
    if (format === 'display') {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const vietnamTime = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
      const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
      const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
      const year = vietnamTime.getUTCFullYear();
      const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
      const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
      const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const vietnamTime = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
    
    if (format === 'short') {
      const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
      const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
      const year = vietnamTime.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // long format
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
    const year = vietnamTime.getUTCFullYear();
    const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
    
    return showTime 
      ? `${day}/${month}/${year} ${hours}:${minutes}`
      : `${day}/${month}/${year}`;
  };

  return (
    <Typography {...typographyProps}>
      {formatDate()}
    </Typography>
  );
}; 