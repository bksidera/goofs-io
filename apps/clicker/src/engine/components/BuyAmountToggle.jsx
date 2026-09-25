const AMOUNTS = [1, 10, 100, 'max'];

export default function BuyAmountToggle({ value, onChange }) {
  return (
    <div className="clicker-buy-controls">
      {AMOUNTS.map(n => (
        <button
          key={n}
          className={`clicker-buy-btn${value === n ? ' active' : ''}`}
          onClick={() => onChange(n)}
        >
          {n === 'max' ? 'MAX' : `x${n}`}
        </button>
      ))}
    </div>
  );
}
