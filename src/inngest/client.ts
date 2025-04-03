import { EventSchemas, Inngest } from 'inngest';
import type { DetailResponse } from '@/types/details';

type PlaceCreate = {
  data: {
    id: string;
    details: DetailResponse;
  };
};

type PlaceGetDetails = {
  data: {
    id: string;
  };
};

type Events = {
  'places/create': PlaceCreate;
  'places/get-details': PlaceGetDetails;
};

export const inngest = new Inngest({
  id: 'my-app',
  schemas: new EventSchemas().fromRecord<Events>(),
});
