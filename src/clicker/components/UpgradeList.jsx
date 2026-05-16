import { visibleUpgrades } from '../game/logic.js';
import { formatNumber } from '../game/constants.js';
import { gameData } from '../game/state.js';

export default function UpgradeList({ state, onBuy }) {
  const upgrades = visibleUpgrades(state);
  const currencyName = gameData.meta.theme.currency_name;

  return (
    <div className="clicker-item-container">
      {upgrades.map(u => {
        const canAfford = state.currency >= u.cost;
        return (
          <div
            key={u.id}
            className={`clicker-item-card${canAfford ? '' : ' disabled'}`}
            onClick={() => onBuy(u.id)}
          >
            <h4>{u.theme.name}</h4>
            <p>{u.theme.description}</p>
            <p className="clicker-item-cost">
              Cost: {formatNumber(u.cost)} {currencyName}
            </p>
          </div>
        );
      })}
    </div>
  );
}
