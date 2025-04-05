import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function MerchantReviewsApiReferencePage() {
  return (
    <div className='flex flex-col gap-8 p-4'>
      {/* Title + Description */}
      <div>
        <h1 className='text-2xl font-bold'>Merchant Review Managment</h1>
        <p className='text-sm text-muted-foreground'>
          Manage the visibility of reviews on your places through this API
          endpoint. You can update multiple reviews in a single request.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            This endpoint requires authentication via Clerk. You must be logged
            in as a merchant and can only modify reviews on places you own.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Badge variant='outline'>Authorization</Badge>
            <span>Required</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Body</CardTitle>
          <CardDescription>
            Send an array of review updates in JSON format.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <h3 className='font-semibold'>Review Status Options</h3>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>DEFAULT</Badge>
                  <span>
                    Normal visibility, shown in the regular review list
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>HIDDEN</Badge>
                  <span>Review is not visible to other users</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>FEATURED</Badge>
                  <span>
                    Review is highlighted and shown at the top of the list
                  </span>
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <h3 className='font-semibold'>Request Format</h3>
              <pre className='p-4 bg-muted rounded-lg overflow-auto'>
                {JSON.stringify(
                  {
                    updates: [
                      {
                        reviewId: 'review_123',
                        status: 'HIDDEN',
                      },
                      {
                        reviewId: 'review_456',
                        status: 'FEATURED',
                      },
                    ],
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
          <CardTitle>Response</CardTitle>
          <CardDescription>
            The endpoint returns the updated reviews or an error response.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Badge className='bg-green-500 text-white'>200 OK</Badge>
                <h3 className='font-semibold'>Success Response</h3>
              </div>
              <pre className='p-4 bg-muted rounded-lg overflow-auto'>
                {JSON.stringify(
                  {
                    success: true,
                    updatedReviews: [
                      {
                        id: 'review_123',
                        status: 'HIDDEN',
                        updatedAt: '2024-04-05T12:00:00Z',
                      },
                    ],
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className='space-y-2'>
              <h3 className='font-semibold'>Error Responses</h3>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Badge className='bg-red-500 text-white'>400</Badge>
                  <span>Bad Request - Invalid request data</span>
                </div>
                <pre className='p-4 bg-muted rounded-lg overflow-auto'>
                  {JSON.stringify(
                    {
                      success: false,
                      error: 'Invalid request data',
                      details: [
                        {
                          path: ['updates'],
                          message: 'At least one review update is required',
                        },
                      ],
                    },
                    null,
                    2
                  )}
                </pre>
                <div className='flex items-center gap-2'>
                  <Badge className='bg-red-500 text-white'>500</Badge>
                  <span>
                    Internal Server Error - Server-side error occurred
                  </span>
                </div>
                <pre className='p-4 bg-muted rounded-lg overflow-auto'>
                  {JSON.stringify(
                    {
                      success: false,
                      error: 'Failed to update reviews',
                      details: 'Database error',
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
