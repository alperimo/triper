/**
 * Loading Components
 * Reusable loading states, spinners, and skeletons
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Simple spinner
 */
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
}

/**
 * Full-page loading overlay
 */
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 max-w-sm">
        <Spinner size="lg" className="text-blue-500" />
        <p className="text-white font-medium">{message}</p>
      </div>
    </div>
  );
}

/**
 * Inline loading state
 */
export function LoadingInline({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-400">
      <Spinner size="sm" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

/**
 * Button with loading state
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {loading ? loadingText || children : children}
    </button>
  );
}

/**
 * Skeleton loader for text
 */
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-700 rounded animate-pulse"
          style={{ width: `${Math.random() * 30 + 70}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for cards
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="space-y-3">
        <div className="h-6 bg-gray-700 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2" />
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-700 rounded animate-pulse w-5/6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading state for lists
 */
export function LoadingList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Empty state
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-gray-500 mb-4">{icon}</div>}
      <h3 className="text-xl font-semibold text-gray-300 mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-6 max-w-md">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Progress bar
 */
export function ProgressBar({
  progress,
  label,
  showPercentage = true,
}: {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{label}</span>
          {showPercentage && <span className="text-gray-300">{progress}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Loading dots animation
 */
export function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

/**
 * Pulse animation for loading states
 */
export function PulseLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
      <div className="absolute inset-0 rounded-full bg-blue-600" />
    </div>
  );
}
