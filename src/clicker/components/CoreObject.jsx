export default function CoreObject({ stage, onClick }) {
  const emoji = stage?.theme?.visual?.emoji ?? '💧';
  const order = stage?.order ?? 1;
  return (
    <div className={`clicker-core-button stage-${order}`} onClick={onClick}>
      <div className="clicker-core-object">{emoji}</div>
      <p>Click to Mine</p>
    </div>
  );
}
