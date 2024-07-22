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
	RaRecord,
	UpdateManyParams,
	UpdateManyResult,
	UpdateParams,
	UpdateResult
} from 'react-admin';

/**
 *
 */
export const clienteDataProvider: DataProvider = {
	getList: async (resource: string, params: GetListParams): Promise<GetListResult<any>> => {
		const URL_ESAVI_PACIENTE: string = String(process.env.REACT_API_ESAVI_PACIENTE);
		const response = await fetch(URL_ESAVI_PACIENTE);
		const data = await response.json();

		console.log('data:: ', data);

		data.data.forEach((dt: any, i: number) => {
			dt.id = dt.casoesaviId + i;
		});

		const respuesta = {
			data: data.data,
			total: data.count,
			pageInfo: {
				hasNextPage: false,
				hasPreviousPage: true
			}
		};

		return respuesta;
	},

	getOne: function <RecordType extends RaRecord = any>(
		resource: string,
		params: GetOneParams<any>
	): Promise<GetOneResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	getMany: function <RecordType extends RaRecord = any>(
		resource: string,
		params: GetManyParams
	): Promise<GetManyResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	getManyReference: function <RecordType extends RaRecord = any>(
		resource: string,
		params: GetManyReferenceParams
	): Promise<GetManyReferenceResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	update: function <RecordType extends RaRecord = any>(
		resource: string,
		params: UpdateParams<any>
	): Promise<UpdateResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	updateMany: function <RecordType extends RaRecord = any>(
		resource: string,
		params: UpdateManyParams<any>
	): Promise<UpdateManyResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	create: function <RecordType extends RaRecord = any>(
		resource: string,
		params: CreateParams<any>
	): Promise<CreateResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	delete: function <RecordType extends RaRecord = any>(
		resource: string,
		params: DeleteParams<RecordType>
	): Promise<DeleteResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	deleteMany: function <RecordType extends RaRecord = any>(
		resource: string,
		params: DeleteManyParams<RecordType>
	): Promise<DeleteManyResult<RecordType>> {
		throw new Error('Function not implemented.');
	}
};
