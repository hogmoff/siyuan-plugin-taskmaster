
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

  // Render Sprig template to compute today's hPath
  async renderSprig(text: string): Promise<string> {
    if (!text) return '';
    // Escape double quotes to keep API functional per requirement
    // Replace any " with \" as required
    const safeText = text;
    try {
      // API expects { template } and may return string or object in data
      const res = await this.request<string | { text?: string; content?: string; result?: string }>(
        '/api/template/renderSprig',
        { template: safeText }
      );
      const d: any = (res as any).data;
      const out = typeof d === 'string' ? d : (d?.text || d?.content || d?.result || '').toString();
      return out;
    } catch (err) {
      console.error('Failed to render sprig template:', err);
      return '';
    }
  }

  // Get document/root ID by notebook and hPath
  async getDocumentIdByHPath(notebook: string, hPath: string): Promise<string | null> {
    if (!notebook || !hPath) return null;
    try {
      const res = await this.request<string[] | { ids?: string[] }>(
        '/api/filetree/getIDsByHPath',
        { path: hPath, notebook }
      );
      const ids = Array.isArray(res.data)
        ? res.data
        : ((res.data as any)?.ids || (res as any)?.ids || []);
      if (Array.isArray(ids) && ids.length) return ids[0];
    } catch (_) {}
    // Fallback shapes
    try {
      const res2 = await this.request<string[] | { ids?: string[] }>(
        '/api/filetree/getIDsByHPath',
        { hPaths: [{ box: notebook, hPath }] }
      );
      const ids2 = Array.isArray(res2.data)
        ? res2.data
        : ((res2.data as any)?.ids || (res2 as any)?.ids || []);
      if (Array.isArray(ids2) && ids2.length) return ids2[0];
    } catch (_) {}
    try {
      const res3 = await this.request<string[] | { ids?: string[] }>(
        '/api/filetree/getIDsByHPath',
        { paths: [{ box: notebook, path: hPath }] }
      );
      const ids3 = Array.isArray(res3.data)
        ? res3.data
        : ((res3.data as any)?.ids || (res3 as any)?.ids || []);
      if (Array.isArray(ids3) && ids3.length) return ids3[0];
    } catch (_) {}
    return null;
  }

  async findBlockInDocumentByText(rootId: string, text: string): Promise<SiyuanBlock | null> {
    if (!rootId || !text) return null;
    const like = text.replace(/%/g, '\\%').replace(/_/g, '\\_').replace(/'/g, "''");
    const sql = {
      stmt: `SELECT * FROM blocks WHERE root_id = '${rootId}' AND markdown LIKE '%${like}%' ORDER BY sort ASC LIMIT 1`,
    };
    const res = await this.request('/api/query/sql', sql);
    const rows = res.data || [];
    return rows.length ? rows[0] : null;
  }

  async insertBlockAfter(afterBlockId: string, markdown: string): Promise<string> {
    let data = {
      dataType: 'markdown', 
      data: markdown, 
      previousID: afterBlockId
    };
    let url = "/api/block/insertBlock";
    try {
      const r = await this.request(url, data);
      // Extract id from various response shapes
      let id = (r as any)?.data?.id || (r as any)?.id || '';
      if (!id) {
        const d = (r as any)?.data;
        if (Array.isArray(d) && d.length) {
          const ops = d[0]?.doOperations || [];
          const ins = ops.find((o: any) => o?.action === 'insert');
          id = ins?.blockID || ins?.id || '';
        }
      }
      return id || '';
    } catch (_) {}
    throw new Error('Failed to insert block after anchor');
  }

  // Orchestrate: render hPath → resolve doc → find anchor → insert after
  async insertTaskAfterDailyAnchor(opts: { box: string; hPathTemplate: string; anchorText: string; markdown: string; }): Promise<string> {
    const { box, hPathTemplate, anchorText, markdown } = opts;
    if (!box || !hPathTemplate || !anchorText) {
      // Fallback to default insertion if settings missing
      return await this.insertTaskBlock('', markdown);
    }

    const hPath = await this.renderSprig(hPathTemplate);
    if (!hPath) throw new Error('Failed to render daily hPath via renderSprig');

    const docId = await this.getDocumentIdByHPath(box, hPath);
    if (!docId) throw new Error('Daily note not found via getIDsByHPath');

    const anchor = await this.findBlockInDocumentByText(docId, anchorText);
    if (!anchor?.id) throw new Error('Anchor text not found in document');

    const newId = await this.insertBlockAfter(anchor.id, markdown);
    return newId;
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
    const url = `${this.baseUrl}${endpoint}`;
    try {
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
      this.isOnline = false;
      throw error;
    }
  }

  async getTasks(): Promise<SiyuanBlock[]> {
    const sqlQuery = {
      stmt: `SELECT * FROM blocks WHERE type = 'i' AND subtype = 't' AND markdown LIKE '%- [%] %' ORDER BY updated DESC LIMIT 10000`
    };

    try {
      const response = await this.request('/api/query/sql', sqlQuery);
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
      const response = await this.request('/api/block/insertBlock', insertData);
      // Extract id from possible shapes
      let id = (response as any)?.data?.id || (response as any)?.id || '';
      if (!id) {
        const d = (response as any)?.data;
        if (Array.isArray(d) && d.length) {
          const ops = d[0]?.doOperations || [];
          const ins = ops.find((o: any) => o?.action === 'insert');
          id = ins?.blockID || ins?.id || '';
        }
      }
      return id || '';
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
