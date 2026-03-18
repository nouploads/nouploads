import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { type Tool, createToolSearcher, searchTools } from '@/lib/search';
import { ToolIcon } from './ToolIcon';

interface ToolFilterProps {
  tools: Tool[];
  issuesUrl: string;
}

export default function ToolFilter({ tools, issuesUrl }: ToolFilterProps) {
  const [query, setQuery] = useState('');

  const fuse = useMemo(() => createToolSearcher(tools), [tools]);

  const filtered = useMemo(
    () => searchTools(fuse, query, tools),
    [query, tools, fuse]
  );

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter tools... (e.g. compress, resize, jpg)"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-transparent pl-10 pr-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <>
          <h2 className="text-2xl font-bold mb-6">
            Image Tools
            {query.trim() && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {filtered.length} of {tools.length}
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tool) => (
              <a
                key={tool.href}
                href={tool.comingSoon ? undefined : tool.href}
                className={`group block rounded-lg border bg-card p-5 transition-all ${
                  tool.comingSoon
                    ? 'opacity-60 cursor-default'
                    : 'hover:border-primary/40 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <ToolIcon icon={tool.icon} iconColor={tool.iconColor} iconBg={tool.iconBg} />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {tool.title}
                      {tool.comingSoon && (
                        <span className="text-xs font-normal bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          Soon
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg font-medium mb-2">
            No tools found for &ldquo;{query}&rdquo;
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            We don&rsquo;t have that tool yet, but we&rsquo;d love to build it.
            Please{' '}
            <a
              href={`${issuesUrl}/new?title=${encodeURIComponent(`Tool request: ${query}`)}&labels=tool-request`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              open an issue
            </a>{' '}
            to let us know — community requests help us prioritize what to build next.
          </p>
        </div>
      )}
    </div>
  );
}
