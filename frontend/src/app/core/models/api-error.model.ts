export interface ApiErrorBody {
  error: {
    message: string;
    fields?: Record<string, string[]>;
  };
}
