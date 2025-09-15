export interface IPaginationRequest<T> {
  page: number;
  size: number;
  query: T;
}
export interface IPaginationResponse<T> {
  data: T[];
  total: number;
}

export interface SortPayload {
  field: string;
  order: 'ASC' | 'DESC';
}

export interface PaginationPayload {
  page: number;
  perPage: number;
}

export interface GetListParams {
  pagination: PaginationPayload;
  sort: SortPayload;
  filter: any;
  meta?: {
    fields?: string[];
  };
}
