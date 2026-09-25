export type NotificationType = 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'REVIEW_SUBMITTED' | 'ANNOUNCEMENT' | 'DOCUMENT_UPLOADED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}
