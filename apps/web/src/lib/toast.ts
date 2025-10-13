/**
 * Toast Notifications Utility
 * Wraps react-hot-toast with custom styling and presets
 */

import toast, { Toaster } from 'react-hot-toast';

/**
 * Success toast
 */
export const showSuccess = (message: string, duration = 4000) => {
  return toast.success(message, {
    duration,
    style: {
      background: '#065f46',
      color: '#fff',
      border: '1px solid #10b981',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
  });
};

/**
 * Error toast
 */
export const showError = (message: string, duration = 5000) => {
  return toast.error(message, {
    duration,
    style: {
      background: '#7f1d1d',
      color: '#fff',
      border: '1px solid #ef4444',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  });
};

/**
 * Info toast
 */
export const showInfo = (message: string, duration = 4000) => {
  return toast(message, {
    duration,
    icon: 'ℹ️',
    style: {
      background: '#1e3a8a',
      color: '#fff',
      border: '1px solid #3b82f6',
    },
  });
};

/**
 * Loading toast (returns toast ID for dismissal)
 */
export const showLoading = (message: string) => {
  return toast.loading(message, {
    style: {
      background: '#374151',
      color: '#fff',
      border: '1px solid #6b7280',
    },
  });
};

/**
 * Update existing toast (useful for loading → success/error)
 */
export const updateToast = (
  toastId: string,
  type: 'success' | 'error',
  message: string
) => {
  if (type === 'success') {
    toast.success(message, {
      id: toastId,
      style: {
        background: '#065f46',
        color: '#fff',
        border: '1px solid #10b981',
      },
    });
  } else {
    toast.error(message, {
      id: toastId,
      style: {
        background: '#7f1d1d',
        color: '#fff',
        border: '1px solid #ef4444',
      },
    });
  }
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Transaction-specific toasts
 */
export const showTransactionPending = (signature: string) => {
  return showLoading(`Transaction pending: ${signature.slice(0, 8)}...`);
};

export const showTransactionSuccess = (signature: string, message = 'Transaction confirmed!') => {
  return showSuccess(`${message}\nSignature: ${signature.slice(0, 8)}...`);
};

export const showTransactionError = (error: Error) => {
  const message = error.message || 'Transaction failed';
  return showError(`Transaction failed: ${message}`);
};

/**
 * Blockchain operation toasts
 */
export const showTripCreated = (tripId: string) => {
  return showSuccess(`Trip created successfully!\nID: ${tripId.slice(0, 8)}...`);
};

export const showMatchFound = (count: number) => {
  return showSuccess(`Found ${count} potential ${count === 1 ? 'match' : 'matches'}!`);
};

export const showMatchAccepted = () => {
  return showSuccess('Match accepted! You can now reveal details.');
};

/**
 * Wallet toasts
 */
export const showWalletRequired = () => {
  return showError('Please connect your wallet to continue');
};

export const showWalletConnected = (address: string) => {
  return showSuccess(`Wallet connected: ${address.slice(0, 8)}...`);
};

export const showWalletDisconnected = () => {
  return showInfo('Wallet disconnected');
};

// Export Toaster component for use in layout
export { Toaster };
