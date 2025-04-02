import { inngest } from './client';

export const helloWorld = inngest.createFunction(
  { id: 'hello/world' },
  { event: 'hello/world' },
  async ({ event }) => {
    const { id } = event.data;

    return { message: `Hello World ${id}` };
  }
);
