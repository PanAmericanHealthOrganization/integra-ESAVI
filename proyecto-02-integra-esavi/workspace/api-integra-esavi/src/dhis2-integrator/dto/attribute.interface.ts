export interface AttributeResponse {
  attributes: Attribute[];
}

export interface Attribute {
  code?: string;
  displayName: string;
  attribute: string;
  value: string;
}
