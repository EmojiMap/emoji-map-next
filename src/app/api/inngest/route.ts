import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { createPlace, createPlacePhotos } from '@/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [createPlace, createPlacePhotos],
});
