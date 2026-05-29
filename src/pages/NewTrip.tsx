import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Car } from '../api';

export default function NewTrip() {
  const nav = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState<number | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departAt, setDepartAt] = useState('');
  const [seats, setSeats] = useState(3);
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ cars: Car[] }>('/cars').then((d) => {
      setCars(d.cars);
      if (d.cars[0]) {
        setCarId(d.cars[0].id);
        setSeats(Math.min(d.cars[0].seats - 1, 3) || 1);
      }
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (carId === '') throw new Error('Pick a car');
      await api('/trips', {
        method: 'POST',
        body: JSON.stringify({
          car_id: carId,
          from_address: from,
          to_address: to,
          depart_at: new Date(departAt).toISOString(),
          seats_total: seats,
          notes: notes || null,
        }),
      });
      nav('/');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (cars.length === 0) {
    return (
      <div>
        <h2>Offer a ride</h2>
        <p className="muted">
          Add a car first on <a href="/cars">My cars</a>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Offer a ride</h2>
      <form onSubmit={submit} className="card">
        <div className="row">
          <div>
            <label>Car</label>
            <select value={carId} onChange={(e) => setCarId(Number(e.target.value))}>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.make} {c.model} ({c.plate}) — {c.seats} seats
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Free seats to offer</label>
            <input
              type="number"
              min={1}
              max={8}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              required
            />
          </div>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <div>
            <label>From</label>
            <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. 12 Rustaveli ave" required />
          </div>
          <div>
            <label>To</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g. Vake park" required />
          </div>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <div>
            <label>Departure</label>
            <input
              type="datetime-local"
              value={departAt}
              onChange={(e) => setDepartAt(e.target.value)}
              required
            />
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Notes (optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="meeting point, music preferences, etc."
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button disabled={busy}>Publish trip</button>
        </div>
        {err && <div className="error">{err}</div>}
      </form>
    </div>
  );
}
