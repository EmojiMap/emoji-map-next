'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LiveTest } from '@/components/live-test';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useMerchantAssociateMutation } from '@/hooks';
import type {
  AssociateMerchantParams,
  AssociateMerchantResponse,
} from '@/hooks/use-merchant-associate-mutation/use-merchant-associate-mutation';

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

export default function MerchantAssociateApiReferencePage() {
  const mutation = useMerchantAssociateMutation();

  return (
    <ErrorBoundary fallbackUI={<ErrorFallback />}>
      <div className='flex flex-col gap-8 p-4'>
        {/* Title + Description */}
        <div>
          <h1 className='text-2xl font-bold'>Merchant Association</h1>
          <p className='text-sm text-muted-foreground'>
            Associate your merchant account with a restaurant or place.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Endpoint Details</CardTitle>
            <CardDescription>
              Configure and test the merchant association endpoint
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-4'>
              <div>
                <h3 className='text-sm font-medium mb-2'>URL</h3>
                <div className='flex items-center gap-2'>
                  <Badge>POST</Badge>
                  <code className='bg-muted px-2 py-1 rounded text-sm'>
                    /api/merchant/associate
                  </code>
                </div>
              </div>

              <div>
                <h3 className='text-sm font-medium mb-2'>Authentication</h3>
                <div className='flex items-center gap-2'>
                  <Badge variant='destructive'>Required</Badge>
                  <span className='text-sm'>
                    Bearer token from Clerk authentication
                  </span>
                </div>
              </div>

              <div>
                <h3 className='text-sm font-medium mb-2'>Request Body</h3>
                <pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
                  {JSON.stringify(
                    {
                      placeId: 'string (required)',
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              <div>
                <h3 className='text-sm font-medium mb-2'>Response Format</h3>
                <pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
                  {JSON.stringify(
                    {
                      success: true,
                      data: {
                        merchant: {
                          id: 'string',
                          userId: 'string',
                          places: [
                            {
                              id: 'string',
                              name: 'string',
                              address: 'string',
                            },
                          ],
                          user: {
                            id: 'string',
                            email: 'string',
                            username: 'string | null',
                          },
                        },
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Responses</CardTitle>
            <CardDescription>
              Possible error responses from the endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Badge className='bg-red-500 text-white'>400</Badge>
                <span className='text-sm'>
                  Invalid parameters or missing required fields
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Badge className='bg-red-500 text-white'>401</Badge>
                <span className='text-sm'>
                  Unauthorized - No valid authentication token
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Badge className='bg-red-500 text-white'>404</Badge>
                <span className='text-sm'>User or place not found</span>
              </div>
              <div className='flex items-center gap-2'>
                <Badge className='bg-red-500 text-white'>409</Badge>
                <span className='text-sm'>
                  Place is already claimed by another merchant
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Badge className='bg-red-500 text-white'>500</Badge>
                <span className='text-sm'>Internal server error</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Test</CardTitle>
            <CardDescription>
              Test the endpoint with your current authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LiveTest<AssociateMerchantResponse, AssociateMerchantParams>
              mutation={mutation}
              fields={[
                {
                  name: 'placeId',
                  type: 'text',
                  label: 'Place ID',
                  placeholder: 'Enter a Google Place ID',
                  required: true,
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
