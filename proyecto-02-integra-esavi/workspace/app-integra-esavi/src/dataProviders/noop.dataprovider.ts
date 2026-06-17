import { DataProvider } from "react-admin"

const notImplemented = () => Promise.reject(new Error("Not implemented for this resource"))

export const noopDataProvider: DataProvider = {
  getList: notImplemented as any,
  getOne: notImplemented as any,
  getMany: notImplemented as any,
  getManyReference: notImplemented as any,
  create: notImplemented as any,
  update: notImplemented as any,
  updateMany: notImplemented as any,
  delete: notImplemented as any,
  deleteMany: notImplemented as any,
}
