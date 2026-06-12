import { supabase } from './supabase.js';

const SIGNED_URL_REFRESH_WINDOW_MS = 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getFunctionErrorMessage = async (error) => {
  if (error?.context instanceof Response) {
    const payload = await error.context.clone().json().catch(() => null);
    return payload?.error || payload?.message || error.message;
  }

  return error?.message || 'Request failed.';
};

const invokeFunction = async (name, body) => {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(await getFunctionErrorMessage(error));
  return data;
};

const asRemoteId = (value) => {
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : undefined;
};

export const getAssetUrl = (asset) => {
  if (!asset) return '';
  if (typeof asset === 'string') return asset;
  return asset.readUrl || asset.url || '';
};

export const getAssetName = (asset, fallback = 'image uploaded') => {
  if (!asset) return fallback;
  if (asset === 'placeholder') return 'version uploaded';
  if (typeof asset === 'object' && asset.name) return asset.name;
  return fallback;
};

export const isPreviewableAsset = (asset) => {
  const url = getAssetUrl(asset);
  return Boolean(url)
    && url !== 'placeholder'
    && (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:'));
};

export const isR2Asset = (asset) => {
  return Boolean(asset && typeof asset === 'object' && asset.type === 'r2' && (asset.assetId || asset.r2Key));
};

export const uploadImageAsset = async ({
  file,
  comicId,
  chapterId,
  panelId,
  stage,
  version,
}) => {
  if (!file) throw new Error('No file selected.');
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');

  const form = new FormData();
  form.append('file', file);
  form.append('stage', stage);
  form.append('version', version);

  const remoteComicId = asRemoteId(comicId);
  const remoteChapterId = asRemoteId(chapterId);
  const remotePanelId = asRemoteId(panelId);

  if (remoteComicId) form.append('comic_id', remoteComicId);
  if (remoteChapterId) form.append('chapter_id', remoteChapterId);
  if (remotePanelId) form.append('panel_id', remotePanelId);

  const finalized = await invokeFunction('upload-asset', form);

  const asset = finalized?.asset;
  if (!asset?.id) throw new Error('Uploaded asset was not recorded.');

  return {
    type: 'r2',
    assetId: asset.id,
    r2Key: asset.r2_key,
    readUrl: finalized.readUrl,
    expiresAt: Date.now() + ((finalized.expiresIn || 3600) * 1000),
    name: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    stage,
    version,
    localComicId: comicId,
    localChapterId: chapterId,
    localPanelId: panelId,
  };
};

export const refreshAssetReadUrl = async (asset) => {
  if (!isR2Asset(asset)) return asset;

  if (
    asset.readUrl
    && asset.expiresAt
    && Number(asset.expiresAt) - Date.now() > SIGNED_URL_REFRESH_WINDOW_MS
  ) {
    return asset;
  }

  const read = await invokeFunction('create-r2-read-url', {
    asset_id: asset.assetId,
    r2_key: asset.assetId ? undefined : asset.r2Key,
  });

  if (!read?.readUrl) return asset;

  return {
    ...asset,
    readUrl: read.readUrl,
    expiresAt: Date.now() + ((read.expiresIn || 3600) * 1000),
  };
};

export const refreshComicAssetUrls = async (comic) => {
  return {
    ...comic,
    thumbnail: await refreshAssetReadUrl(comic.thumbnail),
  };
};

export const refreshPanelAssetUrls = async (panel) => {
  return {
    ...panel,
    originImage: await refreshAssetReadUrl(panel.originImage),
    styleFrame: {
      ...panel.styleFrame,
      oldImage: await refreshAssetReadUrl(panel.styleFrame?.oldImage),
      newImage: await refreshAssetReadUrl(panel.styleFrame?.newImage),
    },
    video: {
      ...panel.video,
      oldImage: await refreshAssetReadUrl(panel.video?.oldImage),
      newImage: await refreshAssetReadUrl(panel.video?.newImage),
    },
  };
};
