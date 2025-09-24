'use client';
import { useSessionValidation } from '@/hooks/useSessionValidation';

export default function SessionMonitor() {
  // This hook handles all session validation and logout logic
  useSessionValidation();
  
  return null; // This component doesn't render anything
}
