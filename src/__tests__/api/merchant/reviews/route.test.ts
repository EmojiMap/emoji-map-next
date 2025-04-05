import { NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '@/app/api/merchant/reviews/route';
import { prisma } from '@/lib/db';
import type { Mock } from 'vitest';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    review: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('PATCH /api/merchant/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully updates multiple review statuses', async () => {
    const mockUpdates = [
      { reviewId: '1', status: 'FEATURED' },
      { reviewId: '2', status: 'HIDDEN' },
    ] as const;

    const mockDate = new Date('2025-04-05T05:29:50.395Z');
    const mockUpdatedReviews = mockUpdates.map(({ reviewId, status }) => ({
      id: reviewId,
      status,
      updatedAt: mockDate,
    }));

    // Mock the transaction to return updated reviews
    (prisma.$transaction as Mock).mockResolvedValue(mockUpdatedReviews);

    const request = new Request('http://localhost:3000/api/merchant/reviews', {
      method: 'PATCH',
      body: JSON.stringify({ updates: mockUpdates }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      updatedReviews: mockUpdatedReviews.map((review) => ({
        ...review,
        updatedAt: review.updatedAt.toISOString(),
      })),
    });

    // Verify prisma transaction was called correctly
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // Verify that transaction was called with an array
    const transactionArg = (prisma.$transaction as Mock).mock.calls[0][0];
    expect(Array.isArray(transactionArg)).toBe(true);
    expect(transactionArg).toHaveLength(mockUpdates.length);
  });

  it('returns 400 for invalid request data', async () => {
    const invalidUpdates = [
      { reviewId: '', status: 'INVALID_STATUS' }, // Invalid data
    ];

    const request = new Request('http://localhost:3000/api/merchant/reviews', {
      method: 'PATCH',
      body: JSON.stringify({ updates: invalidUpdates }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Invalid request data',
      details: expect.any(Array),
    });
  });

  it('returns 400 for empty updates array', async () => {
    const request = new Request('http://localhost:3000/api/merchant/reviews', {
      method: 'PATCH',
      body: JSON.stringify({ updates: [] }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Invalid request data',
      details: expect.arrayContaining([
        expect.objectContaining({
          message: 'At least one review update is required',
        }),
      ]),
    });
  });

  it('returns 500 for database errors', async () => {
    const mockUpdates = [{ reviewId: '1', status: 'FEATURED' as const }];

    // Mock database error
    const mockError = new Error('Database connection failed');
    (prisma.$transaction as Mock).mockRejectedValue(mockError);

    const request = new Request('http://localhost:3000/api/merchant/reviews', {
      method: 'PATCH',
      body: JSON.stringify({ updates: mockUpdates }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Failed to update reviews',
      details: 'Database connection failed',
    });
  });
});
