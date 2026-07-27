/**
 * TrustChain-5G Frontend Utility Helpers.
 * Provides className merging via clsx/tailwind-merge and formatting routines.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes intelligently without conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format timestamp into human readable presentation.
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Return appropriate Tailwind color class based on Numerical Trust Score.
 */
export function getTrustScoreColor(score: number): string {
  if (score >= 85) return 'text-success font-semibold';
  if (score >= 65) return 'text-warning font-semibold';
  return 'text-danger font-bold animate-pulse';
}

/**
 * Return Badge color tone corresponding to Threat Severity level.
 */
export function getSeverityBadgeTone(severity: string): 'danger' | 'warning' | 'info' | 'primary' | 'success' {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'primary';
  }
}
