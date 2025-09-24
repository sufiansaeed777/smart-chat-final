'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function DeactivationNotification() {
  const { data: session } = useSession();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Check if this is a deactivation scenario
    const checkDeactivation = async () => {
      if (!session?.user?.email) return;

      try {
        const response = await fetch('/api/user/profile');
        if (response.status === 403) {
          setShowNotification(true);
          // Auto-hide after 5 seconds
          setTimeout(() => setShowNotification(false), 5000);
        }
      } catch (error) {
        console.error('Error checking deactivation status:', error);
      }
    };

    checkDeactivation();
  }, [session]);

  if (!showNotification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="font-medium">Account Deactivated</span>
      </div>
      <p className="text-sm mt-1">Your account has been deactivated. You will be logged out.</p>
    </div>
  );
}
