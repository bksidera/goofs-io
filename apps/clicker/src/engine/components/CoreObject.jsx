export default function CoreObject({ stage, onClick, buffed }) {
  const emoji = stage?.theme?.visual?.emoji ?? '💧';
  const order = stage?.order ?? 1;
  const classes = [
    'clicker-core-button',
    `stage-${order}`,
    buffed ? 'steam-buffed' : '',
  ].filter(Boolean).join(' ');
  return (
    <div className={classes} onClick={onClick}>
      <div className="clicker-core-object">{emoji}</div>
      <p>Click to Mine</p>
    </div>
  );
}
