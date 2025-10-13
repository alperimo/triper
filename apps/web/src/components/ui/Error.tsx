/**
 * Error Components
 * User-friendly error states and messages
 */

import React from 'react';
import { AlertCircle, XCircle, RefreshCw } from 'lucide-react';

/**
 * Generic error display
 */
export function ErrorDisplay({
  error,
  title = 'Something went wrong',
  onRetry,
}: {
  error: Error | string | null;
  title?: string;
  onRetry?: () => void;
}) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-red-400 font-medium mb-1">{title}</h3>
          <p className="text-red-300 text-sm">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error message
 */
export function ErrorInline({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-red-400 text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Form field error
 */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {message}
    </p>
  );
}

/**
 * Error boundary fallback
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 border border-red-700">
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-semibold text-red-400">Application Error</h2>
        </div>
        <p className="text-gray-300 mb-2">
          Something went wrong in the application. Please try refreshing the page.
        </p>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
            Show error details
          </summary>
          <pre className="mt-2 p-3 bg-gray-900 rounded text-xs text-red-300 overflow-auto">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
        <button
          onClick={resetErrorBoundary}
          className="mt-6 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}

/**
 * Wallet connection error
 */
export function WalletError({ message, onConnect }: { message?: string; onConnect?: () => void }) {
  return (
    <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-yellow-400 font-medium mb-1">Wallet Required</h3>
          <p className="text-yellow-300 text-sm">
            {message || 'Please connect your wallet to continue'}
          </p>
          {onConnect && (
            <button
              onClick={onConnect}
              className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Network error
 */
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-orange-400 font-medium mb-1">Network Error</h3>
          <p className="text-orange-300 text-sm">
            Unable to connect to the blockchain. Please check your connection and try again.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Transaction error with signature
 */
export function TransactionError({
  error,
  signature,
  onRetry,
}: {
  error: Error | string;
  signature?: string;
  onRetry?: () => void;
}) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-red-400 font-medium mb-1">Transaction Failed</h3>
          <p className="text-red-300 text-sm mb-2">{errorMessage}</p>
          {signature && (
            <a
              href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              View on Explorer
            </a>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry transaction
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Not found error
 */
export function NotFound({ title = 'Not Found', message, actionLabel, onAction }: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-gray-600 mb-4">
        <AlertCircle className="w-16 h-16" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-300 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-md">
        {message || 'The page or resource you\'re looking for doesn\'t exist.'}
      </p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
