import { useEffect } from 'react';
import { useCompetitors } from '../hooks/useCompetitors';
import CompetitorList from './CompetitorList';
import CompetitorDetail from './CompetitorDetail';
import GlobalFeed from './GlobalFeed';

export default function CompetitorsView({ addToast }) {
  const {
    competitors, selectedId, setSelectedId, patents, feed,
    loading, checking,
    fetchCompetitors, createCompetitor, updateCompetitor, deleteCompetitor,
    checkCompetitor, checkAll, fetchPatents, markSeen, fetchFeed,
  } = useCompetitors();

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const selectedCompetitor = competitors.find(c => c.id === selectedId) || null;

  return (
    <div className="flex h-full" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Left panel — 35% */}
      <div className="w-[35%] min-w-[240px] flex flex-col">
        <CompetitorList
          competitors={competitors}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={createCompetitor}
          onCheckAll={checkAll}
          checking={checking}
          addToast={addToast}
        />
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-hidden">
        {selectedCompetitor ? (
          <CompetitorDetail
            competitor={selectedCompetitor}
            patents={patents}
            loading={loading}
            checking={checking}
            onCheck={checkCompetitor}
            onMarkSeen={markSeen}
            onEdit={updateCompetitor}
            onDelete={deleteCompetitor}
            onFetchPatents={fetchPatents}
            addToast={addToast}
          />
        ) : (
          <GlobalFeed feed={feed} onFetch={fetchFeed} />
        )}
      </div>
    </div>
  );
}
