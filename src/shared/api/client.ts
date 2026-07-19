import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default api;

export async function fetchAll<T>(resource: string): Promise<T[]> {
  const { data } = await api.get<T[]>(`/${resource}`);
  return data;
}

export async function fetchOne<T>(resource: string, id: string): Promise<T> {
  const { data } = await api.get<T>(`/${resource}/${id}`);
  return data;
}

export async function fetchByField<T>(resource: string, field: string, value: string): Promise<T[]> {
  const { data } = await api.get<T[]>(`/${resource}?${field}=${value}`);
  return data;
}

export async function create<T>(resource: string, body: Partial<T>): Promise<T> {
  const { data } = await api.post<T>(`/${resource}`, body);
  return data;
}

export async function update<T>(resource: string, id: string, body: Partial<T>): Promise<T> {
  const { data } = await api.patch<T>(`/${resource}/${id}`, body);
  return data;
}

export async function remove(resource: string, id: string): Promise<void> {
  await api.delete(`/${resource}/${id}`);
}
