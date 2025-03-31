'use client';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LogoPage() {
  const logos = [
    {
      name: 'Default Logo',
      description: 'Primary logo with full background and details',
      path: '/logo-blur.png',
      fileName: 'logo-blur.png',
    },
    {
      name: 'Transparent Background',
      description: 'Logo with transparent background',
      path: '/logo-no-background.png',
      fileName: 'logo-no-background.png',
    },
    {
      name: 'App Store QR Code',
      description: 'QR Code for the App Store',
      path: '/app-store-qr.png',
      fileName: 'app-store-qr.png',
    },
  ];

  const handleDownload = (path: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = path;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='container mx-auto max-w-7xl px-6 py-8'>
      <div className='flex flex-col gap-8'>
        {/* Header Section */}
        <div className='space-y-2'>
          <h1 className='text-4xl font-bold tracking-tight'>Logo Assets</h1>
          <p className='text-lg text-muted-foreground'>
            Access and download official Emoji Map logo variations
          </p>
        </div>

        {/* Logo Grid */}
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {logos.map((logo) => (
            <Card key={logo.name} className='flex flex-col overflow-hidden'>
              <div className='relative aspect-square w-full bg-gradient-to-br from-muted/50 to-muted p-6'>
                <Image
                  src={logo.path}
                  alt={logo.name}
                  fill
                  className='object-contain p-6'
                />
              </div>
              <div className='flex flex-1 flex-col gap-2 p-6'>
                <div className='space-y-1'>
                  <h3 className='font-semibold tracking-tight'>{logo.name}</h3>
                  <p className='text-sm text-muted-foreground'>
                    {logo.description}
                  </p>
                </div>
                <div className='mt-4'>
                  <Button
                    onClick={() => handleDownload(logo.path, logo.fileName)}
                    variant='outline'
                    className='w-full'
                  >
                    <Download className='mr-2 h-4 w-4' />
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Usage Guidelines */}
        <div className='mt-8'>
          <Card className='p-6'>
            <h2 className='text-xl font-semibold tracking-tight'>
              Usage Guidelines
            </h2>
            <ul className='mt-4 space-y-2 text-sm text-muted-foreground'>
              <li>
                • Use the transparent background version for dark backgrounds
              </li>
              <li>• Maintain aspect ratio when resizing</li>
              <li>• Keep minimum padding around the logo</li>
              <li>• Do not modify or distort the logo</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
