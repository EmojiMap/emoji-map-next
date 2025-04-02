import { EventSchemas, Inngest } from 'inngest';
import type { DetailResponse } from '@/types/details';

type PlaceUpsert = {
  data: {
    id: string;
    details: DetailResponse;
  };
};

type Events = {
  'places/upsert': PlaceUpsert;
};

export const inngest = new Inngest({
  id: 'my-app',
  schemas: new EventSchemas().fromRecord<Events>(),
});
