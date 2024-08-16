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
export const dashboardDataProvider: DataProvider = {
	casosEsaviPorSexoGrave: async () => {
		const URL_ESAVI_GRAVE: string = String(process.env.REACT_APP_ESAVI_GRAVE);
		const response = await fetch(URL_ESAVI_GRAVE, {
			headers: {
				'X-API-KEY': '6PxFc1GiLz8i2EWuJkj9qrJOrqjTNW4h'
			}
		});
		const data = await response.json();
		return data;
	},

	casosEsaviPorSexoNoGrave: async () => {
		const URL_ESAVI_NO_GRAVE: string = String(process.env.REACT_APP_ESAVI_NO_GRAVE);
		const response = await fetch(URL_ESAVI_NO_GRAVE, {
			headers: {
				'X-API-KEY': '6PxFc1GiLz8i2EWuJkj9qrJOrqjTNW4h'
			}
		});
		const data = await response.json();
		return data;
	},

	casosEsaviPorMes: async () => {
		const URL_ESAVI_POR_MES: string = String(process.env.REACT_APP_ESAVI_POR_MES);
		const response = await fetch(URL_ESAVI_POR_MES, {
			headers: {
				'X-API-KEY': '6PxFc1GiLz8i2EWuJkj9qrJOrqjTNW4h'
			}
		});
		const data = await response.json();
		return data;
	},
	getList: async (resource: string, params: GetListParams): Promise<GetListResult<any>> => {
		const respuesta = {
			data: [],
			total: 0,
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
