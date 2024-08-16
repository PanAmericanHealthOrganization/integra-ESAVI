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
	RaRecord,
	UpdateManyParams,
	UpdateManyResult,
	UpdateParams,
	UpdateResult
} from 'react-admin';
import { FETCH_REQUEST_DEFAULT_OPTIONS, INT_ESAV_API } from './fetch.integra.esavi.client';

export const patientProvider: DataProvider = {
	getList: async function <RecordType extends RaRecord<Identifier> = any>(
		resource: string,
		params: GetListParams
	): Promise<GetListResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	getOne: function <RecordType extends RaRecord<Identifier> = any>(
		resource: string,
		params: GetOneParams<RecordType>
	): Promise<GetOneResult<RecordType>> {
		return new Promise((resolve, reject) => {
			console.log('params', params);
			fetch(`${INT_ESAV_API}/integrator/paciente/vigiflow/`, {
				...FETCH_REQUEST_DEFAULT_OPTIONS,
				method: 'GET'
			})
				.then((res) => res.json())
				.then((data) => {
					resolve({
						data: data as any
					});
				})
				.catch((err) => {
					console.log(err);
					reject(err);
				});
		});
	},
	getMany: function <RecordType extends RaRecord<Identifier> = any>(
		resource: string,
		params: GetManyParams
	): Promise<GetManyResult<RecordType>> {
		return new Promise((resolve, reject) => {
			console.log('params', params);
			fetch(`${INT_ESAV_API}/integrator/paciente/vigiflow/`, {
				...FETCH_REQUEST_DEFAULT_OPTIONS,
				method: 'GET'
			})
				.then((res) => res.json())
				.then((data) => {
					resolve({
						data: data as any
					});
				})
				.catch((err) => {
					console.log(err);
					reject(err);
				});
		});
	},
	getManyReference: function <RecordType extends RaRecord<Identifier> = any>(
		resource: string,
		params: GetManyReferenceParams
	): Promise<GetManyReferenceResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	update: function <RecordType extends RaRecord<Identifier> = any>(
		resource: string,
		params: UpdateParams<any>
	): Promise<UpdateResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	updateMany: function <RecordType extends RaRecord<Identifier> = any>(
		resource: string,
		params: UpdateManyParams<any>
	): Promise<UpdateManyResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	create: function <
		RecordType extends Omit<RaRecord<Identifier>, 'id'> = any,
		ResultRecordType extends RaRecord<Identifier> = RecordType & { id: Identifier }
	>(resource: string, params: CreateParams<any>): Promise<CreateResult<ResultRecordType>> {
		throw new Error('Function not implemented.');
	},
	delete: function <RecordType extends RaRecord<Identifier> = any>(
		resource: string,
		params: DeleteParams<RecordType>
	): Promise<DeleteResult<RecordType>> {
		throw new Error('Function not implemented.');
	},
	deleteMany: function <RecordType extends RaRecord<Identifier> = any>(
		resource: string,
		params: DeleteManyParams<RecordType>
	): Promise<DeleteManyResult<RecordType>> {
		throw new Error('Function not implemented.');
	}
};
