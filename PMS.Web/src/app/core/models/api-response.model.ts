export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}

export interface DocumentResult {
  id: string;
  number: string;
  status: string;
}

export interface PaginationFilter {
  pageNumber?: number;
  pageSize?: number;
}
