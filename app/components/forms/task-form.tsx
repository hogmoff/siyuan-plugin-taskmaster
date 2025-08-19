
'use client';

import { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Calendar, Tag, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => void;
  task?: Task | null;
  availableTags: string[];
  loading?: boolean;
}

const TaskForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  task, 
  availableTags,
  loading = false 
}: TaskFormProps) => {
  const [formData, setFormData] = useState({
    content: '',
    status: 'todo' as TaskStatus,
    priority: 'low' as TaskPriority,
    dueDate: '',
    startDate: '',
    scheduledDate: '',
    tags: [] as string[],
    dependencies: [] as string[],
    recurrenceRule: '',
    recurrenceWhenDone: false,
  });

  const [newTag, setNewTag] = useState('');
  const [newDependency, setNewDependency] = useState('');

  // Reset form when task changes or dialog opens/closes
  useEffect(() => {
    if (task) {
      setFormData({
        content: task.content,
        status: task.status,
        priority: task.priority,
        dueDate: task.dates.due || '',
        startDate: task.dates.start || '',
        scheduledDate: task.dates.scheduled || '',
        tags: [...(task.tags || [])],
        dependencies: [...(task.dependencies || [])],
        recurrenceRule: task.recurrence?.rule || '',
        recurrenceWhenDone: !!task.recurrence?.baseOnDoneDate,
      });
    } else {
      setFormData({
        content: '',
        status: 'todo',
        priority: 'low',
        dueDate: '',
        startDate: '',
        scheduledDate: '',
        tags: [],
        dependencies: [],
        recurrenceRule: '',
        recurrenceWhenDone: false,
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      return;
    }

    const taskData: Partial<Task> = {
      content: formData.content.trim(),
      status: formData.status,
      priority: formData.priority,
      dates: {
        due: formData.dueDate || undefined,
        start: formData.startDate || undefined,
        scheduled: formData.scheduledDate || undefined,
      },
      tags: formData.tags.filter(tag => tag.trim().length > 0),
      dependencies: formData.dependencies.filter(dep => dep.trim().length > 0),
      recurrence: formData.recurrenceRule
        ? { rule: formData.recurrenceRule.trim(), baseOnDoneDate: formData.recurrenceWhenDone }
        : undefined,
    };

    onSubmit(taskData);
    onClose();
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddDependency = () => {
    const dep = newDependency.trim();
    if (dep && !formData.dependencies.includes(dep)) {
      setFormData(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, dep]
      }));
    }
    setNewDependency('');
  };

  const handleRemoveDependency = (depToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter(dep => dep !== depToRemove)
    }));
  };

  const handleTagSelect = (selectedTag: string) => {
    if (!formData.tags.includes(selectedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, selectedTag]
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Task Description</Label>
            <Textarea
              id="content"
              placeholder="What needs to be done?"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="min-h-[80px] resize-none"
              required
            />
          </div>

          {/* Status and Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: TaskStatus) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: TaskPriority) => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">⏫ High</SelectItem>
                  <SelectItem value="medium">🔼 Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates
            </Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-xs text-gray-600">
                  📅 Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs text-gray-600">
                  🛫 Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate" className="text-xs text-gray-600">
                  ⏳ Scheduled
                </Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            
            {/* Existing Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:bg-gray-300 rounded" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Add New Tag */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Tag Selection */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Quick select:</Label>
                <div className="flex flex-wrap gap-1">
                  {availableTags.slice(0, 10).map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTagSelect(tag)}
                      disabled={formData.tags.includes(tag)}
                      className={cn(
                        "h-6 px-2 text-xs",
                        formData.tags.includes(tag) && "opacity-50"
                      )}
                    >
                      #{tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recurrence Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">🔁 Recurrence</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2">
                <Input
                  placeholder="e.g., every week, every 2 days"
                  value={formData.recurrenceRule}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurrenceRule: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="whenDone"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={formData.recurrenceWhenDone}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurrenceWhenDone: e.target.checked }))}
                />
                <Label htmlFor="whenDone" className="text-xs text-gray-600">base on completion (when done)</Label>
              </div>
            </div>
          </div>

          {/* Dependencies Section */}
          {formData.dependencies.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                ⛔ Dependencies
              </Label>
              
              <div className="flex flex-wrap gap-1">
                {formData.dependencies.map((dep) => (
                  <Badge key={dep} variant="outline" className="gap-1">
                    ⛔{dep}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:bg-gray-300 rounded" 
                      onClick={() => handleRemoveDependency(dep)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.content.trim()}
            >
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
