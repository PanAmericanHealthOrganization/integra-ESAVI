export class EntityNotFoundException extends Error {
  constructor(entity: string, uuid?: string) {
    const message = uuid
      ? `${entity} ${uuid} not found`
      : `${entity} not found`;
    super(message);
    this.name = 'EntityNotFoundException';
  }
}
