'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MoreHorizontal, Search } from 'lucide-react';
import { useDebounce } from 'react-use';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminClerkUsersResponse } from '@/types/admin-clerk-users';
import type { AdminClerkUsersToggleAdminStatusResponse } from '@/types/admin-clerk-users-toggle-admin-status';
import type { ErrorResponse } from '@/types/error-response';
import { ClerkUserDetailsDialog } from './clerk-user-details-dialog';
import type { User } from '@clerk/nextjs/server';

interface ClerkUserDataTableProps {
  users: User[];
  totalCount: number;
  limit: number;
  offset: number;
  isLoading: boolean;
  error: Error | null;
  onPaginationChange: (limit: number, offset: number) => void;
}

export function ClerkUserDataTable({
  users,
  totalCount,
  limit,
  offset,
  isLoading: isInitialLoading,
  error: initialError,
  onPaginationChange,
}: ClerkUserDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Setup debounced search term
  useDebounce(
    () => {
      setDebouncedSearchTerm(searchTerm);
    },
    300,
    [searchTerm]
  );

  // Filter users based on search term
  const filteredUsers = searchTerm
    ? users.filter(
        (user) =>
          // Search in user ID
          user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          // Search in email addresses
          user.emailAddresses.some((email) =>
            email.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          // Search in username
          (user.username &&
            user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          // Search in first name
          (user.firstName &&
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          // Search in last name
          (user.lastName &&
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : users;

  // Server-side search query when no local results found
  const { isFetching: isSearching, data: searchData } =
    useQuery<AdminClerkUsersResponse>({
      queryKey: ['users', 'search', debouncedSearchTerm],
      queryFn: async () => {
        const searchParams = new URLSearchParams({
          limit: limit.toString(),
          offset: '0',
          query: debouncedSearchTerm,
        });

        const response = await fetch(`/api/admin/clerk-users?${searchParams}`);
        if (!response.ok) {
          throw new Error('Failed to search users');
        }

        return response.json();
      },
      enabled: Boolean(debouncedSearchTerm && filteredUsers.length === 0),
      retry: false,
      gcTime: 0,
    });

  // Use search results if available, otherwise use filtered local data
  const displayUsers = searchData?.users || filteredUsers;
  const displayTotalCount = searchData?.totalCount ?? totalCount;

  // Mutation for toggling admin status
  const toggleAdminMutation = useMutation<
    AdminClerkUsersToggleAdminStatusResponse,
    ErrorResponse,
    string
  >({
    mutationFn: async (userId: string) => {
      const response = await fetch(
        '/api/admin/clerk-users/toggle-admin-status',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw error as ErrorResponse;
      }

      return response.json();
    },
    onSuccess: (_, userId) => {
      const user = users.find((u) => u.id === userId);
      const name = user?.firstName
        ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
        : user?.username || user?.emailAddresses[0]?.emailAddress;
      toast.success(
        `Admin status ${
          user?.publicMetadata?.admin ? 'removed from' : 'granted to'
        } ${name}`
      );
    },
    onError: (error: ErrorResponse) => {
      toast.error('Error: ' + error.error);
    },
  });

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(displayTotalCount / limit);

  // Handle page change
  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * limit;
    onPaginationChange(limit, newOffset);
  };

  // Handle limit change
  const handleLimitChange = (value: string) => {
    const newLimit = parseInt(value, 10);
    onPaginationChange(newLimit, 0); // Reset to first page when changing limit
  };

  // Handle row click to open details dialog
  const handleRowClick = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  // Generate page numbers for pagination
  const generatePaginationItems = () => {
    const items = [];

    // Always include first page
    items.push(
      <PaginationItem key='page-1'>
        <PaginationLink
          onClick={() => handlePageChange(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Add ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key='ellipsis-1'>
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Add page numbers around current page
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key='ellipsis-2'>
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always include last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Update loading state to include search state
  if (isInitialLoading || isSearching) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clerk Users</CardTitle>
          <CardDescription>A list of all users in Clerk</CardDescription>

          <div className='flex items-center gap-2 mt-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Search users...'
                className='w-full pl-8'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant='outline' onClick={() => setSearchTerm('')}>
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className='w-[50px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className='h-24 text-center'>
                    <div className='flex items-center justify-center'>
                      <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
                      <span className='ml-2'>
                        {isSearching ? 'Searching...' : 'Loading...'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (initialError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='bg-destructive/10 text-destructive p-4 rounded-md'>
            {initialError.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format date for display
  const formatDate = (timestamp: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get primary email for a user
  const getPrimaryEmail = (user: User) => {
    if (user.emailAddresses.length === 0) return '-';
    return user.emailAddresses[0].emailAddress;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clerk Users</CardTitle>
        <CardDescription>A list of all users in Clerk</CardDescription>

        <div className='flex items-center gap-2 mt-4'>
          <div className='relative flex-1'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search users...'
              className='w-full pl-8'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant='outline' onClick={() => setSearchTerm('')}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableCaption>
              Showing {offset + 1}-
              {Math.min(offset + displayUsers.length, displayTotalCount)} of{' '}
              {displayTotalCount} users
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className='w-[50px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='text-center py-8 text-muted-foreground'
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                displayUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className='cursor-pointer hover:bg-muted/60'
                  >
                    <TableCell onClick={() => handleRowClick(user)}>
                      <p className='font-medium'>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.firstName || user.lastName || '-'}
                      </p>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(user)}>
                      {getPrimaryEmail(user)}
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(user)}>
                      <code className='rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'>
                        {user.id}
                      </code>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(user)}>
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' className='h-8 w-8 p-0'>
                            <span className='sr-only'>Open menu</span>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => {
                              toggleAdminMutation.mutate(user.id);
                            }}
                            disabled={toggleAdminMutation.isPending}
                          >
                            {toggleAdminMutation.isPending ? (
                              <div className='flex items-center gap-2'>
                                <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
                                <span>Processing...</span>
                              </div>
                            ) : Boolean(user.publicMetadata?.admin) ? (
                              'Remove Admin'
                            ) : (
                              'Make Admin'
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className='flex items-center justify-between mt-4'>
          <div className='flex items-center space-x-2'>
            <p className='text-sm text-muted-foreground'>Rows per page</p>
            <Select value={limit.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger className='w-[70px]'>
                <SelectValue placeholder={limit.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='5'>5</SelectItem>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='20'>20</SelectItem>
                <SelectItem value='50'>50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationPrevious
                onClick={() =>
                  currentPage > 1 && handlePageChange(currentPage - 1)
                }
                className={
                  currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                }
              />

              {generatePaginationItems()}

              <PaginationNext
                onClick={() =>
                  currentPage < totalPages && handlePageChange(currentPage + 1)
                }
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>

      <ClerkUserDetailsDialog
        user={selectedUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
}
