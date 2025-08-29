
'use client';
import { useState } from 'react';
import { TaskFilter, TaskSort, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Filter, 
  SortAsc, 
  SortDesc, 
  X,
  Calendar,
  Tag,
  CheckCircle2,
  Circle,
  Clock,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  filter: TaskFilter;
  sort: TaskSort;
  onFilterChange: (filter: TaskFilter) => void;
  onSortChange: (sort: TaskSort) => void;
  onClearFilters: () => void;
  availableTags: string[];
  className?: string;
  // Advanced query mode
  queryString?: string;
  onQueryChange?: (query: string) => void;
}

const FilterPanel = ({ 
  filter, 
  sort, 
  onFilterChange, 
  onSortChange, 
  onClearFilters,
  availableTags,
  className,
  queryString = '',
  onQueryChange,
}: FilterPanelProps) => {
  // Search moved to sidebar; advanced query toggle appears when searching
  const [showAdvanced, setShowAdvanced] = useState(!!queryString);

  // --- Query helper utils ---
  const splitLines = (q: string) => (q || '').replace(/\u200B|\uFEFF/g, '').split('\n');
  const joinLines = (lines: string[]) => lines.filter(l => l.trim().length > 0).join('\n');
  const getDirective = (q: string, key: string) => splitLines(q).find(l => l.trim().toLowerCase().startsWith(`${key.toLowerCase()}:`));
  const setDirective = (q: string, key: string, value?: string) => {
    let lines = splitLines(q);
    const idx = lines.findIndex(l => l.trim().toLowerCase().startsWith(`${key.toLowerCase()}:`));
    if (!value || !value.trim()) {
      if (idx >= 0) lines.splice(idx, 1);
      return joinLines(lines);
    }
    const newLine = `${key}: ${value.trim()}`;
    if (idx >= 0) lines[idx] = newLine; else lines.push(newLine);
    return joinLines(lines);
  };
  const getList = (q: string, key: string): string[] => {
    const line = getDirective(q, key);
    if (!line) return [];
    const raw = line.split(':').slice(1).join(':').trim();
    return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
  };
  const setList = (q: string, key: string, items: string[]) => setDirective(q, key, items.join(','));
  const toggleListItem = (key: string, value: string) => {
    if (!onQueryChange) return;
    const list = getList(queryString, key);
    const exists = list.some(v => v.toLowerCase() === value.toLowerCase());
    const next = exists ? list.filter(v => v.toLowerCase() !== value.toLowerCase()) : [...list, value];
    onQueryChange(setList(queryString, key, next));
  };
  const setDueQuick = (value: 'today' | 'tomorrow' | 'clear') => {
    if (!onQueryChange) return;
    if (value === 'clear') onQueryChange(setDirective(queryString, 'due', ''));
    else onQueryChange(setDirective(queryString, 'due', value));
  };
  const setStartsQuick = (value: 'today' | 'tomorrow' | 'clear') => {
    if (!onQueryChange) return;
    if (value === 'clear') onQueryChange(setDirective(queryString, 'starts', ''));
    else onQueryChange(setDirective(queryString, 'starts', value));
  };
  const setDueDate = (date: string) => onQueryChange && onQueryChange(setDirective(queryString, 'due', date));
  const setStartsDate = (date: string) => onQueryChange && onQueryChange(setDirective(queryString, 'starts', date));
  const setSort = (field: string, direction: 'asc' | 'desc' = 'asc') => onQueryChange && onQueryChange(setDirective(queryString, 'sort', `${field}${direction === 'desc' ? ' desc' : ''}`));
  const setLimit = (limit: number | '') => onQueryChange && onQueryChange(setDirective(queryString, 'limit', typeof limit === 'number' && limit > 0 ? String(limit) : ''));

  // Search handled in sidebar

  const handleStatusToggle = (status: Task['status']) => {
    const currentStatuses = filter.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    onFilterChange({ 
      ...filter, 
      status: newStatuses.length > 0 ? newStatuses : undefined 
    });
  };

  const handlePriorityToggle = (priority: Task['priority']) => {
    const currentPriorities = filter.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];
    
    onFilterChange({ 
      ...filter, 
      priority: newPriorities.length > 0 ? newPriorities : undefined 
    });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filter.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    onFilterChange({ 
      ...filter, 
      tags: newTags.length > 0 ? newTags : undefined 
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filter.status?.length) count++;
    if (filter.priority?.length) count++;
    if (filter.tags?.length) count++;
    if (filter.searchQuery) count++;
    if (filter.dateRange) count++;
    if (filter.hasNoDueDate) count++;
    return count;
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do', icon: Circle, color: 'text-muted-foreground' },
    { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-600' },
    { value: 'done', label: 'Done', icon: CheckCircle2, color: 'text-green-600' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-muted-foreground' },
  ] as const;

  const priorityOptions = [
    { value: 'high', label: 'High', emoji: '⏫', color: 'text-red-600' },
    { value: 'medium', label: 'Medium', emoji: '🔼', color: 'text-yellow-600' },
    { value: 'low', label: 'Low', emoji: '', color: 'text-muted-foreground' },
  ] as const;

  return (
    <div className={cn("space-y-4 p-4 bg-muted border-b", className)}>
      {/* Advanced Query: default hidden when searching; toggle to show */}
      {onQueryChange && (filter.searchQuery?.trim()) ? (
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Advanced query</span>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700"
              aria-expanded={showAdvanced}
              onClick={() => setShowAdvanced((s) => !s)}
            >
              {showAdvanced ? 'Hide advanced query' : 'Show advanced query'}
            </button>
          </div>
          {showAdvanced ? (
            <div className="mt-2 rounded-md border bg-card p-3 max-h-64 sm:max-h-80 overflow-y-auto">
              <Label className="text-xs text-muted-foreground">Query (plugin-compatible)</Label>
              <textarea
                className="mt-1 w-full min-h-[100px] rounded-md border bg-background p-2 font-mono text-sm"
                placeholder={"tasks\nstatus: todo,in_progress\npriority: high\ndue: today\n-tag: sometag\npath: journal/*\nsort: due desc\nlimit: 50"}
                value={queryString}
                onChange={(e) => onQueryChange?.(e.target.value)}
              />

              {/* Query Helper */}
              <div className="mt-3">
                <div className="text-xs font-medium text-foreground mb-2">Query Helper</div>

                {/* Status */}
                <div className="mb-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {['todo','in_progress','done','cancelled'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleListItem('status', s)}
                        className={cn(
                          'text-xs px-2 py-1 rounded border',
                          getList(queryString,'status').includes(s) ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border text-foreground'
                        )}
                      >{s}</button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="mb-2">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {['high','medium','low'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => toggleListItem('priority', p)}
                        className={cn(
                          'text-xs px-2 py-1 rounded border',
                          getList(queryString,'priority').includes(p) ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-muted border text-foreground'
                        )}
                      >{p}</button>
                    ))}
                  </div>
                </div>

                {/* Due */}
                <div className="mb-2">
                  <Label className="text-xs text-muted-foreground">Due</Label>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <button type="button" className="text-xs px-2 py-1 rounded border bg-muted" onClick={() => setDueQuick('today')}>today</button>
                    <button type="button" className="text-xs px-2 py-1 rounded border bg-muted" onClick={() => setDueQuick('tomorrow')}>tomorrow</button>
                    <input type="date" className="text-xs px-2 py-1 rounded border" onChange={(e)=> setDueDate(e.target.value)} />
                    <button type="button" className="text-xs px-2 py-1 rounded border" onClick={() => setDueQuick('clear')}>clear</button>
                  </div>
                </div>

                {/* Starts */}
                <div className="mb-2">
                  <Label className="text-xs text-muted-foreground">Starts</Label>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <button type="button" className="text-xs px-2 py-1 rounded border bg-muted" onClick={() => setStartsQuick('today')}>today</button>
                    <button type="button" className="text-xs px-2 py-1 rounded border bg-muted" onClick={() => setStartsQuick('tomorrow')}>tomorrow</button>
                    <input type="date" className="text-xs px-2 py-1 rounded border" onChange={(e)=> setStartsDate(e.target.value)} />
                    <button type="button" className="text-xs px-2 py-1 rounded border" onClick={() => setStartsQuick('clear')}>clear</button>
                  </div>
                </div>

                {/* Tags include */}
                {availableTags.length > 0 && (
                  <div className="mb-2">
                    <Label className="text-xs text-muted-foreground">Tags</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {availableTags.slice(0,12).map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleListItem('tag', tag)}
                          className={cn(
                            'text-xs px-2 py-1 rounded border',
                            getList(queryString,'tag').includes(tag) ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-muted border text-foreground'
                          )}
                        >#{tag}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sort and Limit */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Sort</Label>
                    <select
                      className="text-xs px-2 py-1 rounded border bg-background"
                      onChange={(e) => {
                        const val = e.target.value; // e.g., 'due:asc'
                        const [f,d] = val.split(':');
                        setSort(f, (d as 'asc'|'desc'));
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Select</option>
                      <option value="due:asc">Due ↑</option>
                      <option value="due:desc">Due ↓</option>
                      <option value="priority:asc">Priority ↑</option>
                      <option value="priority:desc">Priority ↓</option>
                      <option value="content:asc">A-Z</option>
                      <option value="content:desc">Z-A</option>
                      <option value="start:asc">Start ↑</option>
                      <option value="start:desc">Start ↓</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Limit</Label>
                    <input
                      type="number"
                      min={1}
                      className="w-20 text-xs px-2 py-1 rounded border"
                      onChange={(e)=> setLimit(e.target.value ? parseInt(e.target.value,10) : '')}
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={cn(
                "h-8",
                filter.status?.length && "bg-primary/10 border-primary/20"
              )}
            >
              <Circle className="h-3 w-3 mr-1" />
              Status
              {filter.status?.length && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {filter.status.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filter by Status</Label>
              {statusOptions.map(({ value, label, icon: Icon, color }) => (
                <div key={value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`status-${value}`}
                    checked={filter.status?.includes(value as any) || false}
                    onChange={() => handleStatusToggle(value as any)}
                    className="rounded border-input"
                  />
                  <Label htmlFor={`status-${value}`} className="flex items-center gap-2 cursor-pointer">
                    <Icon className={cn("h-4 w-4", color)} />
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Priority Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={cn(
                "h-8",
                filter.priority?.length && "bg-destructive/10 border-destructive/20"
              )}
            >
              <span className="mr-1">⏫</span>
              Priority
              {filter.priority?.length && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {filter.priority.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filter by Priority</Label>
              {priorityOptions.map(({ value, label, emoji, color }) => (
                <div key={value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`priority-${value}`}
                    checked={filter.priority?.includes(value as any) || false}
                    onChange={() => handlePriorityToggle(value as any)}
                    className="rounded border-input"
                  />
                  <Label htmlFor={`priority-${value}`} className="flex items-center gap-2 cursor-pointer">
                    <span className={color}>{emoji || '◯'}</span>
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
              className={cn(
                "h-8",
                filter.tags?.length && "bg-green-500/10 border-green-500/20"
              )}
              >
                <Tag className="h-3 w-3 mr-1" />
                Tags
                {filter.tags?.length && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {filter.tags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 max-h-64 overflow-y-auto" align="start">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filter by Tags</Label>
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`tag-${tag}`}
                      checked={filter.tags?.includes(tag) || false}
                      onChange={() => handleTagToggle(tag)}
                      className="rounded border-input"
                    />
                    <Label htmlFor={`tag-${tag}`} className="cursor-pointer">
                      #{tag}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Sort */}
        <Select 
          value={`${sort.field}-${sort.direction}`} 
          onValueChange={(value) => {
            const [field, direction] = value.split('-') as [TaskSort['field'], TaskSort['direction']];
            onSortChange({ field, direction });
          }}
        >
          <SelectTrigger className="w-36 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due-asc">Due Date ↑</SelectItem>
            <SelectItem value="due-desc">Due Date ↓</SelectItem>
            <SelectItem value="priority-asc">Priority ↑</SelectItem>
            <SelectItem value="priority-desc">Priority ↓</SelectItem>
            <SelectItem value="created-desc">Newest</SelectItem>
            <SelectItem value="created-asc">Oldest</SelectItem>
            <SelectItem value="content-asc">A-Z</SelectItem>
            <SelectItem value="content-desc">Z-A</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {getActiveFilterCount() > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Clear ({getActiveFilterCount()})
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {(filter.status?.length || filter.priority?.length || filter.tags?.length) && (
        <div className="flex flex-wrap gap-1">
          {filter.status?.map((status) => {
            const statusOption = statusOptions.find(s => s.value === status);
            return statusOption && (
              <Badge 
                key={status} 
                variant="secondary" 
                className="text-xs h-6 gap-1"
              >
                <statusOption.icon className={cn("h-3 w-3", statusOption.color)} />
                {statusOption.label}
                <X 
                  className="h-3 w-3 cursor-pointer hover:bg-muted rounded" 
                  onClick={() => handleStatusToggle(status)}
                />
              </Badge>
            );
          })}
          
          {filter.priority?.map((priority) => {
            const priorityOption = priorityOptions.find(p => p.value === priority);
            return priorityOption && (
              <Badge 
                key={priority} 
                variant="secondary" 
                className="text-xs h-6 gap-1"
              >
                <span className={priorityOption.color}>{priorityOption.emoji || '◯'}</span>
                {priorityOption.label}
                <X 
                  className="h-3 w-3 cursor-pointer hover:bg-muted rounded" 
                  onClick={() => handlePriorityToggle(priority)}
                />
              </Badge>
            );
          })}
          
          {filter.tags?.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="text-xs h-6 gap-1"
            >
              <Tag className="h-3 w-3" />
              {tag}
              <X 
                className="h-3 w-3 cursor-pointer hover:bg-muted rounded" 
                onClick={() => handleTagToggle(tag)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
