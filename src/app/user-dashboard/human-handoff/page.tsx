'use client';

import React from 'react';
import RoleGuard from '@/components/auth/RoleGuard';
import HumanHandoff from '@/components/dashboard/HumanHandoff';

const UserHumanHandoffPage = () => {
  return (
    <RoleGuard allowedRoles={['user']}>
      <HumanHandoff />
    </RoleGuard>
  );
};

export default UserHumanHandoffPage;
