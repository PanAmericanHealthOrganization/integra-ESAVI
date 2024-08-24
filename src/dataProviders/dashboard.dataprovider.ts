import {
	CreateResult,
	DataProvider,
	DeleteManyResult,
	DeleteResult,
	GetListResult,
	GetManyReferenceResult,
	GetManyResult,
	GetOneResult,
	RaRecord,
	UpdateManyResult,
	UpdateResult
} from 'react-admin';
import { INT_ESAV_API, INT_API_KEY } from './fetch.integra.esavi.client';

/**
 *
 */
export const dashboardDataProvider: DataProvider = {
	casosEsaviPorSexoGrave: async () => {
		const response = await fetch(`${INT_ESAV_API}/integrator/reports/casosEsaviPorSexoGrave`, {
			headers: {
				'X-API-KEY': INT_API_KEY || ''
			}
		});
		const data = await response.json();
		return data;
	},

	casosEsaviPorSexoNoGrave: async () => {
		const response = await fetch(`${INT_ESAV_API}/integrator/reports/casosEsaviPorSexoNoGrave`, {
			headers: {
				'X-API-KEY': INT_API_KEY || ''
			}
		});
		const data = await response.json();
		return data;
	},

	casosEsaviPorMes: async () => {
		const response = await fetch(`${INT_ESAV_API}/integrator/reports/casosEsaviPorMes`, {
			headers: {
				'X-API-KEY': INT_API_KEY || ''
			}
		});
		const data = await response.json();
		return data;
	},
	getList: async (): Promise<GetListResult<any>> => {
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

	getOne: function <RecordType extends RaRecord = any>(): Promise<GetOneResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	getMany: function <RecordType extends RaRecord = any>(): Promise<GetManyResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	getManyReference: function <RecordType extends RaRecord = any>(): Promise<GetManyReferenceResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	update: function <RecordType extends RaRecord = any>(): Promise<UpdateResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	updateMany: function <RecordType extends RaRecord = any>(): Promise<UpdateManyResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	create: function <RecordType extends RaRecord = any>(): Promise<CreateResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	delete: function <RecordType extends RaRecord = any>(): Promise<DeleteResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	deleteMany: function <RecordType extends RaRecord = any>(): Promise<DeleteManyResult<RecordType>> {
		throw new Error('Function not implemented.');
	}
};
