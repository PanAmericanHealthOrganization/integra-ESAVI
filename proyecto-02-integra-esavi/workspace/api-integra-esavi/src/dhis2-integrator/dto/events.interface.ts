export interface EventPaginResponse {
  pager: Pager;
  events: Event[];
}

export interface Event {
  orgUnit: string;
  program: string;
  event: string;
  status: string;
  orgUnitName: string;
  eventDate: string;
  trackedEntityInstance: string;
  trackedEntityInstanceDetail?: {};
  lastUpdated: string;
  dataValues: DataValue[];
}

export interface DataValue {
  dataElement: string;
  value: string;
}

export interface Pager {
  page: number;
  pageSize: number;
  isLastPage: boolean;
}
