'use client';

import React from 'react';
import { toast, Toast, ToastOptions } from 'react-hot-toast';
import { AlertCircle, CheckCircle, AlertTriangle, X, Info, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface AnimatedToastProps {
  t: Toast;
  title: string;
  body?: string;
  type: ToastType;
}

export const AnimatedToast = ({ t, title, body, type }: AnimatedToastProps) => {
  // Select the appropriate icon based on toast type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400 stroke-[1.5px]" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400 stroke-[1.5px]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400 stroke-[1.5px]" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400 stroke-[1.5px]" />;
      case 'loading':
        return <Loader className="w-5 h-5 text-purple-400 stroke-[1.5px] animate-spin" />;
      default:
        return <Info className="w-5 h-5 text-blue-400 stroke-[1.5px]" />;
    }
  };

  return (
    <div
      className={cn(
        'relative p-[2px] rounded-[10px] overflow-hidden',
        'before:absolute before:inset-0 before:rounded-[10px] before:p-[2px]',
        'before:bg-gradient-to-r before:from-[#6032F6] before:to-[#DDB958]',
        'before:animate-gradient-x before:bg-[length:200%_100%]',
        t.visible ? 'animate-enter' : 'animate-leave'
      )}
    >
      <div className="relative bg-[#1D1D1D] rounded-[8px] px-4 py-1 flex items-start gap-3">
        <div className="flex-shrink-0 pt-3">{getIcon()}</div>
        
        <div className="flex-grow py-3">
          <p className="text-[16px] font-medium text-[#D4D4D4] leading-tight">{title}</p>
          {body && <p className="text-[14px] font-medium text-[#A5A5A5] mt-1 leading-snug">{body}</p>}
        </div>
        
        <button 
          onClick={() => toast.dismiss(t.id)} 
          className="flex-shrink-0 p-3 text-[#A5A5A5] hover:text-white transition-colors"
        >
          <X className="w-4 h-4 stroke-[1.5px]" />
        </button>
      </div>
    </div>
  );
};

interface ToastParams {
  title: string;
  body?: string;
  type: ToastType;
  duration?: number;
}

// Default options for all toasts
const defaultOptions: Partial<ToastOptions> = {
  duration: 5000,
  position: 'bottom-left',
};

// Helper function to show toast
export const showAnimatedToast = ({ title, body, type, duration }: ToastParams) => {
  return toast.custom(
    (t) => <AnimatedToast t={t} title={title} body={body} type={type} />,
    {
      ...defaultOptions,
      duration: duration || defaultOptions.duration,
    }
  );
};

// Convenience functions for different toast types
export const showSuccessToast = (title: string, body?: string, duration?: number) => 
  showAnimatedToast({ title, body, type: 'success', duration });

export const showErrorToast = (title: string, body?: string, duration?: number) => 
  showAnimatedToast({ title, body, type: 'error', duration });

export const showWarningToast = (title: string, body?: string, duration?: number) => 
  showAnimatedToast({ title, body, type: 'warning', duration });

export const showInfoToast = (title: string, body?: string, duration?: number) => 
  showAnimatedToast({ title, body, type: 'info', duration });

export const showLoadingToast = (title: string, body?: string, duration?: number) => 
  showAnimatedToast({ title, body, type: 'loading', duration: duration || 30000 });

// Add custom toast function for joins
export const showCustomToast = (message: string, duration?: number) => {
  return toast.custom(
    (t) => (
      <div 
        className={`relative p-[2px] rounded-[10px] overflow-hidden ${t.visible ? 'animate-enter' : 'animate-leave'}`}
      >
        <div
          className="absolute inset-0 rounded-[10px] p-[2px] bg-gradient-to-r from-[#6032F6] to-[#DDB958] animate-gradient-x bg-[length:200%_100%]"
        />
        <div className="relative bg-[#1D1D1D] rounded-[8px] px-4 py-3 flex items-center gap-3">
          <p className="text-[16px] font-medium text-[#D4D4D4]">{message}</p>
        </div>
      </div>
    ),
    {
      position: 'bottom-left',
      duration: duration || 4000,
    }
  );
}; 