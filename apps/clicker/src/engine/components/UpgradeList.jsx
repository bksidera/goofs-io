import { visibleUpgrades, describeEffect } from '../logic.js';
import { formatNumber } from '../constants.js';
import { gameData } from '../state.js';

export default function UpgradeList({ state, onBuy }) {
  const upgrades = visibleUpgrades(state);
  const currencyName = gameData.meta.theme.currency_name;

  if (upgrades.length === 0) {
    return (
      <div className="clicker-item-container">
        <div className="clicker-item-card disabled" style={{ cursor: 'default' }}>
          <p style={{ textAlign: 'center', margin: 0 }}>// no upgrades available yet</p>
        </div>
      </div>
    );
  }

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
            <h4><span>{u.theme.name}</span></h4>
            <p>{u.theme.description}</p>
            {label && <span className="clicker-effect-badge">{label}</span>}
            <p className="clicker-item-cost">
              <span>BUY</span>
              <span>{formatNumber(u.cost)} {currencyName}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
