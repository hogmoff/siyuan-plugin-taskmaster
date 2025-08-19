
import { SiyuanResponse, SiyuanBlock } from '../types';

class SiyuanClient {
  private baseUrl: string;
  private token: string;
  private isOnline: boolean = true;

  constructor() {
    // Initialize with default values
    this.baseUrl = 'http://127.0.0.1:6806';
    this.token = '123';
    
    // Try to load saved settings in browser environment
    this.initializeCredentials();
  }

  private initializeCredentials(): void {
    // Check if we're in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('siyuan_todoist_settings');
        if (stored) {
          const settings = JSON.parse(stored);
          if (settings.baseUrl) this.baseUrl = settings.baseUrl;
          if (settings.token) this.token = settings.token;
        }
      } catch (error) {
        console.warn('Failed to load connection settings from localStorage:', error);
      }
    }
  }

  private async request<T = any>(
    endpoint: string, 
    data?: any, 
    options: RequestInit = {}
  ): Promise<SiyuanResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.token}`,
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(result.msg || 'Siyuan API error');
      }

      this.isOnline = true;
      return result;
    } catch (error) {
      console.error('Siyuan API request failed:', error);
      this.isOnline = false;
      
      // Provide more helpful error messages
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && this.baseUrl.startsWith('http:')) {
          throw new Error('Mixed content error: HTTPS pages cannot connect to HTTP endpoints. Please use HTTPS for your SiYuan Notes URL.');
        }
        throw new Error('Unable to connect to SiYuan Notes. Please check your URL and network connection.');
      }
      
      throw error;
    }
  }

  async getTasks(): Promise<SiyuanBlock[]> {
    const sqlQuery = {
      stmt: `SELECT * FROM blocks WHERE type = 'i' AND subtype = 't' AND markdown LIKE '%- [%] %' ORDER BY updated DESC LIMIT 10000`
    };

    try {
      const response = await this.request<SiyuanBlock[]>('/api/query/sql', sqlQuery);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw error;
    }
  }

  async updateTaskBlock(blockId: string, markdown: string): Promise<void> {
    const updateData = {
      dataType: 'markdown',
      id: blockId,
      data: markdown,
    };

    try {
      await this.request('/api/block/updateBlock', updateData);
    } catch (error) {
      console.error('Failed to update task block:', error);
      throw error;
    }
  }

  async insertTaskBlock(parentId: string, markdown: string): Promise<string> {
    // If no parentId is provided, we'll need to create the task in a default location
    // For Siyuan Notes, we might need to specify a notebook ID or create in daily notes
    const insertData = {
      dataType: 'markdown',
      data: markdown,
      parentID: parentId || '', // If empty, Siyuan will handle default placement
    };

    try {
      const response = await this.request<{id: string}>('/api/block/insertBlock', insertData);
      return response.data?.id || '';
    } catch (error) {
      console.error('Failed to insert task block:', error);
      throw error;
    }
  }

  async deleteTaskBlock(blockId: string): Promise<void> {
    const deleteData = {
      id: blockId,
    };

    try {
      await this.request('/api/block/deleteBlock', deleteData);
    } catch (error) {
      console.error('Failed to delete task block:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/api/system/version');
      this.isOnline = true;
      return true;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  setCredentials(baseUrl: string, token: string): void {
    this.baseUrl = baseUrl;
    this.token = token;
  }
}

export const siyuanClient = new SiyuanClient();
export default SiyuanClient;
