export default function ContractCard({ stage, phase, score }) {
  const clear = phase === 'clear';
  return (
    <div className={`terms-contract-card ${clear ? 'clear' : ''}`}>
      <div className="terms-contract-kicker">{clear ? 'PREFERENCES SAVED' : 'NEW AGREEMENT'}</div>
      <h2>{clear ? 'Clause Rejected' : stage.name}</h2>
      <p>{clear ? stage.result : stage.subtitle}</p>
      <div className="terms-fine-print">{clear ? `Score banked: ${Math.floor(score).toLocaleString()}` : stage.joke}</div>
    </div>
  );
}
