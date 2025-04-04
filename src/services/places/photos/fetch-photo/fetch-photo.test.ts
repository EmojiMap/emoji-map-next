import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPhoto } from './fetch-photo';
import { buildPhotoUrl } from '../build-photo-url/build-photo-url';

// Mock dependencies
vi.mock('../build-photo-url/build-photo-url', () => ({
  buildPhotoUrl: vi.fn(),
}));

describe('fetchPhoto', () => {
  // Mock global fetch
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  // Mock URL constructor
  const originalURL = global.URL;

  beforeEach(() => {
    vi.resetAllMocks();
    // Restore original URL constructor
    global.URL = originalURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch a photo URL successfully', async () => {
    // GIVEN a valid photo name
    const photoName = 'places/test-place-id/photos/test-photo-id';
    const mockUrl = 'https://places.googleapis.com/v1/test-url';
    const mockPhotoUrl = 'https://lh3.googleusercontent.com/actual-photo-url';

    // AND buildPhotoUrl returns a valid URL
    vi.mocked(buildPhotoUrl).mockReturnValueOnce(mockUrl);

    // AND fetch returns a successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      url: mockPhotoUrl,
    });

    // WHEN fetching the photo
    const result = await fetchPhoto(photoName);

    // THEN it should return a URL object with the correct href
    expect(result).toBeInstanceOf(URL);
    expect(result.href).toBe(mockPhotoUrl);

    // AND it should call buildPhotoUrl with the correct parameters
    expect(buildPhotoUrl).toHaveBeenCalledWith({ photoName });

    // AND it should call fetch with the URL from buildPhotoUrl
    expect(mockFetch).toHaveBeenCalledWith(
      mockUrl,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      })
    );
  });

  it('should throw an error when photo name is empty', async () => {
    // GIVEN an empty photo name
    const photoName = '';

    // WHEN fetching the photo
    // THEN it should throw an error
    await expect(fetchPhoto(photoName)).rejects.toThrow(
      'Photo name is required'
    );

    // AND buildPhotoUrl should not be called
    expect(buildPhotoUrl).not.toHaveBeenCalled();

    // AND fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should throw an error when buildPhotoUrl throws an error', async () => {
    // GIVEN a valid photo name
    const photoName = 'places/test-place-id/photos/test-photo-id';

    // AND buildPhotoUrl throws an error
    const buildError = new Error('Invalid photo name format');
    vi.mocked(buildPhotoUrl).mockImplementationOnce(() => {
      throw buildError;
    });

    // WHEN fetching the photo
    // THEN it should throw the same error
    await expect(fetchPhoto(photoName)).rejects.toThrow(buildError);

    // AND fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should throw an error when API returns non-OK response', async () => {
    // GIVEN a valid photo name
    const photoName = 'places/test-place-id/photos/test-photo-id';
    const mockUrl = 'https://places.googleapis.com/v1/test-url';

    // AND buildPhotoUrl returns a valid URL
    vi.mocked(buildPhotoUrl).mockReturnValueOnce(mockUrl);

    // AND fetch returns an error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    // WHEN fetching the photo
    // THEN it should throw an error
    await expect(fetchPhoto(photoName)).rejects.toThrow(
      'Failed to fetch photo: 404 Not Found'
    );
  });

  it('should throw an error when fetch fails', async () => {
    // GIVEN a valid photo name
    const photoName = 'places/test-place-id/photos/test-photo-id';
    const mockUrl = 'https://places.googleapis.com/v1/test-url';

    // AND buildPhotoUrl returns a valid URL
    vi.mocked(buildPhotoUrl).mockReturnValueOnce(mockUrl);

    // AND fetch throws an error
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    // WHEN fetching the photo
    // THEN it should throw the same error
    await expect(fetchPhoto(photoName)).rejects.toThrow(networkError);
  });

  it('should throw an error when no photo URL is returned', async () => {
    // GIVEN a valid photo name
    const photoName = 'places/test-place-id/photos/test-photo-id';
    const mockUrl = 'https://places.googleapis.com/v1/test-url';

    // AND buildPhotoUrl returns a valid URL
    vi.mocked(buildPhotoUrl).mockReturnValueOnce(mockUrl);

    // AND fetch returns a successful response but with no URL
    mockFetch.mockResolvedValueOnce({
      ok: true,
      url: '', // Empty URL
    });

    // WHEN fetching the photo
    // THEN it should throw an error
    await expect(fetchPhoto(photoName)).rejects.toThrow(
      'No photo URL returned'
    );
  });

  it('should throw an error when URL constructor fails', async () => {
    // GIVEN a valid photo name
    const photoName = 'places/test-place-id/photos/test-photo-id';
    const mockUrl = 'https://places.googleapis.com/v1/test-url';
    const mockPhotoUrl = 'invalid-url'; // Invalid URL that will cause URL constructor to throw

    // AND buildPhotoUrl returns a valid URL
    vi.mocked(buildPhotoUrl).mockReturnValueOnce(mockUrl);

    // AND fetch returns a successful response with an invalid URL
    mockFetch.mockResolvedValueOnce({
      ok: true,
      url: mockPhotoUrl,
    });

    // AND URL constructor throws an error
    const urlError = new TypeError('Invalid URL');
    global.URL = vi.fn().mockImplementation(() => {
      throw urlError;
    }) as unknown as typeof URL;

    // WHEN fetching the photo
    // THEN it should throw the URL constructor error
    await expect(fetchPhoto(photoName)).rejects.toThrow(urlError);
  });
});
