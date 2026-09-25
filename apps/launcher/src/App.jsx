import { games } from './registry.js';
import MatrixRain from './MatrixRain.jsx';
import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.page}>
      <MatrixRain className={styles.rain} />

      <header className={styles.header}>
        <div className={styles.logoRow}>
          <span className={styles.prompt} aria-hidden="true">&gt;</span>
          <span className={styles.logo}>goofs.io</span>
          <span className={styles.cursor} aria-hidden="true">_</span>
        </div>
        <p className={styles.tagline}>weird stuff, playable.</p>
      </header>

      <main className={styles.grid} role="list">
        {games.map((g) => <GameCard key={g.slug} game={g} />)}
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerLine}>
          <span className={styles.dot} /> games that don&rsquo;t ask for your email
        </span>
        <span className={styles.footerLine}>
          <span className={styles.hex}>0x{sessionSeed()}</span> · no cookies · no accounts · no ads
        </span>
      </footer>
    </div>
  );
}

function GameCard({ game }) {
  return (
    <a
      href={game.url}
      className={styles.card}
      role="listitem"
      style={{ '--accent': game.color, '--accent-hex': game.accentHex }}
    >
      <div className={styles.cardGlow} aria-hidden="true" />
      <div className={styles.cardHead}>
        <div className={styles.cardTitleWrap}>
          <span className={styles.cardTitle}>{game.title}</span>
          <span className={styles.cardTagline}>{game.tagline}</span>
        </div>
        <span className={styles.badge}>{game.badge}</span>
      </div>

      <p className={styles.cardDesc}>{game.description}</p>

      <div className={styles.tagRow}>
        {game.tags.map((t) => (
          <span key={t} className={styles.tag}>#{t}</span>
        ))}
      </div>

      <div className={styles.cardCta}>
        <span className={styles.ctaText}>launch</span>
        <span className={styles.ctaArrow} aria-hidden="true">→</span>
      </div>
    </a>
  );
}

// Generate a stable-looking hex seed per session for that "you are a node" feel.
// It's just for texture; nothing depends on it.
function sessionSeed() {
  const n = Math.floor(Math.random() * 0xffffff);
  return n.toString(16).padStart(6, '0');
}
