'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignedIn, SignedOut, useAuth, useClerk } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ThemedSignInButton } from '@/components/auth/themed-signin-button';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export default function AccountPage() {
  const { signOut } = useClerk();
  const router = useRouter();
  const { getToken } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await fetch(`/api/user`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      signOut();
      setTimeout(() => {
        router.push('/');
      }, 3000);
    },
    onError: (error) => {
      console.error('Error deleting account:', error);
      toast.error('Error deleting account');
    },
  });

  const handleDeleteRequest = () => {
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteAccountMutation.mutate();
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    router.push('/account');
  };

  return (
    <>
      <SignedOut>
        <div className='max-w-md w-full bg-white/90 dark:bg-card/80 backdrop-blur-md text-card-foreground rounded-lg shadow-lg border border-purple-200 dark:border-white/10 p-8 z-10'>
          <div className='text-center mb-6'>
            <h1 className='text-2xl font-bold text-gray-800 dark:text-white'>
              Account Login
            </h1>
            <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
              Sign in to access your account
            </p>
          </div>
          <div className='flex justify-center items-center'>
            <ThemedSignInButton>
              <Button
                type='button'
                className='px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105
                dark:text-white'
              >
                Sign In
              </Button>
            </ThemedSignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className='max-w-md w-full mx-auto bg-white/90 dark:bg-card/80 backdrop-blur-md text-card-foreground rounded-lg shadow-lg border border-purple-200 dark:border-white/10 p-8 z-10'>
          <div className='space-y-6'>
            <div className='text-center border-b border-gray-200 dark:border-gray-800 pb-6'>
              <AlertTriangle className='h-12 w-12 text-destructive mx-auto mb-4' />
              <h1 className='text-2xl font-bold text-gray-800 dark:text-white'>
                Delete Your Account
              </h1>
              <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                Are you sure you want to delete your account? This action cannot
                be undone and all your data will be permanently removed.
              </p>
            </div>

            <div className='flex justify-center items-center pt-4'>
              <Button
                variant='destructive'
                onClick={handleDeleteRequest}
                className='px-8 py-6 transition-all duration-200 transform hover:scale-105'
              >
                Delete My Account
              </Button>
            </div>
          </div>
        </div>

        <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
          <SheetContent className='sm:max-w-md'>
            <SheetHeader>
              <SheetTitle className='text-destructive flex items-center gap-2'>
                <AlertTriangle className='h-5 w-5' /> Confirm Account Deletion
              </SheetTitle>
              <SheetDescription>
                This action is irreversible. Once deleted, your account and all
                associated data will be permanently removed from our systems and
                cannot be recovered.
              </SheetDescription>
            </SheetHeader>
            <div className='py-4'>
              <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Are you absolutely sure you want to proceed with account
                deletion?
              </p>
            </div>
            <SheetFooter className='flex flex-col sm:flex-row gap-2'>
              <Button variant='outline' onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={handleConfirmDelete}
                disabled={deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending
                  ? 'Deleting...'
                  : 'Yes, Delete My Account'}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </SignedIn>
    </>
  );
}
