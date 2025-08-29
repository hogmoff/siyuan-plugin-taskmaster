

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LocalStorageManager } from '@/lib/storage/local-storage';
import { siyuanClient } from '@/lib/api/siyuan-client';
import { CheckCircle2, AlertCircle, Loader2, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectionSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: () => void;
}

export default function ConnectionSettings({
  isOpen,
  onClose,
  onSettingsUpdated,
}: ConnectionSettingsProps) {
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:6806');
  const [token, setToken] = useState('123');
  // Daily insertion settings
  const [notebookId, setNotebookId] = useState('');
  const [dailyHPathTemplate, setDailyHPathTemplate] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const baseUrlRef = useRef<HTMLInputElement | null>(null);

  // Load saved settings on mount
  useEffect(() => {
    if (isOpen) {
      const settings = LocalStorageManager.loadSettings();
      setBaseUrl(settings.baseUrl || 'http://127.0.0.1:6806');
      setToken(settings.token || '123');
      setNotebookId(settings.notebookId || '');
      setDailyHPathTemplate(settings.dailyHPathTemplate || '');
      setAnchorText(settings.anchorText || '');
      setTestResult(null);
      setHasChanges(false);
      // Ensure the scrollable area starts at the top when opening
      const el = scrollRef.current;
      if (el) {
        // Delay until after content renders to avoid autofocus pushing scroll
        requestAnimationFrame(() => {
          el.scrollTo({ top: 0 });
          baseUrlRef.current?.focus?.({ preventScroll: true } as any);
        });
      }
    }
  }, [isOpen]);

  // Track changes
  useEffect(() => {
    const settings = LocalStorageManager.loadSettings();
    const currentBaseUrl = settings.baseUrl || 'http://127.0.0.1:6806';
    const currentToken = settings.token || '123';
    const currentNotebookId = settings.notebookId || '';
    const currentTemplate = settings.dailyHPathTemplate || '';
    const currentAnchorText = settings.anchorText || '';
    
    setHasChanges(
      baseUrl !== currentBaseUrl ||
      token !== currentToken ||
      notebookId !== currentNotebookId ||
      dailyHPathTemplate !== currentTemplate ||
      anchorText !== currentAnchorText
    );
  }, [baseUrl, token, notebookId, dailyHPathTemplate, anchorText]);

  // Scroll handling for scroll-to-top button
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollTop(el.scrollTop > 160);
    };
    el.addEventListener('scroll', onScroll);
    // Initialize state in case already scrolled
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [isOpen]);

  const handleTestConnection = async () => {
    if (!baseUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter a valid SiYuan Notes URL',
      });
      return;
    }

    if (!token.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an API token',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Temporarily update the client with new credentials for testing
      const tempBaseUrl = baseUrl.trim().replace(/\/$/, ''); // Remove trailing slash
      siyuanClient.setCredentials(tempBaseUrl, token.trim());
      
      const success = await siyuanClient.testConnection();
      
      if (success) {
        setTestResult({
          success: true,
          message: 'Connection successful! SiYuan Notes is accessible.',
        });
      } else {
        setTestResult({
          success: false,
          message: 'Connection failed. Please check your URL and token.',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const trimmedBaseUrl = baseUrl.trim().replace(/\/$/, ''); // Remove trailing slash
    const trimmedToken = token.trim();

    if (!trimmedBaseUrl || !trimmedToken) {
      toast.error('Please fill in both URL and token fields');
      return;
    }

    // Save settings
    LocalStorageManager.saveSettings({
      baseUrl: trimmedBaseUrl,
      token: trimmedToken,
      notebookId: notebookId.trim(),
      dailyHPathTemplate: dailyHPathTemplate.trim(),
      anchorText: anchorText.trim(),
    });

    // Update the client with new credentials
    siyuanClient.setCredentials(trimmedBaseUrl, trimmedToken);

    toast.success('Connection settings saved successfully');
    
    // Notify parent component
    onSettingsUpdated?.();
    
    onClose();
  };

  const handleCancel = () => {
    // Reset to saved values
    const settings = LocalStorageManager.loadSettings();
    setBaseUrl(settings.baseUrl || 'http://127.0.0.1:6806');
    setToken(settings.token || '123');
    setTestResult(null);
    setHasChanges(false);
    onClose();
  };

  const normalizeUrl = (url: string) => {
    let normalized = url.trim();
    
    // Add protocol if missing
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'http://' + normalized;
    }
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    return normalized;
  };

  const handleUrlChange = (value: string) => {
    setBaseUrl(normalizeUrl(value));
    setTestResult(null); // Clear test result when URL changes
  };

  const handleTokenChange = (value: string) => {
    setToken(value.trim());
    setTestResult(null); // Clear test result when token changes
  };
  const handleNotebookChange = (value: string) => setNotebookId(value);
  const handleTemplateChange = (value: string) => setDailyHPathTemplate(value);
  const handleAnchorChange = (value: string) => setAnchorText(value);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-[500px] max-h-[80vh] flex flex-col"
        style={{ top: '3rem', transform: 'translateX(-50%)' }}
      >
        <DialogHeader>
          <DialogTitle>Connection Settings</DialogTitle>
          <DialogDescription>
            Configure your SiYuan Notes connection. The app will sync tasks with your SiYuan Notes instance.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
          {/* SiYuan Notes URL */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl">SiYuan Notes URL</Label>
            <Input
              id="baseUrl"
              placeholder="http://localhost:6806"
              value={baseUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full"
              ref={baseUrlRef}
            />
            <p className="text-xs text-muted-foreground">
              The URL where your SiYuan Notes instance is running (e.g., http://localhost:6806)
            </p>
          </div>

          {/* API Token */}
          <div className="space-y-2">
            <Label htmlFor="token">API Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="Enter your API token"
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Your SiYuan Notes API token. You can find this in Settings → About → API Token
            </p>
          </div>

          {/* Daily Note Insertion */}
          <div className="space-y-3 border-t pt-4 mt-4">
            <div>
              <div className="text-sm font-medium">Daily Note Insertion</div>
              <p className="text-xs text-muted-foreground mt-1">
                Configure where new tasks are inserted in your daily note.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notebookId">Notebook (box) ID</Label>
              <Input
                id="notebookId"
                placeholder="e.g. 20240101123456-abcdef"
                value={notebookId}
                onChange={(e) => handleNotebookChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                The SiYuan notebook (box) ID that contains your daily notes.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyHPathTemplate">Daily hPath (Sprig template)</Label>
              <Input
                id="dailyHPathTemplate"
                placeholder='e.g. /Journal/{{ now | date "2006-01-02" }}'
                value={dailyHPathTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Rendered via /api/template/renderSprig to locate today’s document. Quotes are escaped automatically.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anchorText">Anchor text</Label>
              <Input
                id="anchorText"
                placeholder="e.g. ## Tasks"
                value={anchorText}
                onChange={(e) => handleAnchorChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                The exact text to search for in the document. New tasks insert after this block.
              </p>
            </div>
          </div>

          {/* Test Connection */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !baseUrl.trim() || !token.trim()}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            {testResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  testResult.success
                    ? 'bg-green-500/10 text-green-700 border border-green-500/20'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Connection Info */}
          <div className="rounded-lg p-3 border bg-muted">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Make sure your SiYuan Notes instance is running and accessible. 
              The API token can be found in your SiYuan Notes settings under About → API Token.
            </p>
            {typeof window !== 'undefined' && window.location.protocol === 'https:' && (
              <p className="text-xs text-amber-600 mt-2">
                <strong>HTTPS Notice:</strong> If accessing from HTTPS, your SiYuan Notes URL must also use HTTPS 
                to avoid mixed content security restrictions.
              </p>
            )}
          </div>
        </div>
        {/* Scroll-to-top button */}
        {showScrollTop && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="absolute bottom-20 right-4 h-10 w-10 rounded-full shadow-md"
            aria-label="Scroll to top"
            title="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || !baseUrl.trim() || !token.trim()}
            className="min-w-[80px]"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
