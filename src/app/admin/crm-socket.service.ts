import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { API_BASE } from './admin.config';
import { ChatMessage } from './admin-api.service';

// Live CRM feed over Socket.IO. Mirrors the backend eventBus events.
@Injectable({ providedIn: 'root' })
export class CrmSocketService {
  private socket: Socket | null = null;

  private connect(): Socket {
    if (!this.socket) {
      this.socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    }
    return this.socket;
  }

  onMessage(): Observable<ChatMessage> {
    return new Observable((sub) => {
      const s = this.connect();
      const handler = (m: ChatMessage) => sub.next(m);
      s.on('crm:message', handler);
      return () => s.off('crm:message', handler);
    });
  }

  onStatus(): Observable<{ metaMessageId: string; status: string }> {
    return new Observable((sub) => {
      const s = this.connect();
      const handler = (m: { metaMessageId: string; status: string }) => sub.next(m);
      s.on('crm:status', handler);
      return () => s.off('crm:status', handler);
    });
  }

  onReaction(): Observable<{ metaMessageId: string; emoji: string }> {
    return new Observable((sub) => {
      const s = this.connect();
      const handler = (m: { metaMessageId: string; emoji: string }) => sub.next(m);
      s.on('crm:reaction', handler);
      return () => s.off('crm:reaction', handler);
    });
  }

  onDemo(): Observable<unknown> {
    return new Observable((sub) => {
      const s = this.connect();
      const handler = (m: unknown) => sub.next(m);
      s.on('crm:demo', handler);
      return () => s.off('crm:demo', handler);
    });
  }
}
