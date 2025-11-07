import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { Observable } from 'rxjs';
import {
  NotificationItem,
  NotificationService,
} from '../services/notification.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
})
export class NotificationCenterComponent {
  @Input() label = 'Notifications';
  @Input() triggerClass = '';
  @Input() badgeClass = '';
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  open = false;
  readonly notifications$: Observable<NotificationItem[]>;
  readonly unreadCount$: Observable<number>;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly host: ElementRef<HTMLElement>
  ) {
    this.notifications$ = this.notificationService.messages$;
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  togglePanel(): void {
    this.open ? this.closePanel() : this.openPanel();
  }

  openPanel(): void {
    if (this.open) {
      return;
    }

    this.open = true;
    this.opened.emit();
  }

  closePanel(): void {
    if (!this.open) {
      return;
    }

    this.open = false;
    this.closed.emit();
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }

  clearAll(): void {
    this.notificationService.clear();
  }

  remove(id: string): void {
    this.notificationService.remove(id);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.open) {
      return;
    }

    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target)) {
      this.closePanel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closePanel();
  }

  trackById(_: number, item: NotificationItem): string {
    return item.id;
  }

}
