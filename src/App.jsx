import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { AppTopBar, Sidebar, TrackerTopNav } from './components/Shell.jsx';
import { Button, Field, Modal, TextInput } from './components/primitives.jsx';
import {
  DEFAULT_COMIC_ID,
  initialActivityLogs,
  initialChapters,
  initialComics,
  initialPanels,
  initialUsers,
} from './data/seed.js';
import { saveState, loadState } from './lib/storage.js';
import {
  createAdminUser,
  fetchProfiles,
  getCurrentSessionUser,
  signInWithEmail,
  signOutFromSupabase,
} from './lib/supabase.js';
import { refreshComicAssetUrls, refreshPanelAssetUrls } from './lib/assets.js';
import AdminScreen from './screens/AdminScreen.jsx';
import DashboardScreen from './screens/DashboardScreen.jsx';
import LoginScreen from './screens/LoginScreen.jsx';
import StoriesScreen from './screens/StoriesScreen.jsx';
import TrackerScreen from './screens/TrackerScreen.jsx';

const normalizeComics = (comics) => {
  return comics.length > 0 ? comics : initialComics;
};

const normalizeChapters = (chapters) => {
  return chapters.map((chapter) => ({
    ...chapter,
    comicId: chapter.comicId || DEFAULT_COMIC_ID,
  }));
};

function ChapterModal({ comicName, onClose, onCreate }) {
  const [name, setName] = useState('');

  return (
    <Modal
      title="+ Add Chapter"
      subtitle={`Create a new production chapter${comicName ? ` for ${comicName}` : ''}`}
      width={460}
      onClose={onClose}
      footer={(
        <>
          <Button label="Cancel" onClick={onClose} />
          <Button
            icon={Save}
            label="Create Chapter"
            primary
            onClick={() => {
              if (!name.trim()) return;
              onCreate(name.trim());
              onClose();
            }}
          />
        </>
      )}
    >
      <Field label="Chapter Name">
        <TextInput autoFocus value={name} placeholder="Chapter 4" onChange={(event) => setName(event.target.value)} />
      </Field>
    </Modal>
  );
}

export default function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeComicId, setActiveComicId] = useState(DEFAULT_COMIC_ID);
  const [activeChapterId, setActiveChapterId] = useState('chap-1');
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [comics, setComics] = useState(() => normalizeComics(loadState('comics', initialComics)));
  const [chapters, setChapters] = useState(() => normalizeChapters(loadState('chapters', initialChapters)));
  const [panels, setPanels] = useState(() => loadState('panels', initialPanels));
  const [users, setUsers] = useState(() => loadState('users', initialUsers));
  const [activityLogs, setActivityLogs] = useState(() => loadState('activityLogs', initialActivityLogs));

  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      try {
        const sessionUser = await getCurrentSessionUser();
        if (!active) return;

        if (sessionUser) {
          setUser(sessionUser);
          setScreen('stories');
        }
      } catch (error) {
        if (active) setAuthError(error instanceof Error ? error.message : 'Could not restore session.');
      } finally {
        if (active) setAuthReady(true);
      }
    };

    hydrateSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;

    let active = true;

    fetchProfiles()
      .then((profiles) => {
        if (active && profiles.length > 0) setUsers(profiles);
      })
      .catch(() => {
        // Keep local fallback data if RLS blocks profile listing for now.
      });

    return () => {
      active = false;
    };
  }, [user?.role]);

  useEffect(() => {
    if (!user) return;

    let active = true;

    const refreshAssets = async () => {
      try {
        const [nextComics, nextPanels] = await Promise.all([
          Promise.all(comics.map((comic) => refreshComicAssetUrls(comic))),
          Promise.all(panels.map((panel) => refreshPanelAssetUrls(panel))),
        ]);

        if (!active) return;
        setComics(nextComics);
        setPanels(nextPanels);
      } catch {
        // Keep existing signed URLs; individual uploads will still refresh when replaced.
      }
    };

    refreshAssets();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const activeComic = useMemo(() => {
    return comics.find((comic) => comic.id === activeComicId) || comics[0];
  }, [activeComicId, comics]);

  const activeComicChapters = useMemo(() => {
    return chapters.filter((chapter) => chapter.comicId === activeComic?.id);
  }, [activeComic?.id, chapters]);

  const activeChapter = useMemo(() => {
    return activeComicChapters.find((chapter) => chapter.id === activeChapterId) || activeComicChapters[0];
  }, [activeChapterId, activeComicChapters]);

  useEffect(() => saveState('comics', comics), [comics]);
  useEffect(() => saveState('chapters', chapters), [chapters]);
  useEffect(() => saveState('panels', panels), [panels]);
  useEffect(() => saveState('users', users), [users]);
  useEffect(() => saveState('activityLogs', activityLogs), [activityLogs]);

  useEffect(() => {
    if (!comics.some((comic) => comic.id === activeComicId) && comics[0]) {
      setActiveComicId(comics[0].id);
    }
  }, [activeComicId, comics]);

  useEffect(() => {
    if (!activeComicChapters.some((chapter) => chapter.id === activeChapterId) && activeComicChapters[0]) {
      setActiveChapterId(activeComicChapters[0].id);
    }
  }, [activeChapterId, activeComicChapters]);

  useEffect(() => {
    if (screen === 'admin' && user?.role !== 'ADMIN') {
      setScreen('dashboard');
    }
  }, [screen, user]);

  const navigate = (nextScreen) => {
    if (nextScreen === 'admin' && user?.role !== 'ADMIN') return;
    if ((nextScreen === 'dashboard' || nextScreen === 'tracker') && !activeChapter) {
      setScreen('stories');
      return;
    }
    setScreen(nextScreen);
  };

  const addActivity = ({
    action,
    summary,
    detail,
    actorName = user?.name || 'System',
    actorRole = user?.role || 'SYSTEM',
  }) => {
    setActivityLogs((current) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        actorName,
        actorRole,
        action,
        summary,
        detail,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 200));
  };

  const handleLogin = async (email, password) => {
    try {
      const sessionUser = await signInWithEmail(email, password);

      setUser(sessionUser);
      setAuthError('');
      addActivity({
        actorName: sessionUser.name,
        actorRole: sessionUser.role,
        action: 'Signed in',
        summary: `${sessionUser.name} signed in to GlobalComix.`,
        detail: `${sessionUser.role} access was confirmed for this session.`,
      });
      setScreen('stories');
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Invalid email or password.',
      };
    }
  };

  const handleLogout = async () => {
    if (user) {
      addActivity({
        action: 'Signed out',
        summary: `${user.name} signed out of GlobalComix.`,
        detail: 'The session was closed from the app header.',
      });
    }
    await signOutFromSupabase();
    setUser(null);
    setScreen('login');
  };

  const handleChapter = (chapterId) => {
    setActiveChapterId(chapterId);
    setScreen('dashboard');
  };

  const openComic = (comicId) => {
    const comicChapters = chapters.filter((chapter) => chapter.comicId === comicId);
    setActiveComicId(comicId);

    if (comicChapters[0]) {
      setActiveChapterId(comicChapters[0].id);
      setScreen('dashboard');
      return;
    }

    const chapterId = `chap-${Date.now()}`;
    setChapters((current) => [
      ...current,
      {
        id: chapterId,
        comicId,
        name: 'Chapter 1',
        updatedAt: 'Just created',
      },
    ]);
    setActiveChapterId(chapterId);
    setScreen('dashboard');
  };

  const createComic = (comic) => {
    const chapterId = `chap-${Date.now()}`;
    setComics((current) => [...current, comic]);
    setChapters((current) => [
      ...current,
      {
        id: chapterId,
        comicId: comic.id,
        name: 'Chapter 1',
        updatedAt: 'Just created',
      },
    ]);
    setActiveComicId(comic.id);
    setActiveChapterId(chapterId);
    addActivity({
      action: 'Comic created',
      summary: `${user.name} created ${comic.name}.`,
      detail: 'A starter Chapter 1 was prepared for panel tracking.',
    });
  };

  const updateComic = (updatedComic) => {
    setComics((current) => current.map((comic) => (
      comic.id === updatedComic.id ? updatedComic : comic
    )));
    addActivity({
      action: 'Comic updated',
      summary: `${user.name} updated ${updatedComic.name}.`,
      detail: 'The comic profile or thumbnail was changed.',
    });
  };

  const createChapter = (name) => {
    const id = `chap-${Date.now()}`;
    const nextChapter = {
      id,
      comicId: activeComic.id,
      name,
      updatedAt: 'Just created',
    };
    setChapters((current) => [...current, nextChapter]);
    addActivity({
      action: 'Chapter created',
      summary: `${user.name} created ${name} for ${activeComic.name}.`,
      detail: 'The new chapter is ready for panels and production tracking.',
    });
    setActiveChapterId(id);
    setScreen('dashboard');
  };

  const updatePanel = (updatedPanel) => {
    setPanels((current) => current.map((panel) => (
      panel.id === updatedPanel.id ? updatedPanel : panel
    )));
    addActivity({
      action: 'Panel updated',
      summary: `${user.name} updated ${updatedPanel.name}.`,
      detail: `Style Frame: ${updatedPanel.styleFrame.status}. Video: ${updatedPanel.video.status}.`,
    });
  };

  const createPanel = (panel) => {
    setPanels((current) => [...current, panel]);
    addActivity({
      action: 'Panel created',
      summary: `${user.name} added ${panel.name}.`,
      detail: 'The panel was added to the tracker and is ready for assignment.',
    });
  };

  const createUserAccount = async (nextUser) => {
    const createdUser = await createAdminUser({
      email: nextUser.email,
      password: nextUser.password,
      username: nextUser.username,
      displayName: nextUser.name,
      role: nextUser.role,
    });

    const remoteUser = {
      ...nextUser,
      id: createdUser?.id || nextUser.id,
      password: '',
    };

    setUsers((current) => [...current, remoteUser]);
    addActivity({
      action: 'Account created',
      summary: `${user.name} created an account for ${remoteUser.name}.`,
      detail: `${remoteUser.name} can sign in as ${remoteUser.role}.`,
    });

    return remoteUser;
  };

  const updateUserAccount = (updatedUser, previousUser) => {
    setUsers((current) => current.map((account) => (
      account.id === updatedUser.id ? updatedUser : account
    )));
    addActivity({
      action: 'Account updated',
      summary: `${user.name} updated ${updatedUser.name}'s account.`,
      detail: previousUser.role === updatedUser.role
        ? 'Profile details were refreshed.'
        : `Role changed from ${previousUser.role} to ${updatedUser.role}.`,
    });
  };

  const toggleUserAccount = (targetUser) => {
    const nextActive = !targetUser.active;
    setUsers((current) => current.map((account) => (
      account.id === targetUser.id ? { ...account, active: nextActive } : account
    )));
    addActivity({
      action: nextActive ? 'Account enabled' : 'Account disabled',
      summary: `${user.name} ${nextActive ? 'enabled' : 'disabled'} ${targetUser.name}'s account.`,
      detail: nextActive
        ? `${targetUser.name} can sign in again.`
        : `${targetUser.name} can no longer sign in until re-enabled.`,
    });
  };

  if (!authReady) {
    return (
      <main className="gc-login">
        <section className="gc-login-card">
          <div className="gc-login-head">
            <h1>GLOBALCOMIX</h1>
            <p>Restoring session...</p>
            <div />
          </div>
        </section>
      </main>
    );
  }

  if (!user || screen === 'login') {
    return <LoginScreen onLogin={handleLogin} initialError={authError} />;
  }

  const safeComic = activeComic || comics[0];
  const safeChapter = activeChapter || activeComicChapters[0];

  if (screen === 'stories') {
    return (
      <div className="gc-app">
        <div className="gc-main-column">
          <AppTopBar screen={screen} user={user} onNavigate={navigate} onLogout={handleLogout} />
          <StoriesScreen
            comics={comics}
            chapters={chapters}
            onCreateComic={createComic}
            onUpdateComic={updateComic}
            onOpenComic={openComic}
          />
        </div>
      </div>
    );
  }

  if (!safeChapter) {
    return (
      <div className="gc-app">
        <div className="gc-main-column">
          <AppTopBar screen="stories" user={user} onNavigate={navigate} onLogout={handleLogout} />
          <StoriesScreen
            comics={comics}
            chapters={chapters}
            onCreateComic={createComic}
            onUpdateComic={updateComic}
            onOpenComic={openComic}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="gc-app">
      {screen === 'tracker' && safeChapter ? (
        <>
          <TrackerTopNav
            chapters={activeComicChapters}
            activeChapterId={safeChapter.id}
            onChapter={(chapterId) => {
              setActiveChapterId(chapterId);
              setScreen('tracker');
            }}
            onAddChapter={() => setShowChapterModal(true)}
            onBack={() => setScreen('dashboard')}
            user={user}
            onAdmin={() => navigate('admin')}
          />
          <TrackerScreen
            chapter={safeChapter}
            panels={panels}
            onUpdatePanel={updatePanel}
            onCreatePanel={createPanel}
          />
        </>
      ) : (
        <div className="gc-shell-row">
          <Sidebar
            comic={safeComic}
            chapters={activeComicChapters}
            panels={panels}
            activeChapterId={safeChapter.id}
            screen={screen}
            user={user}
            onChapter={handleChapter}
            onNavigate={navigate}
            onAddChapter={() => setShowChapterModal(true)}
          />
          <div className="gc-main-column">
            <AppTopBar screen={screen} user={user} onNavigate={navigate} onLogout={handleLogout} />
            {screen === 'admin' ? (
              <AdminScreen
                currentUser={user}
                users={users}
                panels={panels}
                chapters={activeComicChapters}
                activityLogs={activityLogs}
                onCreateUser={createUserAccount}
                onUpdateUser={updateUserAccount}
                onToggleUser={toggleUserAccount}
              />
            ) : (
              <DashboardScreen
                comic={safeComic}
                chapters={activeComicChapters}
                panels={panels}
                activeChapterId={safeChapter.id}
                onChapter={setActiveChapterId}
                onNavigate={navigate}
              />
            )}
          </div>
        </div>
      )}

      {showChapterModal ? (
        <ChapterModal comicName={safeComic?.name} onClose={() => setShowChapterModal(false)} onCreate={createChapter} />
      ) : null}
    </div>
  );
}
