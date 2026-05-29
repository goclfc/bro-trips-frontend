import { useEffect, useState } from 'react';
import { api, type Booking } from '../api';

function fmt(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function Bookings() {
  const [list, setList] = useState<Booking[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<{ bookings: Booking[] }>('/bookings/mine')
      .then((d) => setList(d.bookings))
      .catch((e) => setErr((e as Error).message));
  }, []);

  if (err) return <p className="error">{err}</p>;
  if (list.length === 0) return <p className="muted">No bookings yet.</p>;

  return (
    <div>
      <h2>My bookings</h2>
      {list.map((b) => (
        <div className="card" key={b.id}>
          <h3>
            {b.from_address} → {b.to_address}
          </h3>
          <div className="muted">{fmt(b.depart_at)}</div>
          <div className="row" style={{ marginTop: 8 }}>
            <span className="tag ok">{b.my_seats} seat(s)</span>
            <span className="tag">
              {b.car_make} {b.car_model} · {b.car_plate}
            </span>
            <span className="muted">Driver: {b.driver_name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
