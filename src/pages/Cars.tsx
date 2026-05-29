import { useCallback, useEffect, useState } from 'react';
import { api, type Car } from '../api';

export default function Cars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [seats, setSeats] = useState(4);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await api<{ cars: Car[] }>('/cars');
    setCars(d.cars);
  }, []);

  useEffect(() => {
    load().catch((e) => setErr((e as Error).message));
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api('/cars', {
        method: 'POST',
        body: JSON.stringify({ make, model, plate, seats }),
      });
      setMake('');
      setModel('');
      setPlate('');
      setSeats(4);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function del(id: number) {
    if (!confirm('Remove this car?')) return;
    await api(`/cars/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div>
      <h2>My cars</h2>
      <form onSubmit={add} className="card">
        <div className="row">
          <div>
            <label>Make</label>
            <input value={make} onChange={(e) => setMake(e.target.value)} required />
          </div>
          <div>
            <label>Model</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} required />
          </div>
          <div>
            <label>Plate</label>
            <input value={plate} onChange={(e) => setPlate(e.target.value)} required />
          </div>
          <div>
            <label>Seats (incl. driver)</label>
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
        <div style={{ marginTop: 12 }}>
          <button>Add car</button>
        </div>
        {err && <div className="error">{err}</div>}
      </form>

      {cars.length === 0 ? (
        <p className="muted">No cars yet.</p>
      ) : (
        cars.map((c) => (
          <div className="card" key={c.id}>
            <strong>
              {c.make} {c.model}
            </strong>{' '}
            <span className="muted">· {c.plate} · {c.seats} seats</span>
            <div style={{ marginTop: 8 }}>
              <button className="danger" onClick={() => del(c.id)}>Remove</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
