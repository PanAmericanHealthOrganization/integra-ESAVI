import { CreateParams, CreateResult, DataProvider, DeleteManyParams, DeleteManyResult, DeleteParams, DeleteResult, GetListParams, GetListResult, GetManyParams, GetManyReferenceParams, GetManyReferenceResult, GetManyResult, GetOneParams, GetOneResult, Identifier, RaRecord, UpdateManyParams, UpdateManyResult, UpdateParams, UpdateResult } from "ra-core"
import { INT_ESAV_API } from "./fetch.integra.esavi.client"
import axios from "axios"

export const vacunometroProvider: DataProvider = {
    getList: function <RecordType extends RaRecord=any>(resource: string,params: GetListParams): Promise<GetListResult<RecordType>> {
        try {
       const response = await axios.get(`${INT_ESAV_API}/integrator/vacunometro/findAllPaginated`, {
            params
        })
        return {
            data: response.data.data,
            total: response.data.total,
            pageInfo: {
                hasNextPage: response.data.hasNextPage,
                hasPreviousPage: response.data.hasPreviousPage,
            },
        }
        } catch (error) {
            throw new Error("Error al obtener la lista de vacunometro")
        }
    },
    getOne: function <RecordType extends RaRecord=any>(resource: string,params: GetOneParams<RecordType>): Promise<GetOneResult<RecordType>> {
        throw new Error("Function not implemented.")
    },
    getMany: function <RecordType extends RaRecord=any>(resource: string,params: GetManyParams): Promise<GetManyResult<RecordType>> {
        throw new Error("Function not implemented.")
    },
    getManyReference: function <RecordType extends RaRecord=any>(resource: string,params: GetManyReferenceParams): Promise<GetManyReferenceResult<RecordType>> {
        throw new Error("Function not implemented.")
    },
    update: function <RecordType extends RaRecord=any>(resource: string,params: UpdateParams): Promise<UpdateResult<RecordType>> {
        throw new Error("Function not implemented.")
    },
    updateMany: function <RecordType extends RaRecord=any>(resource: string,params: UpdateManyParams): Promise<UpdateManyResult<RecordType>> {
        throw new Error("Function not implemented.")
    },
    create: function <RecordType extends Omit<RaRecord,"id">=any,ResultRecordType extends RaRecord=RecordType&{id: Identifier >(resource: string,params: CreateParams): Promise<CreateResult<ResultRecordType>> {
        throw new Error("Function not implemented.")
    },
    delete: function <RecordType extends RaRecord=any>(resource: string,params: DeleteParams<RecordType>): Promise<DeleteResult<RecordType>> {
        throw new Error("Function not implemented.")
    },
    deleteMany: function <RecordType extends RaRecord=any>(resource: string,params: DeleteManyParams<RecordType>): Promise<DeleteManyResult<RecordType>> {
        throw new Error("Function not implemented.")
    }
}
