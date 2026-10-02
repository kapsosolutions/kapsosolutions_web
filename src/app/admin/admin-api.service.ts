import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE, ADMIN_TOKEN_KEY } from './admin.config';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  imageUrl: string;
  order: number;
  active: boolean;
}

export interface FlowSetting {
  key: string;
  label: string;
  type: 'image' | 'text';
  value: string;
}

export interface DemoLead {
  _id: string;
  phone: string;
  name: string;
  businessName: string;
  businessAddress: string;
  category: string;
  altMobile: string;
  email: string;
  source: string;
  status: 'New' | 'Contacted' | 'Completed';
  createdAt: string;
}

export interface Chat {
  phone: string;
  name: string;
  lastMessageBody: string;
  lastInboundAt: string;
  unread: number;
  windowOpen: boolean;
  windowMsLeft: number;
  botPaused?: boolean;
}

export interface OutboundButton {
  text: string;
  kind: string; // reply | flow | list | cta | call | location | pay
}

export interface OutboundDescriptor {
  type: string;
  body: string;
  headerImageUrl?: string;
  headerText?: string;
  footer?: string;
  buttons?: OutboundButton[];
  cta?: { text: string; url: string } | null;
  flowCta?: string;
  mediaUrl?: string;
  mediaType?: string;
  filename?: string;
}

export interface MediaInfo {
  url: string;
  type: string; // image | video | audio | document
  mime?: string;
  filename?: string;
  caption?: string;
}

export interface ChatMessage {
  _id: string;
  phone: string;
  direction: 'in' | 'out';
  type: string;
  body: string;
  status: string;
  metaMessageId?: string;
  createdAt: string;
  reaction?: string;
  raw?: { outbound?: OutboundDescriptor; media?: MediaInfo };
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  token = signal<string | null>(this.readToken());

  private readToken(): string | null {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setToken(token: string | null): void {
    this.token.set(token);
    try {
      if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
      else localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token() ?? ''}` });
  }

  // ---------- Auth ----------
  login(username: string, password: string): Observable<{ success: boolean; token: string }> {
    return this.http.post<{ success: boolean; token: string }>(`${API_BASE}/api/admin/login`, { username, password });
  }

  // ---------- Stats ----------
  stats(): Observable<{ success: boolean; stats: { totalDemos: number; newDemos: number; totalCategories: number } }> {
    return this.http.get<{ success: boolean; stats: { totalDemos: number; newDemos: number; totalCategories: number } }>(
      `${API_BASE}/api/admin/stats`,
      { headers: this.authHeaders() }
    );
  }

  // ---------- Categories ----------
  getCategories(): Observable<{ success: boolean; data: Category[] }> {
    return this.http.get<{ success: boolean; data: Category[] }>(`${API_BASE}/api/admin/categories`, { headers: this.authHeaders() });
  }

  createCategory(form: FormData): Observable<{ success: boolean; data: Category }> {
    return this.http.post<{ success: boolean; data: Category }>(`${API_BASE}/api/admin/categories`, form, { headers: this.authHeaders() });
  }

  updateCategory(id: string, form: FormData): Observable<{ success: boolean; data: Category }> {
    return this.http.put<{ success: boolean; data: Category }>(`${API_BASE}/api/admin/categories/${id}`, form, { headers: this.authHeaders() });
  }

  deleteCategory(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API_BASE}/api/admin/categories/${id}`, { headers: this.authHeaders() });
  }

  // ---------- Flow settings ----------
  getSettings(): Observable<{ success: boolean; data: FlowSetting[] }> {
    return this.http.get<{ success: boolean; data: FlowSetting[] }>(`${API_BASE}/api/admin/settings`, { headers: this.authHeaders() });
  }

  updateSetting(key: string, form: FormData): Observable<{ success: boolean; data: FlowSetting }> {
    return this.http.put<{ success: boolean; data: FlowSetting }>(`${API_BASE}/api/admin/settings/${key}`, form, { headers: this.authHeaders() });
  }

  // ---------- Demo leads ----------
  getDemos(): Observable<{ success: boolean; data: DemoLead[] }> {
    return this.http.get<{ success: boolean; data: DemoLead[] }>(`${API_BASE}/api/admin/demos`, { headers: this.authHeaders() });
  }

  getDemo(id: string): Observable<{ success: boolean; data: DemoLead }> {
    return this.http.get<{ success: boolean; data: DemoLead }>(`${API_BASE}/api/admin/demos/${id}`, { headers: this.authHeaders() });
  }

  setDemoStatus(id: string, status: string): Observable<{ success: boolean; data: DemoLead }> {
    return this.http.patch<{ success: boolean; data: DemoLead }>(
      `${API_BASE}/api/admin/demos/${id}/status`,
      { status },
      { headers: this.authHeaders() }
    );
  }

  deleteDemo(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API_BASE}/api/admin/demos/${id}`, { headers: this.authHeaders() });
  }

  // ---------- CRM ----------
  getChats(): Observable<{ success: boolean; data: Chat[] }> {
    return this.http.get<{ success: boolean; data: Chat[] }>(`${API_BASE}/api/crm/chats`, { headers: this.authHeaders() });
  }

  getMessages(phone: string): Observable<{ success: boolean; data: ChatMessage[] }> {
    return this.http.get<{ success: boolean; data: ChatMessage[] }>(`${API_BASE}/api/crm/messages/${phone}`, { headers: this.authHeaders() });
  }

  deleteChat(phone: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API_BASE}/api/crm/chats/${phone}`, { headers: this.authHeaders() });
  }

  markRead(phone: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${API_BASE}/api/crm/read`, { phone }, { headers: this.authHeaders() });
  }

  setPause(phone: string, paused: boolean): Observable<{ success: boolean; botPaused: boolean }> {
    return this.http.post<{ success: boolean; botPaused: boolean }>(
      `${API_BASE}/api/crm/pause`,
      { phone, paused },
      { headers: this.authHeaders() }
    );
  }

  sendMessage(phone: string, text: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${API_BASE}/api/crm/send`, { phone, text }, { headers: this.authHeaders() });
  }

  reactToMessage(phone: string, messageId: string, emoji: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${API_BASE}/api/crm/react`,
      { phone, messageId, emoji },
      { headers: this.authHeaders() }
    );
  }

  sendMedia(phone: string, file: File, caption?: string): Observable<{ success: boolean }> {
    const fd = new FormData();
    fd.append('phone', phone);
    fd.append('file', file);
    if (caption) fd.append('caption', caption);
    return this.http.post<{ success: boolean }>(`${API_BASE}/api/crm/send-media`, fd, { headers: this.authHeaders() });
  }

  sendTemplateMessage(phone: string, templateName: string, languageCode: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${API_BASE}/api/crm/send-template`,
      { phone, templateName, languageCode },
      { headers: this.authHeaders() }
    );
  }

  getTemplates(): Observable<{ success: boolean; data: unknown[] }> {
    return this.http.get<{ success: boolean; data: unknown[] }>(`${API_BASE}/api/crm/templates`, { headers: this.authHeaders() });
  }

  createTemplate(form: FormData): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${API_BASE}/api/crm/templates`, form, { headers: this.authHeaders() });
  }

  deleteTemplate(name: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API_BASE}/api/crm/templates/${name}`, { headers: this.authHeaders() });
  }
}
