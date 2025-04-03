import { describe, it, expect } from 'vitest';
import { getReviewId } from './get-review-id';

describe('getReviewId', () => {
  it('should return the review id', () => {
    expect(
      getReviewId(
        'places/ChIJifIePKtZwokRVZ-UdRGkZzs/reviews/ChdDSUhNMG9nS0VJQ0FnTUR3eGREQzV3RRAB'
      )
    ).toBe('ChdDSUhNMG9nS0VJQ0FnTUR3eGREQzV3RRAB');
  });

  it('should handle invalid input', () => {
    expect(getReviewId('')).toBe(undefined);
    expect(getReviewId('places/ChIJifIePKtZwokRVZ-UdRGkZzs')).toBe(undefined);
    expect(getReviewId('places/ChIJifIePKtZwokRVZ-UdRGkZzs/reviews')).toBe(
      undefined
    );
  });
});
