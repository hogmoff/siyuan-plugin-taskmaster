
'use client';

import { useState, useEffect } from 'react';
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
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    if (isOpen) {
      const settings = LocalStorageManager.loadSettings();
      setBaseUrl(settings.baseUrl || 'http://127.0.0.1:6806');
      setToken(settings.token || '123');
      setTestResult(null);
      setHasChanges(false);
    }
  }, [isOpen]);

  // Track changes
  useEffect(() => {
    const settings = LocalStorageManager.loadSettings();
    const currentBaseUrl = settings.baseUrl || 'http://127.0.0.1:6806';
    const currentToken = settings.token || '123';
    
    setHasChanges(baseUrl !== currentBaseUrl || token !== currentToken);
  }, [baseUrl, token]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connection Settings</DialogTitle>
          <DialogDescription>
            Configure your SiYuan Notes connection. The app will sync tasks with your SiYuan Notes instance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* SiYuan Notes URL */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl">SiYuan Notes URL</Label>
            <Input
              id="baseUrl"
              placeholder="http://localhost:6806"
              value={baseUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
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
            <p className="text-xs text-gray-500">
              Your SiYuan Notes API token. You can find this in Settings → About → API Token
            </p>
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
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
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
