export interface OptionResponse {
  options: Option[];
}

export interface Option {
  code: string;
  id: string;
  displayName: string;
}
