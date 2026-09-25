export interface AnnouncementAuthor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  expiresAt: string | null;
  createdBy: AnnouncementAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementFormValue {
  title: string;
  content: string;
  publishedAt?: string;
  expiresAt?: string | null;
}
