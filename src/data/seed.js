export const STATUS_VALUES = ['Review', 'In Progress', 'Approved', 'Rejected', 'Done'];

export const ARTISTS = ['Sora P', 'Dae J', 'Ji W', 'Min H', 'Ji Won', 'Yu Na'];

export const ROLE_VALUES = ['ARTIST', 'REVIEWER', 'ADMIN'];

export const DEFAULT_COMIC_ID = 'comic-1';

export const ROLE_DESCRIPTIONS = {
  ADMIN: {
    title: 'Studio Admin',
    summary: 'Full control over accounts, panels, chapters, and activity history.',
    permissions: [
      'Create, edit, and disable user accounts',
      'Assign roles for artists, reviewers, and admins',
      'See the admin dashboard and activity history',
      'Manage every chapter, panel, status, and media file',
    ],
  },
  REVIEWER: {
    title: 'Reviewer',
    summary: 'Can review production work and move panels through approval states.',
    permissions: [
      'Open dashboard and tracker screens',
      'Review panel work and update production status',
      'Upload or replace review assets when needed',
      'Cannot create accounts or open the admin dashboard',
    ],
  },
  ARTIST: {
    title: 'Artist',
    summary: 'Can work on assigned panels and upload production assets.',
    permissions: [
      'Open dashboard and tracker screens',
      'Update assigned style frame or video work',
      'Upload old and new versions for assigned panels',
      'Cannot create accounts or open the admin dashboard',
    ],
  },
};

export const STATUS_COLORS = {
  Approved: { bg: '#041c0e', bd: '#1a5228', tx: '#22c55e' },
  Review: { bg: '#1e1400', bd: '#4a3600', tx: '#fbbf24' },
  'In Progress': { bg: '#040f22', bd: '#153060', tx: '#60a5fa' },
  Rejected: { bg: '#1a0404', bd: '#4a1010', tx: '#f87171' },
  Done: { bg: '#111111', bd: '#262626', tx: '#525252' },
};

export const ROLE_COLORS = {
  ADMIN: '#4d8ee8',
  ARTIST: '#22c55e',
  REVIEWER: '#fbbf24',
};

export const initialUsers = [
  { id: 'usr-1', name: 'Admin User', username: 'admin', password: 'admin', role: 'ADMIN', active: true, joined: '2025-01' },
  { id: 'usr-2', name: 'Park Sora', username: 'sora.p', password: 'demo', role: 'ARTIST', active: true, joined: '2025-02' },
  { id: 'usr-3', name: 'Dae Jun', username: 'dae.j', password: 'demo', role: 'ARTIST', active: true, joined: '2025-03' },
  { id: 'usr-4', name: 'Ji Won', username: 'ji.w', password: 'demo', role: 'REVIEWER', active: true, joined: '2025-04' },
  { id: 'usr-5', name: 'Min Ho', username: 'min.h', password: 'demo', role: 'ARTIST', active: true, joined: '2025-05' },
  { id: 'usr-6', name: 'Yu Na', username: 'yu.n', password: 'demo', role: 'REVIEWER', active: false, joined: '2025-06' },
];

export const initialComics = [
  {
    id: DEFAULT_COMIC_ID,
    name: 'Global Comix Project',
    thumbnail: null,
    updatedAt: 'Updated 2 hours ago',
  },
];

export const initialChapters = [
  { id: 'chap-1', comicId: DEFAULT_COMIC_ID, name: 'Chapter 1', updatedAt: 'Updated 2 hours ago' },
  { id: 'chap-2', comicId: DEFAULT_COMIC_ID, name: 'Chapter 2', updatedAt: 'Updated yesterday' },
  { id: 'chap-3', comicId: DEFAULT_COMIC_ID, name: 'Chapter 3', updatedAt: 'Draft setup' },
];

export const initialActivityLogs = [
  {
    id: 'log-1',
    actorName: 'Admin User',
    actorRole: 'ADMIN',
    action: 'Workspace prepared',
    summary: 'Admin User prepared the GlobalComix production workspace.',
    detail: 'Initial chapters, panel tracking, and demo accounts are ready.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'log-2',
    actorName: 'Park Sora',
    actorRole: 'ARTIST',
    action: 'Panel updated',
    summary: 'Park Sora moved MAGMEL_CHAP1_PANEL001 forward in production.',
    detail: 'Style Frame was marked Approved and is ready for video work.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'log-3',
    actorName: 'Ji Won',
    actorRole: 'REVIEWER',
    action: 'Review requested',
    summary: 'Ji Won requested another look at MAGMEL_CHAP1_PANEL005.',
    detail: 'The panel needs a small revision before approval.',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];

const artistCycle = ['Sora P', 'Dae J', 'Ji W', 'Min H'];

const statusForIndex = (index, counts) => {
  const approvedEnd = counts.approved;
  const progressEnd = approvedEnd + counts.progress;
  const reviewEnd = progressEnd + counts.review;

  if (index <= approvedEnd) return 'Approved';
  if (index <= progressEnd) return 'In Progress';
  if (index <= reviewEnd) return 'Review';
  return 'Rejected';
};

const buildPanel = (chapterId, chapterNumber, index, aggregateStatus) => {
  const stt = String(index).padStart(3, '0');
  const styleArtist = artistCycle[(index - 1) % artistCycle.length];
  const videoArtist = aggregateStatus === 'Review' && index % 3 === 1 ? null : artistCycle[(index + 1) % artistCycle.length];

  const stageByAggregate = {
    Approved: {
      sf: index % 5 === 0 ? 'Done' : 'Approved',
      vid: index % 7 === 0 ? 'Done' : 'Approved',
      sfOld: true,
      sfNew: true,
      vidOld: true,
      vidNew: true,
    },
    'In Progress': {
      sf: index % 2 === 0 ? 'Approved' : 'In Progress',
      vid: 'In Progress',
      sfOld: true,
      sfNew: index % 2 === 0,
      vidOld: index % 3 === 0,
      vidNew: false,
    },
    Review: {
      sf: index % 2 === 0 ? 'Review' : 'Approved',
      vid: 'Review',
      sfOld: index % 2 === 0,
      sfNew: false,
      vidOld: false,
      vidNew: false,
    },
    Rejected: {
      sf: 'Rejected',
      vid: 'Review',
      sfOld: true,
      sfNew: false,
      vidOld: false,
      vidNew: false,
    },
  };

  const stage = stageByAggregate[aggregateStatus];

  return {
    id: `${chapterId}-panel-${stt}`,
    chapterId,
    stt,
    name: `MAGMEL_CHAP${chapterNumber}_PANEL${stt}`,
    originImage: null,
    styleFrame: {
      assignedTo: styleArtist,
      status: stage.sf,
      oldImage: stage.sfOld ? 'placeholder' : null,
      newImage: stage.sfNew ? 'placeholder' : null,
    },
    video: {
      assignedTo: videoArtist,
      status: stage.vid,
      oldImage: videoArtist && stage.vidOld ? 'placeholder' : null,
      newImage: videoArtist && stage.vidNew ? 'placeholder' : null,
    },
    updatedAt: Date.now() - index * 3600000,
  };
};

const makeChapterPanels = (chapterId, chapterNumber, total, counts) => {
  return Array.from({ length: total }, (_, i) => {
    const index = i + 1;
    return buildPanel(chapterId, chapterNumber, index, statusForIndex(index, counts));
  });
};

export const initialPanels = [
  ...makeChapterPanels('chap-1', 1, 42, { approved: 18, progress: 12, review: 8 }),
  ...makeChapterPanels('chap-2', 2, 38, { approved: 5, progress: 20, review: 10 }),
  ...makeChapterPanels('chap-3', 3, 24, { approved: 0, progress: 4, review: 18 }),
];
