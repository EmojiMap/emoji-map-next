import { EventSchemas, Inngest } from 'inngest';
import type { Detail } from '@/types/details';

type CreatePlaceWithReviews = {
  data: {
    id: string;
    details: Detail;
  };
};

type Events = {
  'places/create-with-reviews': CreatePlaceWithReviews;
};

export const inngest = new Inngest({
  id: 'my-app',
  schemas: new EventSchemas().fromRecord<Events>(),
});
