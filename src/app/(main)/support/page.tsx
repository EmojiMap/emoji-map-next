'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { Mail, MessageSquareText, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FAQS } from '@/constants/faqs';
import { IOS_GITHUB_REPO, WEB_GITHUB_REPO } from '@/constants/links';

/**
 * Support page component
 *
 * This page provides:
 * 1. Frequently Asked Questions in an accordion format
 * 2. A contact form to submit bug reports or support tickets
 *
 * @returns {JSX.Element} Support page component
 */
export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('faq');

  // Define form schema with Zod
  const formSchema = z.object({
    name: z.string().min(2, {
      message: 'Name must be at least 2 characters.',
    }),
    email: z.string().email({
      message: 'Please enter a valid email address.',
    }),
    subject: z.string().min(5, {
      message: 'Subject must be at least 5 characters.',
    }),
    message: z.string().min(10, {
      message: 'Message must be at least 10 characters.',
    }),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to send support request');
      }

      toast.success('Support request sent successfully!');
      form.reset();
    } catch (error) {
      toast.error('Failed to send support request. Please try again later.');
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='container max-w-6xl mx-auto py-12 px-4 sm:px-6 relative z-10 bg-white/90 dark:bg-card/80 backdrop-blur-md rounded-lg shadow-lg border border-purple-200 dark:border-white/10'>
      {/* Hero Section */}
      <div className='text-center mb-12 relative'>
        <div className='flex justify-center mb-6'>
          <div className='relative'>
            <Image
              src='/logo-blur.png'
              alt='Emoji Map Logo'
              width={120}
              height={120}
              className='rounded-xl'
              style={{
                filter: 'drop-shadow(0 0 12px rgba(79, 70, 229, 0.4))',
              }}
              priority
            />
            <div className='absolute -top-2 -right-2 text-2xl animate-bounce'>
              ❓
            </div>
            <div
              className='absolute -bottom-2 -left-2 text-2xl animate-bounce'
              style={{ animationDelay: '0.5s' }}
            >
              ❔
            </div>
          </div>
        </div>
        <h1 className='text-4xl font-bold tracking-tight text-foreground mb-3'>
          Support Center
        </h1>
        <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
          We&apos;re here to help with any questions or issues you have with
          Emoji Map. <span className='inline-block animate-bounce'>🤗</span>
        </p>
      </div>

      {/* Support Options */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16'>
        <Card
          className='h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer bg-gradient-to-br from-background to-background/80'
          onClick={() => setActiveTab('faq')}
        >
          <CardHeader className='space-y-1'>
            <div className='flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2'>
              <MessageSquareText className='w-6 h-6 text-primary' />
            </div>
            <CardTitle className='flex items-center gap-2'>
              FAQs <span className='text-xl'>🤔</span>
            </CardTitle>
            <CardDescription>
              Find answers to commonly asked questions about Emoji Map.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className='h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer bg-gradient-to-br from-background to-background/80'
          onClick={() => setActiveTab('contact')}
        >
          <CardHeader className='space-y-1'>
            <div className='flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2'>
              <Mail className='w-6 h-6 text-primary' />
            </div>
            <CardTitle className='flex items-center gap-2'>
              Contact Us <span className='text-xl'>✉️</span>
            </CardTitle>
            <CardDescription>
              Send us a message and we&apos;ll get back to you as soon as
              possible.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className='h-full transition-all hover:shadow-lg hover:border-primary/50 bg-gradient-to-br from-background to-background/80'>
          <CardHeader className='space-y-1'>
            <div className='flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2'>
              <Shield className='w-6 h-6 text-primary' />
            </div>
            <CardTitle className='flex items-center gap-2'>
              Privacy <span className='text-xl'>🔒</span>
            </CardTitle>
            <CardDescription>
              Learn about how we protect your data and privacy.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant='ghost' className='w-full'>
              <a href='/privacy-policy'>View Privacy Policy</a>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full mb-16'
      >
        <TabsList className='grid grid-cols-2 w-full max-w-md mx-auto mb-8'>
          <TabsTrigger value='faq' className='flex items-center gap-2'>
            <MessageSquareText className='w-4 h-4' />
            <span>FAQs</span> <span className='hidden sm:inline'>📚</span>
          </TabsTrigger>
          <TabsTrigger value='contact' className='flex items-center gap-2'>
            <Mail className='w-4 h-4' />
            <span>Contact</span> <span className='hidden sm:inline'>📨</span>
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab Content */}
        <TabsContent value='faq' className='space-y-4 animate-in fade-in-50'>
          <Card className='border-t-4 border-t-primary'>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2'>
                <MessageSquareText className='w-5 h-5' />
                Frequently Asked Questions
                <span className='text-xl'>🧐</span>
              </CardTitle>
              <CardDescription>
                Find answers to the most common questions about Emoji Map.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type='single' collapsible className='w-full'>
                {FAQS.map((faq, index) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className={
                      index < FAQS.length - 1
                        ? 'border-b border-border/50'
                        : 'border-b-0'
                    }
                  >
                    <AccordionTrigger className='py-4 px-0 hover:no-underline hover:text-primary'>
                      <span className='text-left hover:underline'>
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className='text-muted-foreground'>
                      <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab Content */}
        <TabsContent value='contact' className='animate-in fade-in-50'>
          <Card className='border-t-4 border-t-primary'>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2'>
                <Mail className='w-5 h-5' />
                Contact Us
                <span className='text-xl'>📝</span>
              </CardTitle>
              <CardDescription>
                Need help or want to report a bug? Fill out the form below and
                we&apos;ll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-6'
                >
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormField
                      control={form.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1'>
                            Name <span className='text-sm'>👤</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder='Your name' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='email'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1'>
                            Email <span className='text-sm'>📧</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='your.email@example.com'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='subject'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-1'>
                          Subject <span className='text-sm'>📌</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="What's this about?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='message'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-1'>
                          Message <span className='text-sm'>💬</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='Tell us about your issue or question...'
                            className='min-h-[150px] resize-none'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Please provide as much detail as possible.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2'>
                    <Button
                      type='submit'
                      className='w-full sm:w-auto group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105'
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                          >
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                            ></circle>
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            ></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className='mr-2 h-4 w-4 group-hover:animate-bounce' />
                          Send Support Request
                        </>
                      )}
                    </Button>

                    <Button
                      type='button'
                      variant='outline'
                      className='w-full sm:w-auto'
                      onClick={() => form.reset()}
                    >
                      Clear Form
                    </Button>
                  </div>

                  <p className='text-sm text-muted-foreground mt-4 flex items-center gap-1'>
                    <span>
                      We&apos;ll receive your support request and get back to
                      you as soon as possible.
                    </span>
                    <span className='text-lg'>📤</span>
                  </p>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional support resources */}
      <div className='mb-12'>
        <div className='text-center mb-4'>
          <h2 className='text-2xl font-semibold inline-flex items-center gap-2'>
            Additional Resources
            <span className='text-2xl'>🔗</span>
          </h2>
        </div>
        <Separator className='my-6' />

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto'>
          <Link
            href={WEB_GITHUB_REPO}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:shadow-md transition-all hover:-translate-y-1'
          >
            <div className='mr-4 flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10'>
              <GitHubLogoIcon className='w-6 h-6 text-primary' />
            </div>
            <div>
              <h3 className='text-lg font-medium flex items-center'>
                Web App Repository
                <span className='ml-2 text-lg'>💻</span>
              </h3>
              <p className='text-sm text-muted-foreground'>
                Check out our GitHub repository for the web application.
              </p>
            </div>
          </Link>

          <Link
            href={IOS_GITHUB_REPO}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:shadow-md transition-all hover:-translate-y-1'
          >
            <div className='mr-4 flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10'>
              <GitHubLogoIcon className='w-6 h-6 text-primary' />
            </div>
            <div>
              <h3 className='text-lg font-medium flex items-center'>
                iOS App Repository
                <span className='ml-2 text-lg'>📱</span>
              </h3>
              <p className='text-sm text-muted-foreground'>
                Check out our GitHub repository for the iOS application.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
