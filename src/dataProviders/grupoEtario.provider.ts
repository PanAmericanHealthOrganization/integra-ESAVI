import {
    CreateParams,
    CreateResult,
    DataProvider,
    DeleteManyParams,
    DeleteManyResult,
    DeleteParams,
    DeleteResult,
    GetListParams,
    GetListResult,
    GetManyParams,
    GetManyReferenceParams,
    GetManyReferenceResult,
    GetManyResult,
    GetOneParams,
    GetOneResult,
    Identifier,
    QueryFunctionContext,
    RaRecord,
    UpdateManyParams,
    UpdateManyResult,
    UpdateParams,
    UpdateResult,
} from "ra-core";

// TODO: Consumir desde servicio, grupo etario
export const GRUPO_ETARIO_OPTIONS = [
  { id: 1, label: "Menores de un año" },
  { id: 2, label: "1 A 4 años" },
  { id: 3, label: "5 A 9 años" },
  { id: 4, label: "10 A 14 años" },
  { id: 5, label: "15 A 19 años" },
  { id: 6, label: "20 A 64 años" },
  { id: 7, label: "65 años o más" },
]
/**
 * 
 */
export const grupoEtarioDataProvider: DataProvider = {
    getList: function <RecordType extends RaRecord=any>(resource: string,params: GetListParams&QueryFunctionContext): Promise<GetListResult<RecordType>> {
        throw new Error("Function not implemented.");
    },
    getOne: function <RecordType extends RaRecord=any>(resource: string,params: GetOneParams<RecordType>&QueryFunctionContext): Promise<GetOneResult<RecordType>> {
        throw new Error("Function not implemented.");
    },
    getMany: function <RecordType extends RaRecord=any>(resource: string,params: GetManyParams<RecordType>&QueryFunctionContext): Promise<GetManyResult<RecordType>> {
        throw new Error("Function not implemented.");
    },
    getManyReference: function <RecordType extends RaRecord=any>(resource: string,params: GetManyReferenceParams&QueryFunctionContext): Promise<GetManyReferenceResult<RecordType>> {
        throw new Error("Function not implemented.");
    },
    update: function <RecordType extends RaRecord=any>(resource: string,params: UpdateParams): Promise<UpdateResult<RecordType>> {
        throw new Error("Function not implemented.");
    },
    updateMany: function <RecordType extends RaRecord=any>(resource: string,params: UpdateManyParams): Promise<UpdateManyResult<RecordType>> {
        throw new Error("Function not implemented.");
    },
    create: function <RecordType extends Omit<RaRecord,"id">=any,ResultRecordType extends RaRecord=RecordType&{id: Identifier;}>(resource: string,params: CreateParams): Promise<CreateResult<ResultRecordType>> {
        throw new Error("Function not implemented.");
    },
    delete: function <RecordType extends RaRecord=any>(resource: string,params: DeleteParams<RecordType>): Promise<DeleteResult<RecordType>> {
        throw new Error("Function not implemented.");
    },
    deleteMany: function <RecordType extends RaRecord=any>(resource: string,params: DeleteManyParams<RecordType>): Promise<DeleteManyResult<RecordType>> {
        throw new Error("Function not implemented.");
    }
}