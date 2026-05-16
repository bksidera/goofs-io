import { calculateBulkCost, visibleGenerators } from '../game/logic.js';
import { formatNumber } from '../game/constants.js';
import { gameData } from '../game/state.js';

export default function GeneratorList({ state, onBuy }) {
  const generators = visibleGenerators(state);
  const currencyName = gameData.meta.theme.currency_name;

  return (
    <div className="clicker-item-container">
      {generators.map(gen => {
        const owned = state.generators[gen.id] || 0;
        const cost = calculateBulkCost(gen, owned, state.buyAmount);
        const canAfford = state.currency >= cost;
        return (
          <div
            key={gen.id}
            className={`clicker-item-card${canAfford ? '' : ' disabled'}`}
            onClick={() => onBuy(gen.id)}
          >
            <h4>{gen.theme.name} ({owned})</h4>
            <p>{gen.theme.description}</p>
            <p className="clicker-item-cost">
              Buy {state.buyAmount}: {formatNumber(cost)} {currencyName}
            </p>
          </div>
        );
      })}
    </div>
  );
}
