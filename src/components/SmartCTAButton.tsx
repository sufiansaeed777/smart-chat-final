'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';

interface SmartCTAButtonProps {
  text: string;
  className?: string;
  showIcon?: boolean;
  redirectToBilling?: boolean; // If true, logged-in users go to billing page
}

/**
 * Smart CTA Button that redirects based on authentication status
 * - Not logged in → /signup
 * - Logged in + redirectToBilling → billing page (for Buy buttons)
 * - Manager → /manager-dashboard or /manager-dashboard/billing
 * - Admin → /admin-dashboard
 * - User → /user-dashboard
 */
export default function SmartCTAButton({
  text,
  className = '',
  showIcon = true,
  redirectToBilling = false
}: SmartCTAButtonProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  // Detect if this is a buy/pricing action based on text
  const isBuyAction = text.toLowerCase().includes('buy') ||
    text.toLowerCase().includes('start free trial') ||
    text.toLowerCase().includes('get started') ||
    text.toLowerCase().includes('upgrade') ||
    text.toLowerCase().includes('subscribe') ||
    text.toLowerCase().includes('get custom quote');

  const handleClick = () => {
    setIsLoading(true);

    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;

      // If it's a buy action or redirectToBilling is true, go to billing page
      if (isBuyAction || redirectToBilling) {
        switch (role) {
          case 'manager':
            router.push('/manager-dashboard/billing');
            break;
          case 'admin':
            router.push('/admin-dashboard/billing');
            break;
          case 'user':
            // Users don't have billing, redirect to dashboard
            router.push('/user-dashboard');
            break;
          default:
            router.push('/signup');
        }
      } else {
        // Regular dashboard redirect
        switch (role) {
          case 'manager':
            router.push('/manager-dashboard');
            break;
          case 'admin':
            router.push('/admin-dashboard');
            break;
          case 'user':
            router.push('/user-dashboard');
            break;
          default:
            router.push('/signup');
        }
      }
    } else {
      router.push('/signup');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`group flex items-center ${className} ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
    >
      {text}
      {showIcon && (
        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
      )}
    </button>
  );
}
