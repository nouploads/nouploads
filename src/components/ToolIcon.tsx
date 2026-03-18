import { icons } from 'lucide-react';

interface ToolIconProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  size?: 'sm' | 'md';
}

export function ToolIcon({ icon, iconColor, iconBg, size = 'md' }: ToolIconProps) {
  const LucideIcon = icons[icon as keyof typeof icons];
  if (!LucideIcon) return null;

  const sizeClasses = size === 'sm'
    ? 'h-8 w-8 rounded-md'
    : 'h-11 w-11 rounded-xl';

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className={`${sizeClasses} ${iconBg} flex items-center justify-center shrink-0`}>
      <LucideIcon className={`${iconSize} ${iconColor}`} />
    </div>
  );
}
