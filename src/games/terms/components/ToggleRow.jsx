export default function ToggleRow({ toggle, onAction }) {
  return (
    <button
      className={`terms-toggle-row ${toggle.on ? 'on' : 'off'}`}
      style={{ left: toggle.x, top: toggle.y, width: toggle.w, height: toggle.h }}
      onClick={(e) => {
        e.stopPropagation();
        onAction({ type: 'toggle', id: toggle.id });
      }}
    >
      <span>{toggle.name}</span>
      <span className="terms-toggle-switch" />
    </button>
  );
}
