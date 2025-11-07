import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export type NotificationKind = 'success' | 'info' | 'warning' | 'error';

export interface NotificationOptions {
  delay?: number;
  source?: string;
  autoRead?: boolean;
}

export interface NotificationItem {
  id: string;
  message: string;
  kind: NotificationKind;
  timestamp: string;
  source?: string;
  read: boolean;
  remoteId?: string;
}

interface NotificationQueueItem {
  kind: NotificationKind;
  message: string;
  options?: NotificationOptions;
  id?: string;
  remoteId?: string;
}

interface StoredNotification extends NotificationQueueItem {}

interface IncomingNotificationPayload {
  message: string;
  notificationId?: string;
}

const PERSIST_STORAGE_KEY = 'app:persistent-notifications';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly isBrowser = typeof window !== 'undefined';
  private readonly historyLimit = 50;
  private readonly notificationApiUrl = 'http://localhost:5144/api/notifications';
  private readonly messagesSubject = new BehaviorSubject<NotificationItem[]>([]);
  private readonly queue: NotificationQueueItem[] = [];
  private readonly activeTimers = new Set<number>();
  private socket?: WebSocket;
  private reconnectHandle?: ReturnType<typeof setTimeout>;
  private importFeedActive = false;
  private importFeedFirstMessage = true;

  constructor(private readonly http: HttpClient) {}

  readonly messages$ = this.messagesSubject.asObservable();
  readonly unreadCount$ = this.messages$.pipe(
    map(list => list.reduce((count, item) => (item.read ? count : count + 1), 0))
  );

  ngOnDestroy(): void {
    this.teardownSocket();
    this.clearTimers();
  }

  success(message: string, options?: NotificationOptions): void {
    this.enqueue('success', message, options);
  }

  info(message: string, options?: NotificationOptions): void {
    this.enqueue('info', message, options);
  }

  warning(message: string, options?: NotificationOptions): void {
    this.enqueue('warning', message, options);
  }

  error(message: string, options?: NotificationOptions): void {
    this.enqueue('error', message, options);
  }

  show(message: string, kind: NotificationKind = 'info', options?: NotificationOptions): void {
    this.enqueue(kind, message, options);
  }

  markAsRead(id: string): void {
    const current = this.messagesSubject.value;
    const target = current.find(item => item.id === id);
    if (!target) {
      return;
    }

    if (!target.read && target.remoteId) {
      this.sendReadAck(target.remoteId);
    }

    const next = current.filter(item => item.id !== id);
    this.messagesSubject.next(next);
  }

  markAllRead(): void {
    const current = this.messagesSubject.value;
    const unread = current.filter(item => !item.read);
    if (!unread.length) {
      return;
    }

    const remoteIds = new Set<string>();
    unread.forEach(item => {
      if (item.remoteId) {
        remoteIds.add(item.remoteId);
      }
    });
    remoteIds.forEach(id => this.sendReadAck(id));

    const idsToRemove = new Set(unread.map(item => item.id));
    const next = current.filter(item => !idsToRemove.has(item.id));
    this.messagesSubject.next(next);
  }

  remove(id: string): void {
    const next = this.messagesSubject.value.filter(item => item.id !== id);
    this.messagesSubject.next(next);
  }

  clear(): void {
    this.messagesSubject.next([]);
  }

  queuePersistent(kind: NotificationKind, message: string, options?: NotificationOptions): void {
    if (!this.isBrowser) {
      this.enqueue(kind, message, options);
      return;
    }

    const stored = this.readStoredNotifications();
    stored.push({ kind, message, options });

    try {
      sessionStorage.setItem(PERSIST_STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error('Unable to persist notification', error);
      this.enqueue(kind, message, options);
    }
  }

  flushPersistent(): void {
    if (!this.isBrowser) {
      return;
    }

    const stored = this.readStoredNotifications();
    if (!stored.length) {
      return;
    }

    sessionStorage.removeItem(PERSIST_STORAGE_KEY);
    stored.forEach((entry, index) => {
      const baseDelay = entry.options?.delay ?? 400;
      this.enqueue(entry.kind, entry.message, {
        ...entry.options,
        delay: baseDelay + index * 180,
      });
    });
  }

  activateImportFeed(): void {
    if (this.importFeedActive) {
      return;
    }

    if (!this.isBrowser || this.importFeedActive) {
      return;
    }

    this.importFeedActive = true;
    this.importFeedFirstMessage = true;
    this.connect();
  }

  deactivateImportFeed(): void {
    if (!this.importFeedActive) {
      return;
    }

    if (this.importFeedActive) {
      return;
    }

    if (!this.importFeedActive) {
      return;
    }

    this.importFeedActive = false;
    this.teardownSocket();
  }

  private enqueue(
    kind: NotificationKind,
    message: string,
    options?: NotificationOptions,
    id?: string,
    remoteId?: string
  ): void {
    const delay = Math.max(0, options?.delay ?? 0);
    const queueItem: NotificationQueueItem = {
      kind,
      message,
      options: options ? { ...options } : undefined,
      id,
      remoteId,
    };

    if (delay > 0) {
      if (!this.isBrowser) {
        this.queue.push(queueItem);
        this.processQueue();
        return;
      }

      const handle = window.setTimeout(() => {
        this.activeTimers.delete(handle);
        this.queue.push(queueItem);
        this.processQueue();
      }, delay);

      this.activeTimers.add(handle);
    } else {
      this.queue.push(queueItem);
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (!this.queue.length) {
      return;
    }

    while (this.queue.length) {
      const item = this.queue.shift()!;
      const notificationId = item.remoteId ?? item.id ?? this.createId();
      const notification: NotificationItem = {
        id: notificationId,
        kind: item.kind,
        message: item.message,
        timestamp: new Date().toISOString(),
        source: item.options?.source,
        read: Boolean(item.options?.autoRead),
        remoteId: item.remoteId,
      };

      const next = [...this.messagesSubject.value, notification].slice(-this.historyLimit);
      this.messagesSubject.next(next);
    }
  }

  private connect(): void {
    if (!this.importFeedActive || !this.isBrowser) {
      return;
    }

    if (this.socket) {
      const state = this.socket.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        return;
      }

      this.socket = undefined;
    }

    const url = this.resolveSocketUrl();
    if (!url) {
      return;
    }

    try {
      this.socket = new WebSocket(url);
    } catch (error) {
      console.error('Unable to open notification channel', error);
      this.scheduleReconnect();
      return;
    }

    this.socket.onmessage = event => {
      const incoming = this.extractNotificationPayload(event.data);
      if (incoming) {
        const delay = this.importFeedFirstMessage ? 700 : 150;
        this.enqueue('info', incoming.message, { delay, source: 'import' }, incoming.notificationId, incoming.notificationId);
        this.importFeedFirstMessage = false;
      }
    };

    this.socket.onclose = () => {
      this.socket = undefined;
      if (this.importFeedActive) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = err => {
      console.error('Notification channel error', err);
      this.socket?.close();
    };
  }

  private scheduleReconnect(): void {
    if (!this.importFeedActive || !this.isBrowser) {
      return;
    }

    if (this.reconnectHandle) {
      return;
    }

    this.reconnectHandle = setTimeout(() => {
      this.reconnectHandle = undefined;
      this.connect();
    }, 5000);
  }

  private teardownSocket(): void {
    if (this.reconnectHandle) {
      clearTimeout(this.reconnectHandle);
      this.reconnectHandle = undefined;
    }

    this.socket?.close();
    this.socket = undefined;
  }

  private readStoredNotifications(): StoredNotification[] {
    if (!this.isBrowser) {
      return [];
    }

    const raw = sessionStorage.getItem(PERSIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (entry: StoredNotification) => typeof entry?.kind === 'string' && typeof entry?.message === 'string'
      );
    } catch {
      return [];
    }
  }

  private extractNotificationPayload(payload: string): IncomingNotificationPayload | null {
    if (!payload) {
      return null;
    }

    try {
      const data = JSON.parse(payload);
      if (typeof data === 'string') {
        return { message: data };
      }

      if (typeof data?.status === 'string') {
        return {
          message: data.status,
          notificationId: typeof data?.notificationId === 'string' ? data.notificationId : undefined,
        };
      }

      if (typeof data?.message === 'string') {
        return {
          message: data.message,
          notificationId: typeof data?.notificationId === 'string' ? data.notificationId : undefined,
        };
      }
    } catch {
      // ignore parse failures
    }

    return typeof payload === 'string' ? { message: payload } : null;
  }

  private sendReadAck(remoteId: string): void {
    if (!this.isBrowser || !remoteId) {
      return;
    }

    this.http.post<void>(`${this.notificationApiUrl}/${remoteId}/read`, {}).subscribe({
      error: error => console.error('Failed to update notification read status', error),
    });
  }

  private resolveSocketUrl(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    const protocol = window.location?.protocol ?? 'http:';
    const isSecure = protocol === 'https:';

    return isSecure ? 'wss://localhost:7247/ws/import' : 'ws://localhost:5144/ws/import';
  }

  private clearTimers(): void {
    if (!this.isBrowser) {
      return;
    }

    this.activeTimers.forEach(handle => clearTimeout(handle));
    this.activeTimers.clear();
  }

  private createId(): string {
    if (this.isBrowser) {
      const cryptoRef = window.crypto as Crypto | undefined;
      if (cryptoRef && 'randomUUID' in cryptoRef) {
        return cryptoRef.randomUUID();
      }
    }

    return Math.random().toString(36).slice(2, 11);
  }
}



