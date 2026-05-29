const TOKEN_KEY = 'brotrips.token';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error as string)) || `request failed (${res.status})`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data as T;
}

export type User = { id: number; email: string; name: string };
export type Car = { id: number; make: string; model: string; plate: string; seats: number };

export type Trip = {
  id: number;
  from_address: string;
  to_address: string;
  depart_at: string;
  seats_total: number;
  seats_booked: number;
  notes: string | null;
  driver_id: number;
  driver_name: string;
  driver_picture: string | null;
  car_make: string;
  car_model: string;
  car_plate: string;
  booked_by_me: boolean;
};

export type Booking = {
  id: number;
  from_address: string;
  to_address: string;
  depart_at: string;
  driver_name: string;
  driver_picture: string | null;
  car_make: string;
  car_model: string;
  car_plate: string;
  my_seats: number;
};

export type Passenger = {
  id: number;
  name: string;
  email: string;
  picture: string | null;
  seats: number;
};
