import { supabase } from './supabase.js';
import { refreshAssetReadUrl } from './assets.js';

// Data layer for the shared workspace (comics, chapters, panels) backed by Supabase.
// The frontend keeps a "rich" nested panel shape (styleFrame/video with names + image
// assets); the DB stores a flat row with profile UUIDs. These helpers translate between
// the two and reconstruct image assets from the panel_assets table.

const DEFAULT_STATUS = 'Review';

const newId = () => (
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
);

const nameToId = (assignees, name) => {
  if (!name) return null;
  return assignees.find((assignee) => assignee.name === name)?.id || null;
};

const idToName = (assignees, id) => {
  if (!id) return '';
  return assignees.find((assignee) => assignee.id === id)?.name || '';
};

const assetFromRow = (row) => {
  if (!row) return null;
  return {
    type: 'r2',
    assetId: row.id,
    r2Key: row.r2_key,
    name: (row.r2_key || '').split('/').pop() || 'asset',
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    stage: row.stage,
    version: row.version,
  };
};

// Index panel_assets rows so we can look them up by id (comic thumbnails) and by
// panel + stage + version (panel images). Rows arrive ordered by created_at ascending,
// so the latest upload naturally overwrites earlier ones.
const indexAssets = (rows) => {
  const byId = {};
  const byPanel = {};

  rows.forEach((row) => {
    byId[row.id] = row;
    if (row.panel_id) {
      byPanel[row.panel_id] = byPanel[row.panel_id] || {};
      byPanel[row.panel_id][`${row.stage}:${row.version}`] = row;
    }
  });

  return { byId, byPanel };
};

const toPanel = (row, assetIndex, assignees) => {
  const assets = assetIndex.byPanel[row.id] || {};

  return {
    id: row.id,
    chapterId: row.chapter_id,
    stt: row.stt || '',
    name: row.name || '',
    originImage: assetFromRow(assets['origin:origin']),
    styleFrame: {
      assignedTo: idToName(assignees, row.sf_assigned_to),
      status: row.sf_status || DEFAULT_STATUS,
      oldImage: assetFromRow(assets['style_frame:old']),
      newImage: assetFromRow(assets['style_frame:new']),
    },
    video: {
      assignedTo: idToName(assignees, row.video_assigned_to),
      status: row.video_status || DEFAULT_STATUS,
      oldImage: assetFromRow(assets['video:old']),
      newImage: assetFromRow(assets['video:new']),
    },
    updatedAt: row.updated_at ? Date.parse(row.updated_at) : Date.now(),
  };
};

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '';
  }
};

const refreshPanelImages = async (panel) => ({
  ...panel,
  originImage: await refreshAssetReadUrl(panel.originImage),
  styleFrame: {
    ...panel.styleFrame,
    oldImage: await refreshAssetReadUrl(panel.styleFrame.oldImage),
    newImage: await refreshAssetReadUrl(panel.styleFrame.newImage),
  },
  video: {
    ...panel.video,
    oldImage: await refreshAssetReadUrl(panel.video.oldImage),
    newImage: await refreshAssetReadUrl(panel.video.newImage),
  },
});

// Load the whole shared workspace from the database and shape it for the UI.
export const loadWorkspace = async (assignees = []) => {
  const [comicsRes, chaptersRes, panelsRes, assetsRes] = await Promise.all([
    supabase.from('comics').select('*').order('created_at', { ascending: true }),
    supabase.from('chapters').select('*').order('sort_order', { ascending: true }),
    supabase.from('panels').select('*').order('stt', { ascending: true }),
    supabase.from('panel_assets').select('*').order('created_at', { ascending: true }),
  ]);

  const firstError = comicsRes.error || chaptersRes.error || panelsRes.error || assetsRes.error;
  if (firstError) throw new Error(firstError.message);

  const assetIndex = indexAssets(assetsRes.data || []);

  const comics = (comicsRes.data || []).map((row) => ({
    id: row.id,
    name: row.name,
    thumbnail: assetFromRow(assetIndex.byId[row.thumbnail_asset_id]),
    updatedAt: formatDate(row.updated_at || row.created_at),
  }));

  const chapters = (chaptersRes.data || []).map((row) => ({
    id: row.id,
    comicId: row.comic_id,
    name: row.name,
    sortOrder: row.sort_order ?? 0,
    updatedAt: formatDate(row.created_at),
  }));

  const panels = (panelsRes.data || []).map((row) => toPanel(row, assetIndex, assignees));

  const [nextComics, nextPanels] = await Promise.all([
    Promise.all(comics.map(async (comic) => ({
      ...comic,
      thumbnail: await refreshAssetReadUrl(comic.thumbnail),
    }))),
    Promise.all(panels.map(refreshPanelImages)),
  ]);

  return { comics: nextComics, chapters, panels: nextPanels };
};

export const createComic = async ({ name, thumbnailAssetId, createdBy }) => {
  const comicId = newId();
  const chapterId = newId();

  const { error: comicError } = await supabase.from('comics').insert({
    id: comicId,
    name,
    thumbnail_asset_id: thumbnailAssetId || null,
    created_by: createdBy || null,
  });
  if (comicError) throw new Error(comicError.message);

  const { error: chapterError } = await supabase.from('chapters').insert({
    id: chapterId,
    comic_id: comicId,
    name: 'Chapter 1',
    sort_order: 0,
  });
  if (chapterError) throw new Error(chapterError.message);

  if (thumbnailAssetId) {
    await supabase.from('panel_assets').update({ comic_id: comicId }).eq('id', thumbnailAssetId);
  }

  return { comicId, chapterId };
};

export const updateComic = async ({ id, name, thumbnailAssetId }) => {
  const patch = { name, updated_at: new Date().toISOString() };
  if (thumbnailAssetId !== undefined) patch.thumbnail_asset_id = thumbnailAssetId;

  const { error } = await supabase.from('comics').update(patch).eq('id', id);
  if (error) throw new Error(error.message);

  if (thumbnailAssetId) {
    await supabase.from('panel_assets').update({ comic_id: id }).eq('id', thumbnailAssetId);
  }
};

export const deleteComic = async (comicId) => {
  const { data: comicChapters } = await supabase.from('chapters').select('id').eq('comic_id', comicId);
  const chapterIds = (comicChapters || []).map((chapter) => chapter.id);

  if (chapterIds.length) {
    await supabase.from('panels').delete().in('chapter_id', chapterIds);
  }
  await supabase.from('chapters').delete().eq('comic_id', comicId);

  const { error } = await supabase.from('comics').delete().eq('id', comicId);
  if (error) throw new Error(error.message);
};

export const createChapter = async ({ comicId, name, sortOrder = 0 }) => {
  const id = newId();
  const { error } = await supabase.from('chapters').insert({
    id,
    comic_id: comicId,
    name,
    sort_order: sortOrder,
  });
  if (error) throw new Error(error.message);
  return { id };
};

export const deleteChapter = async (chapterId) => {
  await supabase.from('panels').delete().eq('chapter_id', chapterId);
  const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
  if (error) throw new Error(error.message);
};

export const createPanel = async (panel, assignees = []) => {
  const id = newId();
  const { error } = await supabase.from('panels').insert({
    id,
    chapter_id: panel.chapterId,
    stt: panel.stt,
    name: panel.name,
    sf_status: panel.styleFrame?.status || DEFAULT_STATUS,
    sf_assigned_to: nameToId(assignees, panel.styleFrame?.assignedTo),
    video_status: panel.video?.status || DEFAULT_STATUS,
    video_assigned_to: nameToId(assignees, panel.video?.assignedTo),
  });
  if (error) throw new Error(error.message);
  return { id };
};

export const updatePanel = async (panel, assignees = []) => {
  const { error } = await supabase.from('panels').update({
    stt: panel.stt,
    name: panel.name,
    sf_status: panel.styleFrame?.status || DEFAULT_STATUS,
    sf_assigned_to: nameToId(assignees, panel.styleFrame?.assignedTo),
    video_status: panel.video?.status || DEFAULT_STATUS,
    video_assigned_to: nameToId(assignees, panel.video?.assignedTo),
    updated_at: new Date().toISOString(),
  }).eq('id', panel.id);
  if (error) throw new Error(error.message);
};

export const deletePanel = async (panelId) => {
  const { error } = await supabase.from('panels').delete().eq('id', panelId);
  if (error) throw new Error(error.message);
};
