import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

// Mock the processor
vi.mock('../../../../src/processors/image/heic-to-jpg', () => ({
  heicToJpg: vi.fn(),
  heicToJpgBatch: vi.fn(),
}));

// Mock heic2any to prevent dynamic import issues
vi.mock('heic2any', () => ({
  default: vi.fn(),
}));

import HeicConverter from '../../../../src/components/tools/HeicConverter';
import { heicToJpg, heicToJpgBatch } from '../../../../src/processors/image/heic-to-jpg';

const mockedHeicToJpg = vi.mocked(heicToJpg);
const mockedHeicToJpgBatch = vi.mocked(heicToJpgBatch);

describe('HeicConverter — batch mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept multiple files via the dropzone', () => {
    render(<HeicConverter />);

    // The dropzone should accept multiple files
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.multiple).toBe(true);
  });

  it('should show per-file status during batch conversion', async () => {
    const output1 = new Blob(['jpg-1'], { type: 'image/jpeg' });
    const output2 = new Blob(['jpg-2'], { type: 'image/jpeg' });

    mockedHeicToJpgBatch.mockResolvedValue([output1, output2]);

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['heic-data-1'], 'photo1.heic', { type: 'image/heic' });
    const file2 = new File(['heic-data-2'], 'photo2.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file1, file2] } });

    // Wait for processing to complete
    await vi.waitFor(() => {
      expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
      expect(screen.getByText('photo2.jpg')).toBeInTheDocument();
    });
  });

  it('should show progress as X of N files converted', async () => {
    let resolveConversion: (value: (Blob | Error)[]) => void;
    mockedHeicToJpgBatch.mockImplementation(
      (_blobs, _opts, onProgress) =>
        new Promise((resolve) => {
          resolveConversion = resolve;
          // Simulate first file done
          onProgress?.(0, 2);
        })
    );

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['heic-1'], 'a.heic', { type: 'image/heic' });
    const file2 = new File(['heic-2'], 'b.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file1, file2] } });

    // Should show batch progress
    await vi.waitFor(() => {
      expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
    });

    // Complete
    resolveConversion!([new Blob(['jpg-1']), new Blob(['jpg-2'])]);
  });

  it('should show individual download buttons for each result', async () => {
    const output1 = new Blob(['jpg-1'], { type: 'image/jpeg' });
    const output2 = new Blob(['jpg-2'], { type: 'image/jpeg' });

    mockedHeicToJpgBatch.mockResolvedValue([output1, output2]);

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['heic-data-1'], 'photo1.heic', { type: 'image/heic' });
    const file2 = new File(['heic-data-2'], 'photo2.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file1, file2] } });

    await vi.waitFor(() => {
      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      // Each file gets its own download button
      expect(downloadButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should show error indicator for failed files while showing successful ones', async () => {
    const output1 = new Blob(['jpg-1'], { type: 'image/jpeg' });
    const error = new Error('Invalid HEIC file');

    mockedHeicToJpgBatch.mockResolvedValue([output1, error]);

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['heic-1'], 'good.heic', { type: 'image/heic' });
    const file2 = new File(['bad-data'], 'bad.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file1, file2] } });

    await vi.waitFor(() => {
      // Successful file should have a download button
      expect(screen.getByText('good.jpg')).toBeInTheDocument();
      // Failed file should show error
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  it('should have a "Download all" button for batch results', async () => {
    const output1 = new Blob(['jpg-1'], { type: 'image/jpeg' });
    const output2 = new Blob(['jpg-2'], { type: 'image/jpeg' });

    mockedHeicToJpgBatch.mockResolvedValue([output1, output2]);

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['heic-1'], 'a.heic', { type: 'image/heic' });
    const file2 = new File(['heic-2'], 'b.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file1, file2] } });

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: /download all/i })).toBeInTheDocument();
    });
  });

  it('should still work for single file (backward compatible)', async () => {
    const output = new Blob(['jpg-data'], { type: 'image/jpeg' });
    mockedHeicToJpgBatch.mockResolvedValue([output]);

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['heic-data'], 'single.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file] } });

    await vi.waitFor(() => {
      expect(screen.getByText('single.jpg')).toBeInTheDocument();
      // No "Download all" for single files
      expect(screen.queryByRole('button', { name: /download all/i })).not.toBeInTheDocument();
    });
  });

  it('should reset all files when "Convert more" is clicked', async () => {
    const output = new Blob(['jpg-data'], { type: 'image/jpeg' });
    mockedHeicToJpgBatch.mockResolvedValue([output]);

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['heic-data'], 'photo.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file] } });

    await vi.waitFor(() => {
      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /convert more/i }));

    // Should be back to idle with dropzone visible
    expect(screen.getByText(/drop/i)).toBeInTheDocument();
    expect(screen.queryByText('photo.jpg')).not.toBeInTheDocument();
  });
});
