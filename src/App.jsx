import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { AppTopBar, Sidebar, TrackerTopNav } from './components/Shell.jsx';
import { Button, Field, Modal, TextInput } from './components/primitives.jsx';
import { initialActivityLogs } from './data/seed.js';
import { saveState, loadState } from './lib/storage.js';
import {
  createAdminUser,
  fetchProfiles,
  getCurrentSessionUser,
  signInWithEmail,
  signOutFromSupabase,
} from './lib/supabase.js';
import {
  loadWorkspace,
  createComic as dbCreateComic,
  updateComic as dbUpdateComic,
  deleteComic as dbDeleteComic,
  createChapter as dbCreateChapter,
  deleteChapter as dbDeleteChapter,
  createPanel as dbCreatePanel,
  updatePanel as dbUpdatePanel,
  deletePanel as dbDeletePanel,
} from './lib/db.js';
import AdminScreen from './screens/AdminScreen.jsx';
import DashboardScreen from './screens/DashboardScreen.jsx';
import LoginScreen from './screens/LoginScreen.jsx';
import StoriesScreen from './screens/StoriesScreen.jsx';
import TrackerScreen from './screens/TrackerScreen.jsx';

const confirmDelete = (message) => window.confirm(message);

const deriveAssignees = (accounts) => accounts
  .filter((account) => account.active !== false && account.role !== 'ADMIN')
  .map((account) => ({
    id: account.id,
    name: account.name || account.username || account.email,
    role: account.role,
  }))
  .filter((account) => account.name)
  .sort((a, b) => a.name.localeCompare(b.name));

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
  const [activeComicId, setActiveComicId] = useState('');
  const [activeChapterId, setActiveChapterId] = useState('');
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [comics, setComics] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [panels, setPanels] = useState([]);
  const [users, setUsers] = useState([]);
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
    if (!user) {
      setUsers([]);
      setComics([]);
      setChapters([]);
      setPanels([]);
      setWorkspaceReady(false);
      return;
    }

    let active = true;
    setWorkspaceReady(false);

    const loadEverything = async () => {
      let loadedAssignees = [];

      try {
        const profiles = await fetchProfiles();
        if (!active) return;
        setUsers(profiles);
        loadedAssignees = deriveAssignees(profiles);
      } catch (error) {
        if (active) setUsers([]);
        console.error('Failed to load profiles', error);
      }

      try {
        const workspace = await loadWorkspace(loadedAssignees);
        if (!active) return;
        setComics(workspace.comics);
        setChapters(workspace.chapters);
        setPanels(workspace.panels);
      } catch (error) {
        console.error('Failed to load workspace', error);
      }

      if (active) setWorkspaceReady(true);
    };

    loadEverything();

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

  const assignees = useMemo(() => deriveAssignees(users), [users]);

  const activeChapter = useMemo(() => {
    return activeComicChapters.find((chapter) => chapter.id === activeChapterId) || activeComicChapters[0];
  }, [activeChapterId, activeComicChapters]);

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

  const openComic = async (comicId) => {
    const comicChapters = chapters.filter((chapter) => chapter.comicId === comicId);
    setActiveComicId(comicId);

    if (comicChapters[0]) {
      setActiveChapterId(comicChapters[0].id);
      setScreen('dashboard');
      return;
    }

    try {
      const { id } = await dbCreateChapter({ comicId, name: 'Chapter 1', sortOrder: 0 });
      setChapters((current) => [
        ...current,
        { id, comicId, name: 'Chapter 1', sortOrder: 0, updatedAt: 'Just created' },
      ]);
      setActiveChapterId(id);
      setScreen('dashboard');
    } catch (error) {
      window.alert(`Could not open comic: ${error.message}`);
    }
  };

  const createComic = async (comic) => {
    try {
      const { comicId, chapterId } = await dbCreateComic({
        name: comic.name,
        thumbnailAssetId: comic.thumbnail?.assetId || null,
        createdBy: user.id,
      });

      setComics((current) => [
        ...current,
        { id: comicId, name: comic.name, thumbnail: comic.thumbnail || null, updatedAt: 'Just created' },
      ]);
      setChapters((current) => [
        ...current,
        { id: chapterId, comicId, name: 'Chapter 1', sortOrder: 0, updatedAt: 'Just created' },
      ]);
      setActiveComicId(comicId);
      setActiveChapterId(chapterId);
      addActivity({
        action: 'Comic created',
        summary: `${user.name} created ${comic.name}.`,
        detail: 'A starter Chapter 1 was prepared for panel tracking.',
      });
    } catch (error) {
      window.alert(`Could not create comic: ${error.message}`);
    }
  };

  const deleteComic = async (comic) => {
    if (!confirmDelete(`Delete "${comic.name}" and all of its chapters and panels?`)) return;

    const comicChapterIds = chapters
      .filter((chapter) => chapter.comicId === comic.id)
      .map((chapter) => chapter.id);

    try {
      await dbDeleteComic(comic.id);
    } catch (error) {
      window.alert(`Could not delete comic: ${error.message}`);
      return;
    }

    setComics((current) => current.filter((item) => item.id !== comic.id));
    setChapters((current) => current.filter((chapter) => chapter.comicId !== comic.id));
    setPanels((current) => current.filter((panel) => !comicChapterIds.includes(panel.chapterId)));

    addActivity({
      action: 'Comic deleted',
      summary: `${user.name} deleted ${comic.name}.`,
      detail: `${comicChapterIds.length} chapters and their panels were removed from the workspace.`,
    });

    const nextComic = comics.find((item) => item.id !== comic.id);
    if (nextComic) {
      const nextChapter = chapters.find((chapter) => chapter.comicId === nextComic.id);
      setActiveComicId(nextComic.id);
      if (nextChapter) setActiveChapterId(nextChapter.id);
    } else {
      setActiveComicId('');
      setActiveChapterId('');
    }

    setScreen('stories');
  };

  const updateComic = async (updatedComic) => {
    try {
      await dbUpdateComic({
        id: updatedComic.id,
        name: updatedComic.name,
        thumbnailAssetId: updatedComic.thumbnail?.assetId ?? null,
      });
    } catch (error) {
      window.alert(`Could not update comic: ${error.message}`);
      return;
    }

    setComics((current) => current.map((comic) => (
      comic.id === updatedComic.id ? updatedComic : comic
    )));
    addActivity({
      action: 'Comic updated',
      summary: `${user.name} updated ${updatedComic.name}.`,
      detail: 'The comic profile or thumbnail was changed.',
    });
  };

  const createChapter = async (name) => {
    const sortOrder = activeComicChapters.length;

    let id;
    try {
      ({ id } = await dbCreateChapter({ comicId: activeComic.id, name, sortOrder }));
    } catch (error) {
      window.alert(`Could not create chapter: ${error.message}`);
      return;
    }

    setChapters((current) => [
      ...current,
      { id, comicId: activeComic.id, name, sortOrder, updatedAt: 'Just created' },
    ]);
    addActivity({
      action: 'Chapter created',
      summary: `${user.name} created ${name} for ${activeComic.name}.`,
      detail: 'The new chapter is ready for panels and production tracking.',
    });
    setActiveChapterId(id);
    setScreen('dashboard');
  };

  const deleteChapter = async (chapter) => {
    if (!confirmDelete(`Delete "${chapter.name}" and all panels in this chapter?`)) return;

    try {
      await dbDeleteChapter(chapter.id);
    } catch (error) {
      window.alert(`Could not delete chapter: ${error.message}`);
      return;
    }

    const removedPanels = panels.filter((panel) => panel.chapterId === chapter.id);
    const remainingChapters = chapters.filter((item) => item.id !== chapter.id);
    const nextChapter = remainingChapters.find((item) => item.comicId === chapter.comicId);

    setChapters(remainingChapters);
    setPanels((current) => current.filter((panel) => panel.chapterId !== chapter.id));

    addActivity({
      action: 'Chapter deleted',
      summary: `${user.name} deleted ${chapter.name}.`,
      detail: `${removedPanels.length} panels were removed from ${activeComic?.name || 'the comic'}.`,
    });

    if (nextChapter) {
      setActiveChapterId(nextChapter.id);
      setScreen(screen === 'tracker' ? 'tracker' : 'dashboard');
      return;
    }

    setActiveChapterId('');
    setScreen('stories');
  };

  const updatePanel = async (updatedPanel) => {
    setPanels((current) => current.map((panel) => (
      panel.id === updatedPanel.id ? updatedPanel : panel
    )));

    try {
      await dbUpdatePanel(updatedPanel, assignees);
    } catch (error) {
      window.alert(`Could not save panel: ${error.message}`);
      return;
    }

    addActivity({
      action: 'Panel updated',
      summary: `${user.name} updated ${updatedPanel.name}.`,
      detail: `Style Frame: ${updatedPanel.styleFrame.status}. Video: ${updatedPanel.video.status}.`,
    });
  };

  const createPanel = async (panel) => {
    let id;
    try {
      ({ id } = await dbCreatePanel(panel, assignees));
    } catch (error) {
      window.alert(`Could not create panel: ${error.message}`);
      return;
    }

    setPanels((current) => [...current, { ...panel, id }]);
    addActivity({
      action: 'Panel created',
      summary: `${user.name} added ${panel.name}.`,
      detail: 'The panel was added to the tracker and is ready for assignment.',
    });
  };

  const deletePanel = async (panel) => {
    if (!confirmDelete(`Delete panel "${panel.name}"?`)) return;

    try {
      await dbDeletePanel(panel.id);
    } catch (error) {
      window.alert(`Could not delete panel: ${error.message}`);
      return;
    }

    setPanels((current) => current.filter((item) => item.id !== panel.id));
    addActivity({
      action: 'Panel deleted',
      summary: `${user.name} deleted ${panel.name}.`,
      detail: 'The panel row was removed from the active chapter.',
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

  if (!workspaceReady) {
    return (
      <main className="gc-login">
        <section className="gc-login-card">
          <div className="gc-login-head">
            <h1>GLOBALCOMIX</h1>
            <p>Loading workspace...</p>
            <div />
          </div>
        </section>
      </main>
    );
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
            onDeleteComic={deleteComic}
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
            onDeleteComic={deleteComic}
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
            onDeleteChapter={deleteChapter}
            onBack={() => setScreen('dashboard')}
            user={user}
            onAdmin={() => navigate('admin')}
          />
          <TrackerScreen
            chapter={safeChapter}
            panels={panels}
            assignees={assignees}
            onUpdatePanel={updatePanel}
            onCreatePanel={createPanel}
            onDeletePanel={deletePanel}
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
            onDeleteChapter={deleteChapter}
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
