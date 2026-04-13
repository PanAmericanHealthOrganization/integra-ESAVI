export interface DataElementResponse {
  dataElements: DataElement[];
}

export interface DataElement {
  id: string;
  code: string;
  name: string;
  shortName: string;
  displayFormName: string;
}
