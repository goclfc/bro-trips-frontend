import { useCallback, useEffect, useState } from 'react';
import { api, type Passenger, type Trip } from '../api';
import { useAuth } from '../auth';

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Trips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const d = await api<{ trips: Trip[] }>('/trips');
      setTrips(d.trips);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p>Loading trips…</p>;
  if (err) return <p className="error">{err}</p>;
  if (trips.length === 0) return <p className="muted">No upcoming trips yet. Offer the first one!</p>;

  return (
    <div>
      <h2>Upcoming trips</h2>
      {trips.map((t) => (
        <TripCard key={t.id} trip={t} meId={user!.id} onChanged={load} />
      ))}
    </div>
  );
}

function TripCard({ trip, meId, onChanged }: { trip: Trip; meId: number; onChanged: () => void }) {
  const free = trip.seats_total - trip.seats_booked;
  const mine = trip.driver_id === meId;
  const [seats, setSeats] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<Passenger[] | null>(null);

  async function book() {
    setBusy(true);
    setErr(null);
    try {
      await api(`/trips/${trip.id}/book`, {
        method: 'POST',
        body: JSON.stringify({ seats }),
      });
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function unbook() {
    setBusy(true);
    setErr(null);
    try {
      await api(`/trips/${trip.id}/book`, { method: 'DELETE' });
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function showPassengers() {
    try {
      const d = await api<{ passengers: Passenger[] }>(`/trips/${trip.id}/passengers`);
      setPassengers(d.passengers);
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  async function cancelTrip() {
    if (!confirm('Cancel this trip? All bookings will be removed.')) return;
    setBusy(true);
    try {
      await api(`/trips/${trip.id}`, { method: 'DELETE' });
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3>
        {trip.from_address} → {trip.to_address}
      </h3>
      <div className="muted">{fmt(trip.depart_at)}</div>
      <div className="row" style={{ marginTop: 8, alignItems: 'center' }}>
        <span className={free > 0 ? 'tag ok' : 'tag warn'}>
          {free} / {trip.seats_total} seats free
        </span>
        <span className="tag">
          {trip.car_make} {trip.car_model} · {trip.car_plate}
        </span>
        <span className="muted">Driver: {trip.driver_name}</span>
      </div>
      {trip.notes && <p className="muted" style={{ marginTop: 8 }}>{trip.notes}</p>}

      <div className="row" style={{ marginTop: 12, alignItems: 'flex-end' }}>
        {mine ? (
          <>
            <button className="secondary" onClick={showPassengers}>See passengers</button>
            <button className="danger" onClick={cancelTrip} disabled={busy}>Cancel trip</button>
          </>
        ) : trip.booked_by_me ? (
          <button className="danger" onClick={unbook} disabled={busy}>Cancel my booking</button>
        ) : (
          <>
            <div style={{ maxWidth: 110 }}>
              <label>Seats</label>
              <input
                type="number"
                min={1}
                max={Math.max(1, free)}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
              />
            </div>
            <button onClick={book} disabled={busy || free === 0}>Book</button>
          </>
        )}
      </div>
      {err && <div className="error">{err}</div>}
      {passengers && (
        <div style={{ marginTop: 12 }}>
          <strong>Passengers</strong>
          {passengers.length === 0 ? (
            <p className="muted">Nobody yet.</p>
          ) : (
            <ul>
              {passengers.map((p) => (
                <li key={p.id}>
                  {p.name} — {p.seats} seat(s) — <span className="muted">{p.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
