import ClickerScreen from './screens/ClickerScreen.jsx';

// Mirrors AdGame.jsx: a thin root that owns screen routing for the game.
// Currently a single screen; loading/title/prestige screens can join later.
export default function Clicker() {
  return <ClickerScreen />;
}
