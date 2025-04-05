import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UseMutationResult } from '@tanstack/react-query';

interface Field {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

interface LiveTestProps<TData, TVariables> {
  mutation: UseMutationResult<TData, Error, TVariables>;
  fields: Field[];
}

export function LiveTest<TData, TVariables>({
  mutation,
  fields,
}: LiveTestProps<TData, TVariables>) {
  const [formData, setFormData] = React.useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Convert string values to the expected types based on field definitions
    const typedFormData = fields.reduce((acc, field) => {
      return {
        ...acc,
        [field.name]: formData[field.name],
      };
    }, {}) as TVariables;

    mutation.mutate(typedFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className='space-y-6'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {fields.map((field) => (
          <div key={field.name} className='space-y-2'>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ''}
              onChange={handleInputChange}
            />
          </div>
        ))}
        <Button
          type='submit'
          disabled={mutation.isPending}
          className='w-full sm:w-auto'
        >
          {mutation.isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Testing...
            </>
          ) : (
            'Test Endpoint'
          )}
        </Button>
      </form>

      {mutation.isSuccess && (
        <Alert className='bg-green-50'>
          <AlertDescription>
            <pre className='whitespace-pre-wrap'>
              {JSON.stringify(mutation.data, null, 2)}
            </pre>
          </AlertDescription>
        </Alert>
      )}

      {mutation.isError && (
        <Alert variant='destructive'>
          <AlertDescription>
            {mutation.error.message || 'An error occurred'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
