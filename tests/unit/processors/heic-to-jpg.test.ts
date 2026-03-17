import { describe, it, expect, vi } from 'vitest';

// Mock heic2any since it requires browser APIs
vi.mock('heic2any', () => ({
  default: vi.fn(),
}));

import { heicToJpg } from '../../../src/processors/image/heic-to-jpg';
import heic2any from 'heic2any';

const mockedHeic2any = vi.mocked(heic2any);

describe('heicToJpg processor', () => {
  it('should convert a blob and return a single Blob', async () => {
    const inputBlob = new Blob(['fake-heic-data'], { type: 'image/heic' });
    const outputBlob = new Blob(['fake-jpg-data'], { type: 'image/jpeg' });

    mockedHeic2any.mockResolvedValue(outputBlob);

    const result = await heicToJpg(inputBlob, { quality: 0.92 });

    expect(result).toBeInstanceOf(Blob);
    expect(mockedHeic2any).toHaveBeenCalledWith({
      blob: inputBlob,
      toType: 'image/jpeg',
      quality: 0.92,
    });
  });

  it('should return the first blob when heic2any returns an array', async () => {
    const inputBlob = new Blob(['fake-heic-data'], { type: 'image/heic' });
    const outputBlob1 = new Blob(['jpg-1'], { type: 'image/jpeg' });
    const outputBlob2 = new Blob(['jpg-2'], { type: 'image/jpeg' });

    mockedHeic2any.mockResolvedValue([outputBlob1, outputBlob2] as any);

    const result = await heicToJpg(inputBlob);

    expect(result).toBe(outputBlob1);
  });

  it('should use default quality of 0.92 when no options provided', async () => {
    const inputBlob = new Blob(['fake-heic-data'], { type: 'image/heic' });
    mockedHeic2any.mockResolvedValue(new Blob());

    await heicToJpg(inputBlob);

    expect(mockedHeic2any).toHaveBeenCalledWith({
      blob: inputBlob,
      toType: 'image/jpeg',
      quality: 0.92,
    });
  });

  it('should propagate errors from heic2any', async () => {
    const inputBlob = new Blob(['bad-data']);
    mockedHeic2any.mockRejectedValue(new Error('Invalid HEIC file'));

    await expect(heicToJpg(inputBlob)).rejects.toThrow('Invalid HEIC file');
  });
});
