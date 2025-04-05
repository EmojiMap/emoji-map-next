'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { InfoIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMerchantAssociateMutation,
  useMerchantQuery,
  useMerchantRemoveAssociationMutation,
  useMerchantSearchMutation,
} from '@/hooks';

// Form schema for merchant search
const searchFormSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  showRawJson: z.boolean().default(false),
});

// Type inference for our form values
type SearchFormValues = z.infer<typeof searchFormSchema>;

// Skeleton component for search results
const SearchResultsSkeleton = () => {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-72' /> {/* Title skeleton */}
        <div className='p-3 border rounded-md bg-muted'>
          {[1, 2, 3].map((item) => (
            <div key={item} className='flex justify-between items-center mb-2'>
              <Skeleton className='h-5 w-40' /> {/* Label skeleton */}
              <Skeleton className='h-5 w-60' /> {/* Value skeleton */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function ErrorFallback() {
  return (
    <Alert variant='destructive'>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        An error occurred while fetching merchant data. Please try again later.
      </AlertDescription>
    </Alert>
  );
}

function SearchForm() {
  const { mutate, data, isPending, error } = useMerchantSearchMutation();
  const [showRawJson, setShowRawJson] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      name: '',
      city: '',
      state: '',
      showRawJson: false,
    },
  });

  const handleSubmit = (values: SearchFormValues) => {
    mutate({
      name: values.name,
      city: values.city,
      state: values.state,
    });
  };

  const handleReset = () => {
    form.reset({
      name: '',
      city: '',
      state: '',
      showRawJson: false,
    });
    setShowRawJson(false);
  };

  const { data: merchantData } = useMerchantQuery();

  // Helper function to render a detail field
  const renderDetailField = (label: string, value: unknown) => {
    if (value === undefined || value === null) return null;

    return (
      <div
        className='flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0'
        key={label}
      >
        <span className='font-medium'>{label}:</span>
        <span className='text-right max-w-[60%]'>{String(value)}</span>
      </div>
    );
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('ID copied to clipboard');
  };

  const { mutate: removeAssociation, isPending: isRemovingAssociation } =
    useMerchantRemoveAssociationMutation({
      onSuccess: () => {
        toast.success('Association removed');
        queryClient.invalidateQueries({ queryKey: ['merchant'] });
      },
    });

  const { mutate: addAssociation, isPending: isAddingAssociation } =
    useMerchantAssociateMutation({
      onSuccess: () => {
        toast.success('Association added');
        queryClient.invalidateQueries({ queryKey: ['merchant'] });
      },
    });

  return (
    <div className='flex flex-col gap-8 p-4'>
      {/* Search Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
          <CardDescription>
            Configure your merchant search request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className='space-y-6'
            >
              <div className='grid grid-cols-1 gap-6'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., McDonald's" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the name of the restaurant to search for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='city'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., San Francisco' {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the city to search in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='state'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., CA' {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the state to search in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='showRawJson'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setShowRawJson(!!checked);
                        }}
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Show Raw JSON</FormLabel>
                      <FormDescription>
                        Display the raw API response
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className='flex justify-between pt-2'>
                <Button type='button' variant='outline' onClick={handleReset}>
                  Reset
                </Button>
                <Button type='submit' disabled={isPending}>
                  {isPending ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <div className='space-y-1.5'>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>Found merchant locations</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className='overflow-hidden'>
          {error && (
            <Alert variant='destructive' className='mb-4'>
              <InfoIcon className='h-4 w-4' />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <div className='min-h-[250px]'>
            {isPending ? (
              <SearchResultsSkeleton />
            ) : data ? (
              <div className='flex flex-col'>
                {/* Result count */}
                <div className='p-3 border rounded-md mb-4 bg-muted/30'>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium'>Results Found:</span>
                    <span>{data.count}</span>
                  </div>
                </div>

                <Separator className='my-4' />

                {/* Display results */}
                {showRawJson ? (
                  <div className='relative h-[250px] overflow-hidden'>
                    <div className='absolute inset-0 overflow-auto bg-muted p-4 rounded-md'>
                      <pre className='text-xs'>
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className='relative h-[250px] overflow-hidden'>
                    <div className='absolute inset-0 overflow-auto pr-1 border border-muted rounded-md'>
                      <div className='space-y-4 p-4'>
                        {data.data.map((place) => (
                          <div
                            key={place.id}
                            className='p-3 border rounded-md bg-muted/30'
                          >
                            <div className='flex justify-between'>
                              <h3 className='text-lg font-semibold mb-3'>
                                {place.displayName || 'Name not available'}
                              </h3>

                              {/* Buttons */}
                              <div className='space-x-4'>
                                {/* Copy ID Button */}
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => handleCopyId(place.id)}
                                >
                                  Copy ID
                                </Button>

                                {/* Associate / Remove Button */}
                                {merchantData?.merchant?.places?.some(
                                  (merchant) => merchant.id === place.id
                                ) ? (
                                  <Button
                                    variant='destructive'
                                    size='sm'
                                    onClick={() => {
                                      removeAssociation({ placeId: place.id });
                                    }}
                                    disabled={isRemovingAssociation}
                                  >
                                    Remove
                                  </Button>
                                ) : (
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => {
                                      addAssociation({ placeId: place.id });
                                    }}
                                    disabled={isAddingAssociation}
                                  >
                                    Associate
                                  </Button>
                                )}
                              </div>
                            </div>
                            <Separator className='my-4' />
                            <div className='space-y-1'>
                              {renderDetailField('ID', place.id)}
                              {renderDetailField(
                                'Address',
                                place.formattedAddress
                              )}
                              {renderDetailField(
                                'Phone',
                                place.nationalPhoneNumber || 'Not available'
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-64 text-center'>
                <p className='text-muted-foreground'>
                  Enter search criteria and click &quot;Search&quot; to see
                  results
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MerchantSearchApiReferencePage() {
  return (
    <div className='flex flex-col gap-8 p-4'>
      {/* Title + Description */}
      <div>
        <h1 className='text-2xl font-bold'>Merchant Business Search</h1>
        <p className='text-sm text-muted-foreground'>
          Search for restaurants using the Google Places API to find businesses
          that merchants can claim.
        </p>
      </div>

      <ErrorBoundary fallbackUI={<ErrorFallback />}>
        <SearchForm />
      </ErrorBoundary>
    </div>
  );
}
