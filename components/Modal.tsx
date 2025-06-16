import React, { ReactNode, useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const [internalVisible, setInternalVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setInternalVisible(true), 10); // Small delay for transition
      return () => clearTimeout(timer);
    } else {
      setInternalVisible(false); // Start exit animation
      // The parent component will unmount after any exit transition period if needed
    }
  }, [isOpen]);

  if (!isOpen && !internalVisible) { // Only truly unmount if not open and animation finished (or not started)
     // This condition might need adjustment if complex exit animations are handled here.
     // For now, if !isOpen, the parent will likely unmount it based on the original logic.
     // The primary goal of internalVisible is for smooth *entry*.
     // If parent unmounts immediately on isOpen=false, then exit animation is cut short.
     // The original if (!isOpen) return null; means exit animation isn't really supported.
     // Let's stick to the original immediate unmount behavior from the parent based on isOpen.
     // So internalVisible mainly helps trigger the enter animation.
  }
   if (!isOpen) return null; // Original behavior: unmount immediately when isOpen is false.

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div 
      className={`fixed inset-0 bg-black flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out ${internalVisible ? 'bg-opacity-50 backdrop-blur-sm opacity-100' : 'bg-opacity-0 backdrop-filter-none opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl p-6 relative ${sizeClasses[size]} w-full transform transition-all duration-300 ease-in-out ${internalVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-sky-700">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
