import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-16 right-4 z-50 animate-slide-in">
      <div className={`rounded-lg px-6 py-3 shadow-lg flex items-center space-x-2 ${
        type === 'success' 
          ? isDarkMode 
            ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
            : 'bg-green-50 border border-green-200 text-green-600'
          : isDarkMode
            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
            : 'bg-red-50 border border-red-200 text-red-600'
      }`}>
        {type === 'success' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Toast; 