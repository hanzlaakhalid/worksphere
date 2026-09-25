export type DocumentCategory = 'POLICY' | 'CONTRACT' | 'CERTIFICATE' | 'ID_PROOF' | 'OTHER';

export interface DocumentPerson {
  id: string;
  firstName: string;
  lastName: string;
}

export interface WorkDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  fileUrl: string;
  employee: DocumentPerson | null;
  uploadedBy: DocumentPerson;
  createdAt: string;
}

export interface DocumentListQuery {
  page: number;
  pageSize: number;
  category?: DocumentCategory;
  employeeId?: string;
}

export interface DocumentFormValue {
  title: string;
  category: DocumentCategory;
  fileUrl: string;
  employeeId?: string | null;
}
