import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../../../src/components/ProgressBar';

describe('ProgressBar', () => {
  it('should show message when provided', () => {
    render(<ProgressBar message="Loading converter..." />);

    expect(screen.getByText('Loading converter...')).toBeInTheDocument();
  });

  it('should show indeterminate animation when no value', () => {
    const { container } = render(<ProgressBar />);

    const animatedBar = container.querySelector('[class*="animate"]');
    expect(animatedBar).toBeInTheDocument();
  });

  it('should show determinate progress with percentage', () => {
    render(<ProgressBar value={50} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should hide percentage when showPercentage is false', () => {
    render(<ProgressBar value={50} showPercentage={false} />);

    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('should set correct width for determinate progress', () => {
    const { container } = render(<ProgressBar value={75} />);

    const bar = container.querySelector('[style*="width: 75%"]');
    expect(bar).toBeInTheDocument();
  });

  it('should round percentage display', () => {
    render(<ProgressBar value={33.7} />);

    expect(screen.getByText('34%')).toBeInTheDocument();
  });
});
