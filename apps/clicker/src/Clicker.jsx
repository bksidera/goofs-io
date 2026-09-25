import ArcScreen from './engine/screens/ArcScreen.jsx';
import cryptoArc from './arcs/crypto/index.js';
import './arcs/crypto/theme.css';

// Thin root — composes the reusable Narrative Clicker Engine (ArcScreen) with
// the first arc's content bundle (crypto). Additional arcs (e.g. Epochs of
// Man) would each get their own arcs/<name>/index.js + theme.css and mount
// alongside a route or picker here.
export default function Clicker() {
  return <ArcScreen arc={cryptoArc} />;
}
