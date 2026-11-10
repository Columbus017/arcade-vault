'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GAMES } from '@/lib/games';
import { getTopScores, type ScoreRow } from '@/lib/scores';
type Result = { key: string; rows: ScoreRow[] } | { key: string; error: true };
const fmtScore = (n: number) => n.toLocaleString('es-ES');
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES');
export default function HallOfFamePage() {
  const [tab, setTab] = useState(GAMES[0].id);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const key = `${tab}:${attempt}`;
  useEffect(() => {
    let cancelled = false;
    getTopScores(tab, 10)
      .then((rows) => {
        if (!cancelled) setResult({ key, rows });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [tab, key]);
  const current = result && result.key === key ? result : null;
  const loading = current === null;
  const error = current !== null && 'error' in current;
  const rows = current && 'rows' in current ? current.rows : [];
  const slot = (i: number, cls: string, label: string) => {
    const r = rows[i];
    return (
      <div className={'podium-slot ' + cls}>
        {i === 0 && (
          <div
            className="pixel"
            style={{
              fontSize: 9,
              color: 'var(--gold)',
              letterSpacing: '0.18em',
            }}
          >
            CAMPEÓN
          </div>
        )}
        <div
          className="rank-num"
          style={i === 0 ? { fontSize: 36, marginTop: 4 } : undefined}
        >
          {label}
        </div>
        <div className="name">{r ? r.player_name : '—'}</div>
        <div className="score" style={i === 0 ? { fontSize: 20 } : undefined}>
          {r ? fmtScore(r.score) : '—'}
        </div>
        <div className="date">{r ? fmtDate(r.created_at) : '—'}</div>
      </div>
    );
  };
  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>
      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={'chip' + (tab === g.id ? ' active' : '')}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>
      {loading && (
        <div
          className="pixel"
          style={{ textAlign: 'center', fontSize: 11, padding: '48px 0' }}
        >
          CARGANDO_
        </div>
      )}
      {error && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p className="contact-error">NO SE PUDO CARGAR EL RANKING</p>
          <button
            className="btn yellow"
            onClick={() => setAttempt((a) => a + 1)}
          >
            REINTENTAR
          </button>
        </div>
      )}
      {!loading && !error && rows.length === 0 && (
        <div
          className="pixel neon-yellow"
          style={{ textAlign: 'center', fontSize: 14, padding: '48px 0' }}
        >
          SÉ EL PRIMERO EN ENTRAR
        </div>
      )}
      {rows.length > 0 && (
        <>
          <div className="podium">
            {slot(1, 'silver', '02')}
            {slot(0, 'gold', '01')}
            {slot(2, 'bronze', '03')}
          </div>
          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.id}
                className={
                  'tr' +
                  (i === 0
                    ? ' top1'
                    : i === 1
                      ? ' top2'
                      : i === 2
                        ? ' top3'
                        : '')
                }
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="rk">#{String(i + 1).padStart(2, '0')}</div>
                <div className="pl">{r.player_name}</div>
                <div className="sc">{fmtScore(r.score)}</div>
                <div className="dt">{fmtDate(r.created_at)}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link href="/biblioteca" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
