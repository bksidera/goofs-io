const AMOUNTS = [1, 10, 100, 'max'];

export default function BuyAmountToggle({ value, onChange }) {
  return (
    <div className="clicker-buy-controls" role="group" aria-label="Buy amount">
      {AMOUNTS.map(n => (
        <button
          key={n}
          type="button"
          className={`clicker-buy-btn${value === n ? ' active' : ''}`}
          onClick={() => onChange(n)}
          aria-pressed={value === n}
        >
          {n === 'max' ? 'MAX' : `×${n}`}
        </button>
      ))}
    </div>
  );
}
