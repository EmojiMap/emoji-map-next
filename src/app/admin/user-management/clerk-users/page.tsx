'use client';

import { useState } from 'react';
import { ClerkUserDataTable } from '@/components/clerk-user-data-table';
import { useClerkUsers } from '@/hooks';

export default function ClerkUsersPage() {
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
  });

  const { data, isLoading, error } = useClerkUsers({
    limit: pagination.limit,
    offset: pagination.offset,
  });

  const handlePaginationChange = (limit: number, offset: number) => {
    setPagination({ limit, offset });
  };

  // Extract users and metadata from the response
  const users = data?.users || [];
  const totalCount = data?.totalCount || 0;
  const limit = data?.limit || pagination.limit;
  const offset = data?.offset || pagination.offset;

  return (
    <div className='container max-w-7xl py-10'>
      <h1 className='text-3xl font-bold mb-6'>User Management</h1>
      <ClerkUserDataTable
        users={users}
        totalCount={totalCount}
        limit={limit}
        offset={offset}
        isLoading={isLoading}
        error={error as Error | null}
        onPaginationChange={handlePaginationChange}
      />
    </div>
  );
}
