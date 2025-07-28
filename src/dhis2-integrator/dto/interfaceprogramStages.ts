export interface ProgramStagesResponse {
  programStages: ProgramStage[];
}

export interface ProgramStage {
  lastUpdated: string;
  id: string;
  href: string;
  created: string;
  name: string;
  allowGenerateNextVisit: boolean;
  publicAccess: string;
  formType: string;
  generatedByEnrollmentDate: boolean;
  displayFormName: string;
  sortOrder: number;
  hideDueDate: boolean;
  enableUserAssignment: boolean;
  minDaysFromStart: number;
  favorite: boolean;
  preGenerateUID: boolean;
  displayName: string;
  externalAccess: boolean;
  openAfterEnrollment: boolean;
  repeatable: boolean;
  remindCompleted: boolean;
  displayGenerateEventBox: boolean;
  validationStrategy: string;
  autoGenerateEvent: boolean;
  blockEntryForm: boolean;
  program: Program;
  lastUpdatedBy: LastUpdatedBy;
  sharing: Sharing;
  access: Access;
  createdBy: LastUpdatedBy;
  user: LastUpdatedBy;
  programStageDataElements: ProgramStageDataElement[];
  translations: any[];
  userGroupAccesses: UserGroupAccess[];
  attributeValues: any[];
  userAccesses: UserAccess[];
  favorites: any[];
  notificationTemplates: Program[];
  programStageSections: Program[];
  reportDateToUse?: string;
  dataEntryForm?: Program;
  style?: Style;
  displayDescription?: string;
  description?: string;
  featureType?: string;
}

export interface Style {
  color?: string;
  icon: string;
}

export interface UserAccess {
  access: string;
  displayName: string;
  id: string;
  userUid: string;
}

export interface UserGroupAccess {
  access: string;
  userGroupUid: string;
  displayName: string;
  id: string;
}

export interface ProgramStageDataElement {
  lastUpdated: string;
  id: string;
  created: string;
  displayInReports: boolean;
  skipSynchronization: boolean;
  externalAccess: boolean;
  renderOptionsAsRadio: boolean;
  skipAnalytics: boolean;
  allowFutureDate: boolean;
  compulsory: boolean;
  allowProvidedElsewhere: boolean;
  sortOrder: number;
  favorite: boolean;
  access: Access2;
  programStage: Program;
  dataElement: Program;
  sharing: Sharing2;
  favorites: any[];
  translations: any[];
  userGroupAccesses: any[];
  attributeValues: any[];
  userAccesses: any[];
  renderType?: RenderType;
}

export interface RenderType {
  DESKTOP: DESKTOP;
}

export interface DESKTOP {
  type: string;
}

export interface Sharing2 {
  external: boolean;
}

export interface Access2 {
  read: boolean;
  update: boolean;
  externalize: boolean;
  delete: boolean;
  write: boolean;
  manage: boolean;
}

export interface Access {
  read: boolean;
  update: boolean;
  externalize: boolean;
  delete: boolean;
  write: boolean;
  manage: boolean;
  data: Data;
}

export interface Data {
  read: boolean;
  write: boolean;
}

export interface Sharing {
  owner: string;
  external: boolean;
  public: string;
  userGroups: UserGroups;
  users?: Users;
}

export interface Users {
  M5zQapPyTZI: H9Pi4ELnHSk;
}

export interface UserGroups {
  H9Pi4ELnHSk?: H9Pi4ELnHSk;
  e4hkKX6cZJD?: H9Pi4ELnHSk;
  yW9blsOC3Q1?: H9Pi4ELnHSk;
  fZJzshxE2HG?: H9Pi4ELnHSk;
  wd0AHwFuCGG?: H9Pi4ELnHSk;
  CmTQ2FJGdqi?: H9Pi4ELnHSk;
  GOZRxMTMCk2?: H9Pi4ELnHSk;
  Pe9g1YT8oZy?: H9Pi4ELnHSk;
}

export interface H9Pi4ELnHSk {
  access: string;
  displayName: string;
  id: string;
}

export interface LastUpdatedBy {
  code: string;
  displayName: string;
  name: string;
  id: string;
  username: string;
}

export interface Program {
  id: string;
  name?: string;
  value?: string;
}
