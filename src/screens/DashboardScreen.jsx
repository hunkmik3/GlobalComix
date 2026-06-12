import { ArrowRight, CheckCircle2, Clock3, Eye, XCircle } from 'lucide-react';
import { Badge, Button, ImageThumb } from '../components/primitives.jsx';
import { getChapterProgress, getPanelStageStatus } from '../lib/panels.js';

const STAT_CONFIG = [
  { key: 'total', label: 'Total Panels', color: '#e2e2e2', sub: 'this chapter' },
  { key: 'Approved', label: 'Approved', color: '#22c55e', sub: 'done', icon: CheckCircle2 },
  { key: 'In Progress', label: 'In Progress', color: '#60a5fa', sub: 'active', icon: Clock3 },
  { key: 'Review', label: 'Review', color: '#fbbf24', sub: 'awaiting', icon: Eye },
  { key: 'Rejected', label: 'Rejected', color: '#f87171', sub: 'rework needed', icon: XCircle },
];

export default function DashboardScreen({
  comic,
  chapters,
  panels,
  activeChapterId,
  onChapter,
  onNavigate,
}) {
  const activeChapter = chapters.find((chapter) => chapter.id === activeChapterId) || chapters[0];
  const chapterPanels = panels.filter((panel) => panel.chapterId === activeChapter.id);
  const progress = getChapterProgress(chapterPanels);
  const recentPanels = [...chapterPanels]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8);

  return (
    <main className="gc-screen gc-dashboard">
      <header className="gc-page-header">
        <div>
          <h1>
            {activeChapter.name}
            <span>{chapterPanels.length} panels</span>
          </h1>
          <p>{comic?.name || 'Comic'} - {activeChapter.updatedAt}</p>
        </div>
        <Button icon={ArrowRight} label="Open Tracker" primary onClick={() => onNavigate('tracker')} />
      </header>

      <div className="gc-dashboard-content">
        <section className="gc-stats-grid">
          {STAT_CONFIG.map((item) => {
            const value = item.key === 'total' ? progress.stats.total : progress.stats[item.key];

            return (
              <article className="gc-stat-card" key={item.key} style={{ '--stat-color': item.color }}>
                <div className="gc-stat-number">{value}</div>
                <div className="gc-stat-label">{item.label}</div>
                <div className="gc-stat-sub">{item.sub}</div>
              </article>
            );
          })}
        </section>

        <section className="gc-progress-card">
          <div className="gc-card-head">
            <span>Chapter Progress</span>
            <strong>{progress.approvedPct}% complete</strong>
          </div>
          <div className="gc-segmented-progress large">
            <span className="approved" style={{ width: `${progress.approvedPct}%` }} />
            <span className="progress" style={{ width: `${progress.progressPct}%` }} />
            <span className="review" style={{ width: `${progress.reviewPct}%` }} />
            <span className="rejected" style={{ width: `${progress.rejectedPct}%` }} />
          </div>
          <div className="gc-progress-legend">
            <span><i className="approved" />Approved {progress.approvedPct}%</span>
            <span><i className="progress" />In Progress {progress.progressPct}%</span>
            <span><i className="review" />Review {progress.reviewPct}%</span>
            <span><i className="rejected" />Rejected {progress.rejectedPct}%</span>
          </div>
        </section>

        <section>
          <div className="gc-section-label">All Chapters</div>
          <div className="gc-chapter-card-grid">
            {chapters.map((chapter) => {
              const chapterSet = panels.filter((panel) => panel.chapterId === chapter.id);
              const chapterProgress = getChapterProgress(chapterSet);

              return (
                <article
                  className={`gc-chapter-card ${chapter.id === activeChapterId ? 'active' : ''}`}
                  key={chapter.id}
                  onClick={() => onChapter(chapter.id)}
                >
                  <div className="gc-chapter-card-head">
                    <div>
                      <h3>{chapter.name}</h3>
                      <p>{chapterSet.length} panels</p>
                    </div>
                    <Button
                      label="Open"
                      small
                      onClick={(event) => {
                        event.stopPropagation();
                        onChapter(chapter.id);
                        onNavigate('tracker');
                      }}
                    />
                  </div>
                  <div className="gc-segmented-progress">
                    <span className="approved" style={{ width: `${chapterProgress.approvedPct}%` }} />
                    <span className="progress" style={{ width: `${chapterProgress.progressPct}%` }} />
                    <span className="review" style={{ width: `${chapterProgress.reviewPct}%` }} />
                    <span className="rejected" style={{ width: `${chapterProgress.rejectedPct}%` }} />
                  </div>
                  <div className="gc-chapter-badges">
                    <Badge status="Approved" />
                    <span>{chapterProgress.stats.Approved}</span>
                    <Badge status="In Progress" />
                    <span>{chapterProgress.stats['In Progress']}</span>
                    <Badge status="Review" />
                    <span>{chapterProgress.stats.Review}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <div className="gc-section-label">Recent Activity</div>
          <div className="gc-recent-grid">
            {recentPanels.map((panel) => (
              <article className="gc-recent-card" key={panel.id} onClick={() => onNavigate('tracker')}>
                <ImageThumb image={panel.originImage || 'placeholder'} w={114} h={78} />
                <h3>{panel.name.replace('MAGMEL_CHAP', 'CH')}</h3>
                <Badge status={getPanelStageStatus(panel)} />
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
