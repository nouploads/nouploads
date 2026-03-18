import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { type Tool, createToolSearcher } from '@/lib/search';
import { ToolIcon } from './ToolIcon';

export default function CommandPalette({ tools }: { tools: Tool[] }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fuse = useMemo(() => createToolSearcher(tools), [tools]);

  // "/" shortcut to open, Escape to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // Small delay to let the portal mount
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const fuseFilter = useCallback(
    (value: string, search: string) => {
      if (!search) return 1;
      const results = fuse.search(search);
      const match = results.find(
        (r) => `${r.item.title} ${r.item.description}` === value
      );
      if (!match) return 0;
      // fuse score: 0 = perfect, 1 = worst. Invert for cmdk (higher = better).
      return 1 - (match.score ?? 0);
    },
    [fuse]
  );

  const handleSelect = useCallback((value: string) => {
    const tool = tools.find(
      (t) => `${t.title} ${t.description}` === value
    );
    if (tool && !tool.comingSoon) {
      setOpen(false);
      if (window.location.pathname !== tool.href) {
        window.location.href = tool.href;
      }
    }
  }, [tools]);

  return (
    <>
      {/* Trigger button styled as a search bar */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-9 w-64 rounded-lg border border-input bg-transparent px-3 text-sm text-muted-foreground transition-colors hover:border-ring/50 hover:bg-muted/50"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Type <kbd className="inline-flex h-5 items-center align-middle rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">/</kbd> to search</span>
      </button>

      {/* Mobile: icon-only trigger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Command palette — portalled to document.body */}
      {open &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-100"
              onClick={() => setOpen(false)}
            />

            {/* Palette */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 pointer-events-none">
              <CommandPrimitive
                filter={fuseFilter}
                className="pointer-events-auto w-full max-w-lg rounded-xl border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95 duration-100"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false);
                  }
                }}
              >
                {/* Input */}
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <CommandPrimitive.Input
                    ref={inputRef}
                    placeholder="Type to search..."
                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                {/* Results */}
                <CommandPrimitive.List className="max-h-72 overflow-y-auto p-2">
                  <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
                    No tools found.
                  </CommandPrimitive.Empty>

                  <CommandPrimitive.Group
                    heading="Tools"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {tools.map((tool) => (
                      <CommandPrimitive.Item
                        key={tool.href}
                        value={`${tool.title} ${tool.description}`}
                        onSelect={handleSelect}
                        disabled={tool.comingSoon}
                        className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm cursor-default select-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none"
                      >
                        <ToolIcon icon={tool.icon} iconColor={tool.iconColor} iconBg={tool.iconBg} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{tool.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {tool.description}
                          </p>
                        </div>
                        {tool.comingSoon && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                </CommandPrimitive.List>
              </CommandPrimitive>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
