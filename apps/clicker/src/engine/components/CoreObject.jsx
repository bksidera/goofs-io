export default function CoreObject({ stage, onClick, buffed }) {
  const emoji = stage?.theme?.visual?.emoji ?? '💧';
  const order = stage?.order ?? 1;
  const classes = [
    'clicker-core-button',
    `stage-${order}`,
    buffed ? 'steam-buffed' : '',
  ].filter(Boolean).join(' ');
  return (
    <button type="button" className={classes} onClick={onClick} aria-label="Mine">
      <div className="clicker-core-object" aria-hidden="true">{emoji}</div>
      <p>Click to Mine</p>
    </button>
  );
}
