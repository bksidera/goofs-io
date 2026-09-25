export default function ConsentButton({ button, swapActive, overwriteActive, onAction }) {
  const dangerous = button.kind === 'accept' || button.kind === 'bossAccept';
  const cls = [
    'terms-consent-button',
    dangerous ? 'danger' : 'safe',
    button.small ? 'small' : '',
    button.boss ? 'boss' : '',
    swapActive ? 'swapping' : '',
    overwriteActive ? 'overwriting' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={cls}
      style={{
        left: button.x,
        top: button.y,
        width: button.w,
        height: button.h,
        '--heat': button.heat ?? 0,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onAction({ type: 'button', id: button.id });
      }}
    >
      {button.label}
    </button>
  );
}
