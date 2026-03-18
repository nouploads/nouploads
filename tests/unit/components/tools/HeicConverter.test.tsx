import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock the processor
vi.mock('../../../../src/processors/image/heic-to-jpg', () => ({
  heicToJpg: vi.fn(),
  heicToJpgBatch: vi.fn(),
}));

// Mock heic2any to prevent dynamic import issues
vi.mock('heic2any', () => ({
  default: vi.fn(),
}));

// Mock URL.createObjectURL / revokeObjectURL for image previews
const objectUrls = new Map<Blob, string>();
let urlCounter = 0;
globalThis.URL.createObjectURL = vi.fn((blob: Blob) => {
  const url = `blob:preview-${urlCounter++}`;
  objectUrls.set(blob, url);
  return url;
});
globalThis.URL.revokeObjectURL = vi.fn();

import HeicConverter from '../../../../src/components/tools/HeicConverter';
import { heicToJpg, heicToJpgBatch } from '../../../../src/processors/image/heic-to-jpg';

const mockedHeicToJpg = vi.mocked(heicToJpg);
const mockedHeicToJpgBatch = vi.mocked(heicToJpgBatch);

// ─── Single-file: live preview UX ─────────────────────────────

describe('HeicConverter — single file live preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    urlCounter = 0;
  });

  it('should show original image preview immediately after dropping a file', async () => {
    mockedHeicToJpg.mockResolvedValue(new Blob(['jpg'], { type: 'image/jpeg' }));

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['heic-data'], 'photo.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file] } });

    // Should show the original panel with label
    await vi.waitFor(() => {
      expect(screen.getByText('Original')).toBeInTheDocument();
      // Should have an img element for the original preview
      const images = document.querySelectorAll('img');
      const originalImg = Array.from(images).find(img => img.alt === 'Original');
      expect(originalImg).toBeTruthy();
    });
  });

  it('should show spinner with "Converting HEIC to JPG..." while processing', async () => {
    let resolveConversion: (value: Blob) => void;
    mockedHeicToJpg.mockImplementation(
      () => new Promise((resolve) => { resolveConversion = resolve; })
    );

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['heic-data'], 'photo.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file] } });

    // Result panel should show spinner text
    await vi.waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument();
      expect(screen.getByText(/converting heic to jpg/i)).toBeInTheDocument();
      // Should have a spinner (Loader2Icon with role="status")
      expect(document.querySelector('[role="status"]')).toBeInTheDocument();
    });

    // Resolve to clean up
    await act(async () => {
      resolveConversion!(new Blob(['jpg'], { type: 'image/jpeg' }));
    });
  });

  it('should show result image preview after conversion completes', async () => {
    const outputBlob = new Blob(['jpg-data'], { type: 'image/jpeg' });
    mockedHeicToJpg.mockResolvedValue(outputBlob);

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['heic-data'], 'photo.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file] } });

    await vi.waitFor(() => {
      // Should have both Original and Result images visible
      const images = document.querySelectorAll('img');
      const resultImg = Array.from(images).find(img => img.alt === 'Result');
      expect(resultImg).toBeTruthy();
    });
  });

  it('should show download button and file info after conversion', async () => {
    const outputBlob = new Blob(['jpg-data'], { type: 'image/jpeg' });
    mockedHeicToJpg.mockResolvedValue(outputBlob);

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['heic-data'], 'photo.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file] } });

    await vi.waitFor(() => {
      expect(screen.getByText(/photo\.jpg/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });
  });

  it('should re-convert when quality slider changes', async () => {
    const preview = new Blob(['jpg-preview'], { type: 'image/jpeg' });
    const output1 = new Blob(['jpg-high'], { type: 'image/jpeg' });
    const output2 = new Blob(['jpg-low'], { type: 'image/jpeg' });
    // Call 1: original preview (quality 1.0), Call 2: result at initial quality, Call 3: result at new quality
    mockedHeicToJpg
      .mockResolvedValueOnce(preview)
      .mockResolvedValueOnce(output1)
      .mockResolvedValueOnce(output2);

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['heic-data'], 'photo.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file] } });

    // Wait for initial conversions (preview + result)
    await vi.waitFor(() => {
      expect(mockedHeicToJpg).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });

    // Change the quality slider — Radix renders a thumb with role="slider"
    const thumb = screen.getByRole('slider');
    // Step down triggers onValueChange
    fireEvent.keyDown(thumb, { key: 'ArrowLeft' });

    // Should trigger a third conversion with new quality
    await vi.waitFor(() => {
      expect(mockedHeicToJpg).toHaveBeenCalledTimes(3);
    });
  });

  it('should show spinner on result side while re-converting after quality change', async () => {
    let resolveFirst: (value: Blob) => void;
    let resolveSecond: (value: Blob) => void;
    let callCount = 0;

    mockedHeicToJpg.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return new Promise((resolve) => { resolveFirst = resolve; });
      }
      return new Promise((resolve) => { resolveSecond = resolve; });
    });

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['heic-data'], 'photo.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file] } });

    // Complete first conversion
    await act(async () => {
      resolveFirst!(new Blob(['jpg-1'], { type: 'image/jpeg' }));
    });

    // Change quality — triggers re-conversion
    const thumb = screen.getByRole('slider');
    fireEvent.keyDown(thumb, { key: 'ArrowLeft' });

    // Should show spinner while re-converting
    await vi.waitFor(() => {
      expect(screen.getByText(/converting/i)).toBeInTheDocument();
      expect(document.querySelector('[role="status"]')).toBeInTheDocument();
    });

    // Original image should still be visible during re-conversion
    expect(screen.getByText('Original')).toBeInTheDocument();

    await act(async () => {
      resolveSecond!(new Blob(['jpg-2'], { type: 'image/jpeg' }));
    });
  });

  it('should keep quality slider visible at all times after file is loaded', async () => {
    mockedHeicToJpg.mockResolvedValue(new Blob(['jpg'], { type: 'image/jpeg' }));

    render(<HeicConverter />);

    // Slider visible before file drop
    expect(screen.getByText(/jpg quality/i)).toBeInTheDocument();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['heic-data'], 'photo.heic', { type: 'image/heic' });
    fireEvent.change(input, { target: { files: [file] } });

    // Slider still visible after conversion
    await vi.waitFor(() => {
      expect(screen.getByText(/photo\.jpg/)).toBeInTheDocument();
    });
    expect(screen.getByText(/jpg quality/i)).toBeInTheDocument();
  });

  it('should reset to dropzone when "Convert more" is clicked', async () => {
    mockedHeicToJpg.mockResolvedValue(new Blob(['jpg'], { type: 'image/jpeg' }));

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['heic-data'], 'photo.heic', { type: 'image/heic' });
    fireEvent.change(input, { target: { files: [file] } });

    await vi.waitFor(() => {
      expect(screen.getByText(/photo\.jpg/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /convert more/i }));

    expect(screen.getByText(/drop/i)).toBeInTheDocument();
    expect(screen.queryByText('Original')).not.toBeInTheDocument();
  });
});

// ─── Multi-file batch ──────────────────────────────────────────

describe('HeicConverter — batch mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept multiple files via the dropzone', () => {
    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.multiple).toBe(true);
  });

  it('should show per-file results with filenames', async () => {
    const output1 = new Blob(['jpg-1'], { type: 'image/jpeg' });
    const output2 = new Blob(['jpg-2'], { type: 'image/jpeg' });

    mockedHeicToJpgBatch.mockResolvedValue([output1, output2]);

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['heic-data-1'], 'photo1.heic', { type: 'image/heic' });
    const file2 = new File(['heic-data-2'], 'photo2.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file1, file2] } });

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
          onProgress?.(0, 2);
        })
    );

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['heic-1'], 'a.heic', { type: 'image/heic' });
    const file2 = new File(['heic-2'], 'b.heic', { type: 'image/heic' });

    fireEvent.change(input, { target: { files: [file1, file2] } });

    await vi.waitFor(() => {
      expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
    });

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
      expect(screen.getByText('good.jpg')).toBeInTheDocument();
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

  it('should reset all files when "Convert more" is clicked', async () => {
    const output = new Blob(['jpg-data'], { type: 'image/jpeg' });
    mockedHeicToJpgBatch.mockResolvedValue([output]);

    render(<HeicConverter />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['heic-1'], 'a.heic', { type: 'image/heic' });
    const file2 = new File(['heic-2'], 'b.heic', { type: 'image/heic' });

    // Use 2 files so batch path is triggered
    mockedHeicToJpgBatch.mockResolvedValue([
      new Blob(['jpg-1']),
      new Blob(['jpg-2']),
    ]);

    fireEvent.change(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      { target: { files: [file1, file2] } }
    );

    await vi.waitFor(() => {
      expect(screen.getByText('a.jpg')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /convert more/i }));

    expect(screen.getByText(/drop/i)).toBeInTheDocument();
    expect(screen.queryByText('a.jpg')).not.toBeInTheDocument();
  });
});
