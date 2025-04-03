import { EventSchemas, Inngest } from 'inngest';
import type { DetailResponse } from '@/types/details';

type PlaceCreate = {
  data: {
    id: string;
    details: DetailResponse;
  };
};

type Events = {
  'places/create': PlaceCreate;
};

export const inngest = new Inngest({
  id: 'my-app',
  schemas: new EventSchemas().fromRecord<Events>(),
});
