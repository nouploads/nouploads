import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToolSearch from '../../../src/components/ToolSearch';

const tools = [
  { title: 'HEIC to JPG', description: 'Convert iPhone HEIC photos to JPG format', href: '/image/heic-to-jpg', icon: '📸' },
  { title: 'Image Compress', description: 'Reduce image file size with adjustable quality', href: '/image/compress', icon: '🗜️', comingSoon: true },
  { title: 'Image Convert', description: 'Convert between PNG, JPG, WebP, AVIF, and more', href: '/image/convert', icon: '🔄', comingSoon: true },
  { title: 'Image Resize', description: 'Resize images by pixels, percentage, or presets', href: '/image/resize', icon: '📐', comingSoon: true },
  { title: 'EXIF Viewer', description: 'View and strip photo metadata', href: '/image/exif', icon: '🔍', comingSoon: true },
  { title: 'Images to PDF', description: 'Combine multiple images into a single PDF', href: '/image/to-pdf', icon: '📄', comingSoon: true },
];

const issuesUrl = 'https://github.com/nouploads/nouploads/issues';

describe('ToolSearch', () => {
  it('should render all tools when no search query', () => {
    render(<ToolSearch tools={tools} issuesUrl={issuesUrl} />);

    expect(screen.getByText('HEIC to JPG')).toBeInTheDocument();
    expect(screen.getByText('Image Compress')).toBeInTheDocument();
    expect(screen.getByText('Image Convert')).toBeInTheDocument();
    expect(screen.getByText('Image Resize')).toBeInTheDocument();
    expect(screen.getByText('EXIF Viewer')).toBeInTheDocument();
    expect(screen.getByText('Images to PDF')).toBeInTheDocument();
  });

  it('should render a search input with placeholder', () => {
    render(<ToolSearch tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/search tools/i);
    expect(input).toBeInTheDocument();
  });

  it('should filter tools by exact match', () => {
    render(<ToolSearch tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/search tools/i);
    fireEvent.change(input, { target: { value: 'heic' } });

    expect(screen.getByText('HEIC to JPG')).toBeInTheDocument();
    expect(screen.queryByText('Image Compress')).not.toBeInTheDocument();
    expect(screen.queryByText('Image Resize')).not.toBeInTheDocument();
  });

  it('should filter tools by description match', () => {
    render(<ToolSearch tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/search tools/i);
    fireEvent.change(input, { target: { value: 'metadata' } });

    expect(screen.getByText('EXIF Viewer')).toBeInTheDocument();
    expect(screen.queryByText('HEIC to JPG')).not.toBeInTheDocument();
  });

  it('should handle fuzzy search with typos', () => {
    render(<ToolSearch tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/search tools/i);
    fireEvent.change(input, { target: { value: 'heix' } });

    expect(screen.getByText('HEIC to JPG')).toBeInTheDocument();
  });

  it('should show result count when searching', () => {
    render(<ToolSearch tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/search tools/i);
    fireEvent.change(input, { target: { value: 'image' } });

    expect(screen.getByText(/of 6/)).toBeInTheDocument();
  });

  it('should show no-results message with issue link for unmatched query', () => {
    render(<ToolSearch tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/search tools/i);
    fireEvent.change(input, { target: { value: 'xyznonexistent' } });

    expect(screen.getByText(/no tools found/i)).toBeInTheDocument();
    const issueLink = screen.getByRole('link', { name: /open an issue/i });
    expect(issueLink).toHaveAttribute('href', expect.stringContaining(issuesUrl));
    expect(issueLink).toHaveAttribute('href', expect.stringContaining('xyznonexistent'));
  });

  it('should show all tools again when search is cleared', () => {
    render(<ToolSearch tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/search tools/i);
    fireEvent.change(input, { target: { value: 'heic' } });
    expect(screen.queryByText('Image Compress')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('Image Compress')).toBeInTheDocument();
    expect(screen.getByText('HEIC to JPG')).toBeInTheDocument();
  });

  it('should mark coming-soon tools with a "Soon" badge', () => {
    render(<ToolSearch tools={tools} issuesUrl={issuesUrl} />);

    const badges = screen.getAllByText('Soon');
    expect(badges.length).toBe(5); // all except HEIC to JPG
  });

  it('should not link coming-soon tools', () => {
    render(<ToolSearch tools={tools} issuesUrl={issuesUrl} />);

    const heicLink = screen.getByText('HEIC to JPG').closest('a');
    expect(heicLink).toHaveAttribute('href', '/image/heic-to-jpg');

    const compressLink = screen.getByText('Image Compress').closest('a');
    expect(compressLink).not.toHaveAttribute('href');
  });
});
