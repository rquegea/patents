import { statusColor, formatDate, pubTypeLabel } from '../utils/formatters';

export default function PatentDetail({ patent, onClose, onCreateAlert }) {
  if (!patent) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border-l border-border overflow-y-auto animate-slide-in shadow-[-4px_0_24px_rgba(0,0,0,0.06)]">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-3 flex items-center justify-between z-10">
          <span className="text-xs text-text-secondary">Patent detail</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Title */}
          <div>
            <h3 className="text-base font-semibold text-text-primary leading-snug">{patent.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              <span>{patent.jurisdiction}</span>
              <span>&#183;</span>
              <span>{patent.docNumber}</span>
              <span>&#183;</span>
              <span>{formatDate(patent.datePublished)}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg-panel text-xs text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor(patent.legalStatus) }} />
              {patent.legalStatus}
            </span>
            <span className="px-2 py-0.5 rounded bg-bg-panel text-xs text-text-secondary">
              {pubTypeLabel(patent.publicationType)}
            </span>
            <span className="px-2 py-0.5 rounded bg-bg-panel text-xs text-text-secondary">
              Family: {patent.familySize}
            </span>
          </div>

          {/* Abstract */}
          {patent.abstract && (
            <div>
              <h4 className="text-xs text-text-secondary mb-1.5">Abstract</h4>
              <p className="text-sm text-text-primary leading-relaxed">{patent.abstract}</p>
            </div>
          )}

          {/* Applicants */}
          {patent.applicants?.length > 0 && (
            <div>
              <h4 className="text-xs text-text-secondary mb-1.5">Applicants</h4>
              <div className="space-y-1">
                {patent.applicants.map((a, i) => (
                  <div key={i} className="text-sm text-text-primary">{a}</div>
                ))}
              </div>
            </div>
          )}

          {/* Inventors */}
          {patent.inventors?.length > 0 && (
            <div>
              <h4 className="text-xs text-text-secondary mb-1.5">Inventors</h4>
              <div className="flex flex-wrap gap-1.5">
                {patent.inventors.map((inv, i) => (
                  <span key={i} className="text-xs bg-bg-panel rounded px-2 py-0.5 text-text-secondary">{inv}</span>
                ))}
              </div>
            </div>
          )}

          {/* IPC */}
          {patent.ipcCodes?.length > 0 && (
            <div>
              <h4 className="text-xs text-text-secondary mb-1.5">IPC Classifications</h4>
              <div className="flex flex-wrap gap-1.5">
                {patent.ipcCodes.map((code, i) => (
                  <span key={i} className="text-xs font-mono bg-[#d3e5ef] text-[#2eaadc] rounded px-2 py-0.5">{code}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-border space-y-2">
            <a
              href={patent.lensUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2 bg-text-primary text-white text-sm font-medium rounded-md hover:bg-[#2f2f2f] transition-colors"
            >
              View on Lens.org
            </a>
            {onCreateAlert && (
              <button
                onClick={() => onCreateAlert(patent)}
                className="block w-full text-center py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-md transition-colors"
              >
                Create alert for this topic
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}
