import { visibleUpgrades, describeEffect } from '../game/logic.js';
import { formatNumber } from '../game/constants.js';
import { gameData } from '../game/state.js';

export default function UpgradeList({ state, onBuy }) {
  const upgrades = visibleUpgrades(state);
  const currencyName = gameData.meta.theme.currency_name;

  return (
    <div className="clicker-item-container">
      {upgrades.map(u => {
        const canAfford = state.currency >= u.cost;
        const label = describeEffect(u.effect);
        return (
          <div
            key={u.id}
            className={`clicker-item-card${canAfford ? '' : ' disabled'}`}
            onClick={() => onBuy(u.id)}
          >
            <h4>{u.theme.name}</h4>
            <p>{u.theme.description}</p>
            {label && <span className="clicker-effect-badge">{label}</span>}
            <p className="clicker-item-cost">
              Cost: {formatNumber(u.cost)} {currencyName}
            </p>
          </div>
        );
      })}
    </div>
  );
}
