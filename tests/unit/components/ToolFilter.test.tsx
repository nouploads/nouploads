import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToolFilter from '../../../src/components/ToolFilter';
import { tools } from '../../../src/lib/tools';

const issuesUrl = 'https://github.com/nouploads/nouploads/issues';

describe('ToolFilter', () => {
  it('should render all tools when no search query', () => {
    render(<ToolFilter tools={tools} issuesUrl={issuesUrl} />);

    expect(screen.getByText('HEIC to JPG')).toBeInTheDocument();
    expect(screen.getByText('Image Compress')).toBeInTheDocument();
    expect(screen.getByText('Image Convert')).toBeInTheDocument();
    expect(screen.getByText('Image Resize')).toBeInTheDocument();
    expect(screen.getByText('EXIF Viewer')).toBeInTheDocument();
    expect(screen.getByText('Images to PDF')).toBeInTheDocument();
  });

  it('should render a search input with placeholder', () => {
    render(<ToolFilter tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/filter tools/i);
    expect(input).toBeInTheDocument();
  });

  it('should filter tools by exact match', () => {
    render(<ToolFilter tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/filter tools/i);
    fireEvent.change(input, { target: { value: 'heic' } });

    expect(screen.getByText('HEIC to JPG')).toBeInTheDocument();
    expect(screen.queryByText('Image Compress')).not.toBeInTheDocument();
    expect(screen.queryByText('Image Resize')).not.toBeInTheDocument();
  });

  it('should filter tools by description match', () => {
    render(<ToolFilter tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/filter tools/i);
    fireEvent.change(input, { target: { value: 'metadata' } });

    expect(screen.getByText('EXIF Viewer')).toBeInTheDocument();
    expect(screen.queryByText('HEIC to JPG')).not.toBeInTheDocument();
  });

  it('should handle fuzzy search with typos', () => {
    render(<ToolFilter tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/filter tools/i);
    fireEvent.change(input, { target: { value: 'heix' } });

    expect(screen.getByText('HEIC to JPG')).toBeInTheDocument();
  });

  it('should show result count when searching', () => {
    render(<ToolFilter tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/filter tools/i);
    fireEvent.change(input, { target: { value: 'image' } });

    expect(screen.getByText(/of 6/)).toBeInTheDocument();
  });

  it('should show no-results message with issue link for unmatched query', () => {
    render(<ToolFilter tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/filter tools/i);
    fireEvent.change(input, { target: { value: 'xyznonexistent' } });

    expect(screen.getByText(/no tools found/i)).toBeInTheDocument();
    const issueLink = screen.getByRole('link', { name: /open an issue/i });
    expect(issueLink).toHaveAttribute('href', expect.stringContaining(issuesUrl));
    expect(issueLink).toHaveAttribute('href', expect.stringContaining('xyznonexistent'));
  });

  it('should show all tools again when search is cleared', () => {
    render(<ToolFilter tools={tools} issuesUrl={issuesUrl} />);

    const input = screen.getByPlaceholderText(/filter tools/i);
    fireEvent.change(input, { target: { value: 'heic' } });
    expect(screen.queryByText('Image Compress')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('Image Compress')).toBeInTheDocument();
    expect(screen.getByText('HEIC to JPG')).toBeInTheDocument();
  });

  it('should mark coming-soon tools with a "Soon" badge', () => {
    render(<ToolFilter tools={tools} issuesUrl={issuesUrl} />);

    const badges = screen.getAllByText('Soon');
    expect(badges.length).toBe(5); // all except HEIC to JPG
  });

  it('should not link coming-soon tools', () => {
    render(<ToolFilter tools={tools} issuesUrl={issuesUrl} />);

    const heicLink = screen.getByText('HEIC to JPG').closest('a');
    expect(heicLink).toHaveAttribute('href', '/image/heic-to-jpg');

    const compressLink = screen.getByText('Image Compress').closest('a');
    expect(compressLink).not.toHaveAttribute('href');
  });
});
