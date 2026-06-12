import { useMemo, useState } from 'react';
import {
  Activity,
  Edit3,
  KeyRound,
  Plus,
  Save,
  ShieldCheck,
  UserCheck,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import {
  Avatar,
  Button,
  Field,
  RoleBadge,
  SelectInput,
  TextInput,
} from '../components/primitives.jsx';
import { ROLE_DESCRIPTIONS, ROLE_VALUES } from '../data/seed.js';

const blankForm = {
  name: '',
  email: '',
  username: '',
  password: '',
  role: 'ARTIST',
};

const tabItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Accounts' },
  { id: 'activity', label: 'Activity Log' },
];

const roleOrder = ['ADMIN', 'REVIEWER', 'ARTIST'];

const formatLogTime = (value) => {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  return new Intl.DateTimeFormat('en', {
    month: sameDay ? undefined : 'short',
    day: sameDay ? undefined : 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

function AdminStat({ icon: Icon, label, value, sub }) {
  return (
    <article className="gc-admin-stat">
      <Icon size={17} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        <p>{sub}</p>
      </div>
    </article>
  );
}

function RoleGuide() {
  return (
    <section className="gc-admin-panel">
      <div className="gc-admin-panel-head">
        <div>
          <h2>Role Guide</h2>
          <p>Simple permission groups for the studio team.</p>
        </div>
      </div>
      <div className="gc-role-guide-grid">
        {roleOrder.map((role) => {
          const info = ROLE_DESCRIPTIONS[role];

          return (
            <article className="gc-role-guide-card" key={role}>
              <div className="gc-role-guide-title">
                <RoleBadge role={role} />
                <h3>{info.title}</h3>
              </div>
              <p>{info.summary}</p>
              <ul>
                {info.permissions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ActivityList({ logs }) {
  if (logs.length === 0) {
    return (
      <section className="gc-admin-panel gc-activity-empty">
        <Activity size={18} />
        <p>No activity has been recorded yet.</p>
      </section>
    );
  }

  return (
    <section className="gc-admin-panel">
      <div className="gc-admin-panel-head">
        <div>
          <h2>Activity Log</h2>
          <p>Plain-language history of what changed in the workspace.</p>
        </div>
      </div>
      <div className="gc-activity-list">
        {logs.map((log) => (
          <article className="gc-activity-item" key={log.id}>
            <div className="gc-activity-icon"><Activity size={14} /></div>
            <div className="gc-activity-copy">
              <div className="gc-activity-topline">
                <strong>{log.action}</strong>
                <span>{formatLogTime(log.createdAt)}</span>
              </div>
              <p>{log.summary}</p>
              {log.detail ? <small>{log.detail}</small> : null}
            </div>
            <RoleBadge role={log.actorRole} />
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AdminScreen({
  currentUser,
  users,
  panels,
  chapters,
  activityLogs,
  onCreateUser,
  onUpdateUser,
  onToggleUser,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const counts = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.active).length,
      admins: users.filter((user) => user.role === 'ADMIN').length,
      reviewers: users.filter((user) => user.role === 'REVIEWER').length,
      artists: users.filter((user) => user.role === 'ARTIST').length,
    };
  }, [users]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(blankForm);
    setError('');
  };

  const startCreate = () => {
    setActiveTab('users');
    setShowForm(true);
    setEditingId(null);
    setForm(blankForm);
    setError('');
  };

  const startEdit = (account) => {
    setActiveTab('users');
    setShowForm(true);
    setEditingId(account.id);
    setForm({
      name: account.name,
      email: account.email || '',
      username: account.username,
      password: account.password || '',
      role: account.role,
    });
    setError('');
  };

  const saveUser = async () => {
    const email = form.email.trim().toLowerCase();
    const username = form.username.trim() || email;

    if (!form.name.trim() || (!editingId && (!email || !form.password.trim()))) {
      setError('Please fill in display name, email, password, and role.');
      return;
    }

    const usernameTaken = users.some((account) => {
      return account.username.toLowerCase() === username.toLowerCase() && account.id !== editingId;
    });

    if (usernameTaken) {
      setError('That username is already in use.');
      return;
    }

    setSaving(true);
    setError('');

    if (editingId) {
      const previousUser = users.find((account) => account.id === editingId);
      try {
        await onUpdateUser({
          ...previousUser,
          name: form.name.trim(),
          email: email || previousUser.email,
          username,
          password: form.password || previousUser.password,
          role: form.role,
        }, previousUser);
        resetForm();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Could not save account.');
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      await onCreateUser({
        id: `usr-${Date.now()}`,
        name: form.name.trim(),
        email,
        username,
        password: form.password,
        role: form.role,
        active: true,
        joined: new Date().toISOString().slice(0, 7),
      });
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not create account.');
    } finally {
      setSaving(false);
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <main className="gc-screen gc-admin">
        <section className="gc-admin-denied">
          <ShieldCheck size={22} />
          <h1>Admin access required</h1>
          <p>This dashboard is only available to studio admins.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="gc-screen gc-admin">
      <header className="gc-admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Account access, team roles, and workspace activity for non-technical operators.</p>
        </div>
        <Button icon={Plus} label="Create Account" primary onClick={startCreate} />
      </header>

      <nav className="gc-admin-tabs" aria-label="Admin sections">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' ? (
        <div className="gc-admin-stack">
          <section className="gc-admin-stat-grid">
            <AdminStat icon={UsersRound} label="Accounts" value={counts.total} sub={`${counts.active} active users`} />
            <AdminStat icon={ShieldCheck} label="Admins" value={counts.admins} sub="Can manage accounts" />
            <AdminStat icon={UserCheck} label="Reviewers" value={counts.reviewers} sub="Can approve panel work" />
            <AdminStat icon={KeyRound} label="Artists" value={counts.artists} sub="Can update assigned work" />
            <AdminStat icon={Activity} label="Activity" value={activityLogs.length} sub="Recent workspace events" />
          </section>
          <RoleGuide />
          <ActivityList logs={activityLogs.slice(0, 6)} />
        </div>
      ) : null}

      {activeTab === 'users' ? (
        <div className="gc-admin-stack">
          <section className="gc-admin-section">
            <div className="gc-admin-panel-head">
              <div>
                <h2>Account Access</h2>
                <p>Only ADMIN users can create accounts or change another user's role.</p>
              </div>
              <Button icon={Plus} label="Add User" primary onClick={startCreate} />
            </div>

            <div className="gc-users-table-card">
              <table className="gc-users-table">
                <thead>
                  <tr>
                    {['#', 'Display Name', 'Username', 'Role', 'Status', 'Joined', 'Actions'].map((head) => (
                      <th key={head}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((account, index) => (
                    <tr key={account.id}>
                      <td className="dim">{index + 1}</td>
                      <td>
                        <div className="gc-user-cell">
                          <Avatar name={account.name} size={28} />
                          <span>{account.name}</span>
                        </div>
                      </td>
                      <td className="muted">{account.username}</td>
                      <td><RoleBadge role={account.role} /></td>
                      <td>
                        <span className={`gc-active-dot ${account.active ? 'active' : ''}`}>
                          <i />
                          {account.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="dim">{account.joined}</td>
                      <td>
                        <div className="gc-action-row">
                          <Button icon={Edit3} label="Edit" small onClick={() => startEdit(account)} />
                          {account.role !== 'ADMIN' ? (
                            <Button
                              icon={UserRoundX}
                              label={account.active ? 'Disable' : 'Enable'}
                              small
                              onClick={() => onToggleUser(account)}
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {showForm ? (
            <section className="gc-user-form-card">
              <h2>{editingId ? 'Edit Account' : '+ New Account'}</h2>
              <div className="gc-user-form">
                <Field label="Display Name">
                  <TextInput value={form.name} placeholder="Full name..." onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </Field>
                <Field label="Email">
                  <TextInput value={form.email} type="email" placeholder="name@studio.com" disabled={Boolean(editingId)} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </Field>
                <Field label="Username">
                  <TextInput value={form.username} placeholder="login_handle" onChange={(event) => setForm({ ...form, username: event.target.value })} />
                </Field>
                <Field label="Password">
                  <TextInput value={form.password} type="password" placeholder={editingId ? 'Leave as-is or enter a new password' : 'Temporary password'} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                </Field>
                <Field label="Role">
                  <SelectInput value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                    {ROLE_VALUES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </SelectInput>
                </Field>
                <div className="gc-role-helper">
                  {ROLE_DESCRIPTIONS[form.role].summary}
                </div>
                {error ? <div className="gc-error inline">{error}</div> : null}
                <div className="gc-form-actions">
                  <Button label="Cancel" onClick={resetForm} />
                  <Button
                    icon={Save}
                    label={saving ? 'Saving...' : editingId ? 'Save Account' : 'Create Account'}
                    primary
                    onClick={saveUser}
                    disabled={saving}
                  />
                </div>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'activity' ? (
        <div className="gc-admin-stack">
          <section className="gc-admin-stat-grid compact">
            <AdminStat icon={Activity} label="Logged Events" value={activityLogs.length} sub="Kept for admin review" />
            <AdminStat icon={UsersRound} label="Team Members" value={users.length} sub="Accounts in this workspace" />
            <AdminStat icon={KeyRound} label="Panels" value={panels.length} sub={`Across ${chapters.length} chapters`} />
          </section>
          <ActivityList logs={activityLogs} />
        </div>
      ) : null}
    </main>
  );
}
