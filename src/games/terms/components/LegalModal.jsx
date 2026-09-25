export default function LegalModal({ modal, onAction }) {
  return (
    <div
      className={`terms-legal-modal ${modal.tier === 'small' ? 'small' : ''}`}
      style={{ left: modal.x, top: modal.y, width: modal.w, height: modal.h }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="terms-modal-title">
        <span>{modal.title}</span>
        <button
          aria-label="Close legal modal"
          onClick={(e) => {
            e.stopPropagation();
            onAction({ type: 'modalClose', id: modal.id });
          }}
        >
          x
        </button>
      </div>
      <div className="terms-modal-body">
        {modal.body}
      </div>
      <div className="terms-modal-actions">
        <button onClick={(e) => { e.stopPropagation(); onAction({ type: 'modalClose', id: modal.id }); }}>
          Reject
        </button>
        <button className="bad" onClick={(e) => e.stopPropagation()}>
          Recommended
        </button>
      </div>
    </div>
  );
}
