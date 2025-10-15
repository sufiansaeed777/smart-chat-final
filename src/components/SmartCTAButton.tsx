'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';

interface SmartCTAButtonProps {
  text: string;
  className?: string;
  showIcon?: boolean;
}

/**
 * Smart CTA Button that redirects based on authentication status
 * - Not logged in → /signup
 * - Manager → /manager-dashboard
 * - Admin → /admin-dashboard
 * - User → /user-dashboard
 */
export default function SmartCTAButton({
  text,
  className = '',
  showIcon = true
}: SmartCTAButtonProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);

    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;

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
