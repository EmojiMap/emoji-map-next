'use client';

import { useQuery } from '@tanstack/react-query';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserWithCounts } from '@/types/admin-db-users';
import type { FavoriteResponse } from '@/types/admin-user-favorites';
import type { RatingResponse } from '@/types/admin-user-ratings';

interface UserDetailsDialogProps {
  user: UserWithCounts | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useFetchUserFavorites(userId: string | null) {
  return useQuery({
    queryKey: ['user-favorites', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const res = await fetch(`/api/admin/user-favorites?userId=${userId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = (await res.json()) as FavoriteResponse;

      return data.favorites;
    },
    enabled: !!userId,
  });
}

function useFetchUserRatings(userId: string | null) {
  return useQuery({
    queryKey: ['user-ratings', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const res = await fetch(`/api/admin/user-ratings?userId=${userId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch ratings');
      }

      const data = (await res.json()) as RatingResponse;

      return data.ratings;
    },
    enabled: !!userId,
  });
}

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  const { data: favorites = [], isLoading: isFavoritesLoading } =
    useFetchUserFavorites(user?.id || null);
  const { data: ratings = [], isLoading: isRatingsLoading } =
    useFetchUserRatings(user?.id || null);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Details for{' '}
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.email}
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-4 py-4'>
          <div className='col-span-2'>
            <h3 className='font-medium text-sm mb-2'>User ID</h3>
            <div className='flex items-center gap-2'>
              <code className='rounded bg-muted px-3 py-2 font-mono text-sm'>
                {user.id}
              </code>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8'
                onClick={() => {
                  navigator.clipboard.writeText(user.id);
                  toast.success('User ID copied to clipboard');
                }}
              >
                <Copy className='h-4 w-4' />
                <span className='sr-only'>Copy user ID</span>
              </Button>
            </div>
          </div>
          <div>
            <h3 className='font-medium text-sm'>Email</h3>
            <p className='text-sm'>{user.email}</p>
          </div>
          <div>
            <h3 className='font-medium text-sm'>Username</h3>
            <p className='text-sm'>{user.username || '-'}</p>
          </div>
          <div>
            <h3 className='font-medium text-sm'>First Name</h3>
            <p className='text-sm'>{user.firstName || '-'}</p>
          </div>
          <div>
            <h3 className='font-medium text-sm'>Last Name</h3>
            <p className='text-sm'>{user.lastName || '-'}</p>
          </div>
          <div>
            <h3 className='font-medium text-sm'>Created</h3>
            <p className='text-sm'>
              {formatDate(new Date(user.createdAt).toISOString())}
            </p>
          </div>
          <div>
            <h3 className='font-medium text-sm'>Updated</h3>
            <p className='text-sm'>
              {formatDate(new Date(user.updatedAt).toISOString())}
            </p>
          </div>
        </div>

        <Tabs defaultValue='favorites' className='w-full mt-4'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='favorites'>
              Favorites ({user.favoritesCount})
            </TabsTrigger>
            <TabsTrigger value='ratings'>
              Ratings ({user.ratingsCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='favorites'>
            <Card>
              <CardContent className='pt-6'>
                {isFavoritesLoading ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-8 w-full' />
                    <Skeleton className='h-8 w-full' />
                    <Skeleton className='h-8 w-full' />
                  </div>
                ) : favorites.length === 0 ? (
                  <p className='text-center py-4 text-muted-foreground'>
                    No favorites found
                  </p>
                ) : (
                  <div className='rounded-md border overflow-hidden'>
                    <Table>
                      <TableCaption>User&apos;s favorite places</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Place Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Added On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {favorites.map((favorite) => (
                          <TableRow key={favorite.id}>
                            <TableCell className='font-medium'>
                              {favorite.place.name || 'Unnamed place'}
                            </TableCell>
                            <TableCell>
                              {favorite.place.description?.substring(0, 100) ||
                                'No description'}
                              {favorite.place.description &&
                                favorite.place.description.length > 100 &&
                                '...'}
                            </TableCell>
                            <TableCell>
                              {formatDate(
                                new Date(favorite.createdAt).toISOString()
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='ratings'>
            <Card>
              <CardContent className='pt-6'>
                {isRatingsLoading ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-8 w-full' />
                    <Skeleton className='h-8 w-full' />
                    <Skeleton className='h-8 w-full' />
                  </div>
                ) : ratings.length === 0 ? (
                  <p className='text-center py-4 text-muted-foreground'>
                    No ratings found
                  </p>
                ) : (
                  <div className='rounded-md border overflow-hidden'>
                    <Table>
                      <TableCaption>User&apos;s ratings</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Place Name</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Rated On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ratings.map((rating) => (
                          <TableRow key={rating.id}>
                            <TableCell className='font-medium'>
                              {rating.place.name || 'Unnamed place'}
                            </TableCell>
                            <TableCell>
                              <div className='flex'>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-lg ${
                                      i < rating.rating
                                        ? 'text-yellow-500'
                                        : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {rating.place.description?.substring(0, 100) ||
                                'No description'}
                              {rating.place.description &&
                                rating.place.description.length > 100 &&
                                '...'}
                            </TableCell>
                            <TableCell>
                              {formatDate(
                                new Date(rating.createdAt).toISOString()
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
