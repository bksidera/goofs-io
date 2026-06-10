import { calculateBulkCost, resolveBuyAmount, visibleGenerators } from '../game/logic.js';
import { formatNumber } from '../game/constants.js';
import { gameData } from '../game/state.js';

export default function GeneratorList({ state, onBuy, flashId }) {
  const generators = visibleGenerators(state);
  const currencyName = gameData.meta.theme.currency_name;
  const isMax = state.buyAmount === 'max';

  return (
    <div className="clicker-item-container">
      {generators.map(gen => {
        const owned = state.generators[gen.id] || 0;
        const amount = resolveBuyAmount(state, gen, owned);
        const displayAmount = Math.max(1, amount);
        const cost = calculateBulkCost(gen, owned, displayAmount);
        const canAfford = amount >= 1 && state.currency >= cost;
        const classes = [
          'clicker-item-card',
          canAfford ? '' : 'disabled',
          flashId === gen.id ? 'clicker-flash' : '',
        ].filter(Boolean).join(' ');
        const buyLabel = isMax ? `Buy MAX (${amount})` : `Buy ${amount}`;
        return (
          <div
            key={gen.id}
            className={classes}
            onClick={() => onBuy(gen.id)}
          >
            <h4>{gen.theme.name} ({owned})</h4>
            <p>{gen.theme.description}</p>
            <p className="clicker-item-cost">
              {buyLabel}: {formatNumber(cost)} {currencyName}
            </p>
          </div>
        );
      })}
    </div>
  );
}
