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
import { INT_ESAV_API, INT_API_KEY } from './fetch.integra.esavi.client';

export const esaviDataProvider: DataProvider = {
	getList: async function <RecordType extends RaRecord<Identifier> = any>(
		resource: string,
		params: GetListParams
	): Promise<GetListResult<RecordType>> {
		const { filter, pagination } = params;
		const { page, perPage } = pagination;
		const myHeaders = new Headers();
		myHeaders.append('X-API-KEY', INT_API_KEY || '');
		const requestOptions: RequestInit = {
			method: 'GET',
			headers: myHeaders,
			redirect: 'follow'
		};

		return new Promise((resolve, reject) => {
			fetch(`${INT_ESAV_API}/integrator/notificacion/findAll`, requestOptions)
				.then((res) => res.json())
				.then((data) => {
					console.log('data:::', data);
					if (filter.origen)
						data = data.filter((esavi: any) =>
							`${esavi.tipo}`.toUpperCase().includes(`${filter.origen}`.toUpperCase())
						);
					if (filter.identificacion)
						data = data.filter((esavi: any) =>
							`${esavi.paciente.identificacion}`
								.toUpperCase()
								.includes(`${filter.identificacion}`.toUpperCase())
						);

					// Aplicar paginación después del filtrado
					const dataLength = data.length;
					const start = (page - 1) * perPage;
					const end = start + perPage;
					const paginatedData = data.slice(start, end);

					resolve({
						data: paginatedData as any,
						total: dataLength,
					});
				})
				.catch((err) => {
					reject(err);
				});
		});
	},
	getOne: function <RecordType extends RaRecord<Identifier> = any>(
		resource: string,
		params: GetOneParams<RecordType>
	): Promise<GetOneResult<RecordType>> {
		const myHeaders = new Headers();
		myHeaders.append('X-API-KEY', INT_API_KEY || '');
		const requestOptions: RequestInit = {
			method: 'GET',
			headers: myHeaders,
			redirect: 'follow'
		};
		return new Promise((resolve, reject) => {
			fetch(`${INT_ESAV_API}/integrator/notificacion/`, requestOptions)
				.then((res) => res.json())
				.then((data) => {
					resolve({
						data: data as any
					});
				})
				.catch((err) => {
					reject(err);
				});
		});
	},
	getMany: function <RecordType extends RaRecord<Identifier> = any>(
		resource: string,
		params: GetManyParams
	): Promise<GetManyResult<RecordType>> {
		const myHeaders = new Headers();
		myHeaders.append('X-API-KEY', INT_API_KEY || '');
		const requestOptions: RequestInit = {
			method: 'GET',
			headers: myHeaders,
			redirect: 'follow'
		};
		return new Promise((resolve, reject) => {
			fetch(`${INT_ESAV_API}/integrator/notificacion/findAll`, requestOptions)
				.then((res) => res.json())
				.then((data) => {
					resolve({
						data: data as any
					});
				})
				.catch((err) => {
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
