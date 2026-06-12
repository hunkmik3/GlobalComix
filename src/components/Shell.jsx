import {
  ArrowLeft,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Shield,
  Table2,
} from 'lucide-react';
import { Avatar, Button, IconButton } from './primitives.jsx';
import { getChapterProgress } from '../lib/panels.js';

export function TrackerTopNav({
  chapters,
  activeChapterId,
  onChapter,
  onAddChapter,
  onBack,
  user,
  onAdmin,
}) {
  return (
    <header className="gc-tracker-topnav">
      <div className="gc-brand-small">GLOBALCOMIX</div>
      <div className="gc-topnav-divider" />
      <nav className="gc-chapter-tabs" aria-label="Chapters">
        {chapters.map((chapter) => (
          <button
            className={`gc-nav-tab ${chapter.id === activeChapterId ? 'active' : ''}`}
            key={chapter.id}
            type="button"
            onClick={() => onChapter(chapter.id)}
          >
            {chapter.name}
          </button>
        ))}
        <IconButton icon={Plus} label="Add chapter" className="gc-add-tab" onClick={onAddChapter} />
      </nav>
      <div className="gc-topnav-spacer" />
      <div className="gc-topnav-user">
        <span>{user?.name}</span>
        <button className="gc-avatar-button" type="button" onClick={onAdmin} title="User management">
          <Avatar name={user?.name || 'A'} size={30} />
        </button>
      </div>
      <Button icon={ArrowLeft} label="Dashboard" small onClick={onBack} />
    </header>
  );
}

export function Sidebar({
  comic,
  chapters,
  panels,
  activeChapterId,
  screen,
  user,
  onChapter,
  onNavigate,
  onAddChapter,
}) {
  const navItems = [
    { label: 'Comics', screen: 'stories', icon: BookOpen },
    { label: 'Dashboard', screen: 'dashboard', icon: LayoutDashboard },
    { label: 'Tracker', screen: 'tracker', icon: Table2 },
  ];

  return (
    <aside className="gc-sidebar">
      <div className="gc-sidebar-logo">
        <div>GLOBALCOMIX</div>
        <span>{comic?.name || 'Comic Library'}</span>
      </div>

      <div className="gc-sidebar-scroll">
        <div className="gc-sidebar-label">Chapters</div>
        {chapters.map((chapter) => {
          const chapterPanels = panels.filter((panel) => panel.chapterId === chapter.id);
          const progress = getChapterProgress(chapterPanels);

          return (
            <button
              key={chapter.id}
              className={`gc-sidebar-item ${chapter.id === activeChapterId ? 'active' : ''}`}
              type="button"
              onClick={() => onChapter(chapter.id)}
            >
              <span className="gc-sidebar-item-row">
                <span>{chapter.name}</span>
                <span>{chapterPanels.length}</span>
              </span>
              <span className="gc-sidebar-progress">
                <span style={{ width: `${progress.approvedPct}%` }} />
              </span>
            </button>
          );
        })}

        <button className="gc-sidebar-link" type="button" onClick={onAddChapter}>
          <Plus size={13} />
          Add Chapter
        </button>

        <div className="gc-sidebar-rule" />

        <div className="gc-sidebar-label">Navigate</div>
        {navItems.map(({ label, screen: itemScreen, icon: Icon }) => (
          <button
            key={itemScreen}
            className={`gc-sidebar-item compact ${screen === itemScreen ? 'active' : ''}`}
            type="button"
            onClick={() => onNavigate(itemScreen)}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <footer className="gc-sidebar-footer">
        <div className="gc-sidebar-user">
          <Avatar name={user?.name || 'A'} size={28} />
          <div>
            <div>{user?.name || 'Admin'}</div>
            <span>{user?.role || 'ADMIN'}</span>
          </div>
        </div>
        {user?.role === 'ADMIN' ? (
          <button className="gc-sidebar-admin" type="button" onClick={() => onNavigate('admin')}>
            <Settings size={13} />
            User Management
          </button>
        ) : (
          <div className="gc-sidebar-admin disabled">
            <Shield size={13} />
            Limited Access
          </div>
        )}
      </footer>
    </aside>
  );
}

export function AppTopBar({ screen, user, onNavigate, onLogout }) {
  const tabs = [
    { label: 'Comics', screen: 'stories' },
    { label: 'Dashboard', screen: 'dashboard' },
    { label: 'Tracker', screen: 'tracker' },
  ];

  if (user?.role === 'ADMIN') {
    tabs.push({ label: 'Admin', screen: 'admin' });
  }

  return (
    <header className="gc-app-topbar">
      <nav className="gc-app-tabs" aria-label="Primary">
        {tabs.map((tab) => (
          <button
            key={tab.screen}
            className={`gc-nav-tab ${screen === tab.screen ? 'active' : ''}`}
            type="button"
            onClick={() => onNavigate(tab.screen)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="gc-topbar-user">
        <span>{user?.role}</span>
        <button className="gc-avatar-button" type="button" onClick={onLogout} title="Log out">
          <Avatar name={user?.name || 'A'} size={28} />
        </button>
        <IconButton icon={LogOut} label="Log out" onClick={onLogout} />
      </div>
    </header>
  );
}
