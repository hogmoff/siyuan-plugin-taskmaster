'use client';

import React from 'react';
import { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type TagNode = {
  name: string;
  fullPath: string; // e.g. "test1/test2"
  children: Map<string, TagNode>;
};

function ensureNode(root: Map<string, TagNode>, pathParts: string[]): TagNode {
  let currentMap = root;
  let fullPath = '';
  let lastNode: TagNode | null = null;

  pathParts.forEach((part, idx) => {
    fullPath = idx === 0 ? part : `${fullPath}/${part}`;
    if (!currentMap.has(part)) {
      currentMap.set(part, { name: part, fullPath, children: new Map() });
    }
    const node = currentMap.get(part)!;
    lastNode = node;
    currentMap = node.children;
  });

  return lastNode!;
}

function buildTagTree(tags: string[]): Map<string, TagNode> {
  const root = new Map<string, TagNode>();
  for (const tag of tags) {
    if (!tag) continue;
    const parts = tag.split('/').filter(Boolean);
    if (parts.length === 0) continue;
    ensureNode(root, parts);
  }
  return root;
}

function clonePrunedNode(node: TagNode): TagNode {
  return { name: node.name, fullPath: node.fullPath, children: new Map() };
}

function filterTree(root: Map<string, TagNode>, query?: string): Map<string, TagNode> {
  if (!query) return root;
  const q = query.toLowerCase();
  const result = new Map<string, TagNode>();

  const visit = (node: TagNode): TagNode | null => {
    const selfMatch = node.fullPath.toLowerCase().includes(q) || node.name.toLowerCase().includes(q);
    let pruned: TagNode | null = null;

    node.children.forEach(child => {
      const childRes = visit(child);
      if (childRes) {
        if (!pruned) pruned = clonePrunedNode(node);
        pruned.children.set(childRes.name, childRes);
      }
    });

    if (selfMatch) {
      if (!pruned) pruned = clonePrunedNode(node);
    }

    return pruned;
  };

  root.forEach((node, key) => {
    const r = visit(node);
    if (r) result.set(key, r);
  });

  return result;
}

function countTasksForPath(tasks: Task[], path: string): number {
  if (!path) return 0;
  return tasks.filter(t =>
    t.status === 'todo' &&
    t.tags?.some(tag => tag === path || tag.startsWith(path + '/'))
  ).length;
}

interface TagTreeProps {
  tasks: Task[];
  tags: string[];
  selected?: string | null;
  onSelect: (tag: string) => void;
  query?: string;
}

const TagTree: React.FC<TagTreeProps> = ({ tasks, tags, selected, onSelect, query }) => {
  const tree = React.useMemo(() => buildTagTree(tags), [tags]);
  const filtered = React.useMemo(() => filterTree(tree, query), [tree, query]);
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});

  const renderNode = (node: TagNode) => {
    const hasChildren = node.children.size > 0;
    const count = countTasksForPath(tasks, node.fullPath);
    const isSelected = selected === node.fullPath;
    const isForcedOpen = Boolean(query);
    const open = isForcedOpen ? true : !!openMap[node.fullPath];

    const highlight = (text: string, q?: string) => {
      if (!q) return text;
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(${escaped})`, 'ig');
      const parts = text.split(re);
      return parts.map((part, idx) => {
        if (part.toLowerCase() === q.toLowerCase()) {
          return (
            <span key={idx} className="bg-yellow-200/70 dark:bg-yellow-300/40 rounded px-0.5">
              {part}
            </span>
          );
        }
        return <span key={idx}>{part}</span>;
      });
    };

    const qSeg = query && query.includes('/') ? query.split('/').filter(Boolean).pop() : query;
    const content = (
      <div className={cn('w-full flex items-center justify-between')}>
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <TagIcon className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="truncate">{highlight(node.name, qSeg)}</span>
        </div>
        {count > 0 && (
          <Badge 
            variant="secondary" 
            className={cn('h-5 px-2 text-xs', isSelected && 'bg-primary/10 text-primary')}
          >
            {count}
          </Badge>
        )}
      </div>
    );

    if (!hasChildren) {
      return (
        <Button
          key={node.fullPath}
          variant="ghost"
          onClick={() => onSelect(node.fullPath)}
          className={cn(
            'w-full justify-start gap-3 h-8 px-3',
            isSelected && 'bg-primary/10 text-primary border-l-2 border-primary'
          )}
        >
          {content}
        </Button>
      );
    }

    return (
      <Collapsible
        key={node.fullPath}
        open={open}
        onOpenChange={isForcedOpen ? undefined : (next) => setOpenMap(prev => ({ ...prev, [node.fullPath]: next }))}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            onClick={() => onSelect(node.fullPath)}
            className={cn(
              'w-full justify-start gap-3 h-8 px-3',
              isSelected && 'bg-primary/10 text-primary border-l-2 border-primary'
            )}
          >
            {content}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-4 mt-1 space-y-1">
            {Array.from(node.children.values())
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(child => renderNode(child))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-1">
      {Array.from(filtered.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(node => renderNode(node))}
    </div>
  );
};

export default TagTree;
