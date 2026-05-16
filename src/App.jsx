import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { games } from './games/registry.js';

function Home() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <span style={S.logo}>goofs.io</span>
        <span style={S.tagline}>weird stuff, playable</span>
      </div>

      <div style={S.grid}>
        {games.map(g => (
          <GameCard
            key={g.slug}
            title={g.title}
            desc={g.description}
            tags={g.tags}
            badge={g.badge}
            to={`/${g.slug}`}
            color={g.color}
          />
        ))}
      </div>

      <div style={S.footer}>
        <span>goofs.io — games that don't ask for your email</span>
      </div>
    </div>
  );
}

function GameCard({ title, desc, tags, badge, to, color }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{ ...S.card, '--c': color, borderColor: color + '44' }}>
        <div style={{ ...S.cardGlow, background: color + '08' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'monospace', textShadow: `0 0 12px ${color}55`, lineHeight: 1 }}>
            {title}
          </div>
          <div style={{ fontSize: 9, color, border: `1px solid ${color}`, padding: '2px 6px', letterSpacing: 2, fontFamily: 'monospace' }}>
            {badge}
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#888', fontFamily: 'monospace', lineHeight: 1.6, marginBottom: 14 }}>
          {desc}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map(t => (
            <span key={t} style={{ fontSize: 9, color: color + 'aa', border: `1px solid ${color}33`, padding: '2px 8px', fontFamily: 'monospace', letterSpacing: 1 }}>
              {t}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color, fontFamily: 'monospace', letterSpacing: 2 }}>
          PLAY NOW →
        </div>
      </div>
    </Link>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {games.map(g => (
          <Route key={g.slug} path={`/${g.slug}`} element={<g.component />} />
        ))}
      </Routes>
    </Router>
  );
}

const S = {
  page: {
    minHeight: '100svh',
    background: '#08080f',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '40px 24px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 48,
  },
  logo: {
    fontSize: 28,
    fontWeight: 900,
    fontFamily: 'monospace',
    color: '#fff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 12,
    color: '#444',
    fontFamily: 'monospace',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
    maxWidth: 900,
  },
  card: {
    position: 'relative',
    background: '#0d0d1a',
    border: '1px solid',
    borderRadius: 6,
    padding: 24,
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  cardGlow: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 48,
    fontSize: 10,
    color: '#222',
    fontFamily: 'monospace',
  },
};
