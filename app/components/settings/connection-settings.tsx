

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
import { useI18n } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const { t, lang, setLang, available } = useI18n();
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
        message: t('settings.testInvalidUrl'),
      });
      return;
    }

    if (!token.trim()) {
      setTestResult({
        success: false,
        message: t('settings.testInvalidToken'),
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
        setTestResult({ success: true, message: t('settings.testSuccess') });
      } else {
        setTestResult({ success: false, message: t('settings.testFail') });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : t('settings.testFail'),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const trimmedBaseUrl = baseUrl.trim().replace(/\/$/, ''); // Remove trailing slash
    const trimmedToken = token.trim();

    if (!trimmedBaseUrl || !trimmedToken) {
      toast.error(t('settings.saveError'));
      return;
    }

    // Save settings
    LocalStorageManager.saveSettings({
      baseUrl: trimmedBaseUrl,
      token: trimmedToken,
      notebookId: notebookId.trim(),
      dailyHPathTemplate: dailyHPathTemplate.trim(),
      anchorText: anchorText.trim(),
      language: lang,
    });

    // Update the client with new credentials
    siyuanClient.setCredentials(trimmedBaseUrl, trimmedToken);

    toast.success(t('settings.saveSuccess'));
    
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
          <DialogTitle>{t('settings.title')}</DialogTitle>
          <DialogDescription>
            {t('settings.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">{t('settings.language')}</Label>
            <Select value={lang} onValueChange={(v: 'en' | 'de') => setLang(v)}>
              <SelectTrigger id="language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {available.map(l => (
                  <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* SiYuan Notes URL */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl">{t('settings.baseUrl')}</Label>
            <Input
              id="baseUrl"
              placeholder="http://localhost:6806"
              value={baseUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full"
              ref={baseUrlRef}
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.baseUrlHelp')}
            </p>
          </div>

          {/* API Token */}
          <div className="space-y-2">
            <Label htmlFor="token">{t('settings.token')}</Label>
            <Input
              id="token"
              type="password"
              placeholder={t('settings.tokenPlaceholder')}
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">{t('settings.tokenHelp')}</p>
          </div>

          {/* Daily Note Insertion */}
          <div className="space-y-3 border-t pt-4 mt-4">
            <div>
              <div className="text-sm font-medium">{t('settings.dailySection')}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('settings.dailySectionHelp')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notebookId">{t('settings.notebookId')}</Label>
              <Input
                id="notebookId"
                placeholder={t('settings.notebookIdPlaceholder')}
                value={notebookId}
                onChange={(e) => handleNotebookChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{t('settings.notebookIdHelp')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyHPathTemplate">{t('settings.dailyHPath')}</Label>
              <Input
                id="dailyHPathTemplate"
                placeholder={t('settings.dailyHPathPlaceholder')}
                value={dailyHPathTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{t('settings.dailyHPathHelp')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anchorText">{t('settings.anchorText')}</Label>
              <Input
                id="anchorText"
                placeholder={t('settings.anchorTextPlaceholder')}
                value={anchorText}
                onChange={(e) => handleAnchorChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{t('settings.anchorTextHelp')}</p>
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
                  {t('settings.testingConnection')}
                </>
              ) : (
                t('settings.testConnection')
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
              <strong>{t('settings.noteTitle')}</strong> {t('settings.noteText')}
            </p>
            {typeof window !== 'undefined' && window.location.protocol === 'https:' && (
              <p className="text-xs text-amber-600 mt-2">
                <strong>{t('settings.httpsNoticeTitle')}</strong> {t('settings.httpsNoticeText')}
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
            aria-label={t('settings.scrollTop')}
            title={t('settings.scrollTop')}
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || !baseUrl.trim() || !token.trim()}
            className="min-w-[80px]"
          >
            {t('settings.saveSettings')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
