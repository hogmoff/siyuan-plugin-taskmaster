
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  Settings, 
  Wifi, 
  WifiOff,
  CheckCircle2,
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from '@/lib/i18n';

interface HeaderProps {
  isOffline: boolean;
  lastSync: string | null;
  syncInProgress: boolean;
  onSync: () => void;
  onSettings: () => void;
  onRetrySync?: () => void;
  // Mobile: open sidebar from header icon
  onOpenSidebar?: () => void;
  taskStats?: {
    total: number;
    completed: number;
    completionRate: number;
  };
}

const Header = ({ 
  isOffline, 
  lastSync, 
  syncInProgress, 
  onSync, 
  onSettings,
  onRetrySync,
  onOpenSidebar,
  taskStats 
}: HeaderProps) => {
  const { t } = useI18n();
  const formatLastSync = (timestamp: string | null): string => {
    if (!timestamp) return t('common.never');
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return t('common.justNow');
    if (minutes < 60) return t('common.minutesAgo', { m: minutes });
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('common.hoursAgo', { h: hours });
    
    return date.toLocaleDateString();
  };

  const getSyncStatusIcon = () => {
    if (syncInProgress) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (isOffline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  const getSyncStatusText = () => {
    if (syncInProgress) return t('common.syncing');
    if (isOffline) return t('common.offline');
    return t('common.online');
  };

  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label={t('header.openSidebar')}
            title={t('header.openSidebar')}
            className="flex items-center justify-center h-8 w-8 rounded-lg md:cursor-default md:pointer-events-none"
          >
            <img src="/icon.svg" alt={t('app.title')} className="h-6 w-6 rounded" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{t('app.title')}</h1>
            {taskStats && (
              <p className="text-xs text-muted-foreground">
                {t('header.taskStats', { completed: taskStats.completed, total: taskStats.total, rate: taskStats.completionRate })}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Sync Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getSyncStatusIcon()}
            <span className="hidden sm:inline">{getSyncStatusText()}</span>
          </div>

          {/* Sync Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSync}
            disabled={syncInProgress}
            className={cn(
              "h-8 px-2",
              syncInProgress && "pointer-events-none"
            )}
            title={t('header.syncWithSiyuan')}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              syncInProgress && "animate-spin"
            )} />
          </Button>

          {/* Settings Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-3 py-2 text-sm">
                <div className="font-medium">{t('header.syncStatus')}</div>
                <div className="flex items-center gap-2 mt-1">
                  {getSyncStatusIcon()}
                  <span className="text-muted-foreground">{getSyncStatusText()}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('header.lastSync', { time: formatLastSync(lastSync) })}
                </div>
              </div>
              <DropdownMenuSeparator />
              {/* Theme selection */}
              <div className="px-3 py-2">
                <div className="text-sm font-medium mb-2">{t('header.appearance')}</div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() => setTheme('light')}
                  >
                    {t('common.light')}
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() => setTheme('dark')}
                  >
                    {t('common.dark')}
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() => setTheme('system')}
                  >
                    {t('common.system')}
                  </Button>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSettings}>
                <Settings className="h-4 w-4 mr-2" />
                {t('header.connectionSettings')}
              </DropdownMenuItem>
              {onRetrySync && !isOffline && (
                <DropdownMenuItem onClick={onRetrySync} disabled={syncInProgress}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('header.retryLocalTasksSync')}
                </DropdownMenuItem>
              )}
              {isOffline && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-xs text-amber-600 bg-amber-50 rounded-sm mx-1">
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{t('header.offlineNotice')}</span>
                    </div>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
