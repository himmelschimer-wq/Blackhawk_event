import React from 'react';
import { SupabaseStatusBadge } from './SupabaseStatusBadge';

export { SupabaseStatusBadge };

interface FirebaseStatusBadgeProps {
  variant?: 'compact' | 'full' | 'admin-header';
}

export const FirebaseStatusBadge: React.FC<FirebaseStatusBadgeProps> = (props) => {
  return <SupabaseStatusBadge {...props} />;
};

export default FirebaseStatusBadge;
