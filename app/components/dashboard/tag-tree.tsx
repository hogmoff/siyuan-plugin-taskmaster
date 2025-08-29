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

function countTasksForPath(tasks: Task[], path: string): number {
  if (!path) return 0;
  return tasks.filter(t =>
    t.tags?.some(tag => tag === path || tag.startsWith(path + '/'))
  ).length;
}

interface TagTreeProps {
  tasks: Task[];
  tags: string[];
  selected?: string | null;
  onSelect: (tag: string) => void;
}

const TagTree: React.FC<TagTreeProps> = ({ tasks, tags, selected, onSelect }) => {
  const tree = React.useMemo(() => buildTagTree(tags), [tags]);

  const renderNode = (node: TagNode) => {
    const hasChildren = node.children.size > 0;
    const count = countTasksForPath(tasks, node.fullPath);
    const isSelected = selected === node.fullPath;
    const [open, setOpen] = React.useState<boolean>(false);

    const content = (
      <div className={cn('w-full flex items-center justify-between')}>
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            open ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />
          ) : (
            <TagIcon className="h-4 w-4 text-gray-400" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {count > 0 && (
          <Badge 
            variant="secondary" 
            className={cn('h-5 px-2 text-xs', isSelected && 'bg-blue-100 text-blue-800')}
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
            isSelected && 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
          )}
        >
          {content}
        </Button>
      );
    }

    return (
      <Collapsible key={node.fullPath} open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            onClick={() => onSelect(node.fullPath)}
            className={cn(
              'w-full justify-start gap-3 h-8 px-3',
              isSelected && 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
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
      {Array.from(tree.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(node => renderNode(node))}
    </div>
  );
};

export default TagTree;

