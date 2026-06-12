import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ImageUp,
  Plus,
  Save,
  Search,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Field,
  ImageThumb,
  ImageZoomViewer,
  Modal,
  SelectInput,
  TextInput,
  UploadSlot,
} from '../components/primitives.jsx';
import { ARTISTS, STATUS_VALUES } from '../data/seed.js';
import { isPreviewableAsset, uploadImageAsset } from '../lib/assets.js';
import { exportPanelsToCsv, makeNewPanel } from '../lib/panels.js';

const PAGE_SIZE = 14;
const TABLE_THUMB = { w: 204, h: 132 };
const TABLE_IMAGE = { w: 208, h: 156 };
const TABLE_ORIGIN_IMAGE = { w: 172, h: 218 };

const emptyAddDraft = {
  name: '',
  sfAssigned: 'Sora P',
  sfStatus: 'Review',
  sfOldImage: null,
  sfNewImage: null,
  vidAssigned: '',
  vidStatus: 'Review',
  vidOldImage: null,
  vidNewImage: null,
  originImage: null,
};

const isRealImage = (image) => {
  return isPreviewableAsset(image);
};

const trackerImageSize = (image, kind = 'stage') => {
  if (!isRealImage(image)) return TABLE_THUMB;
  return kind === 'origin' ? TABLE_ORIGIN_IMAGE : TABLE_IMAGE;
};

function StageSelects({ title, stage, onPatch, onPreview, onUploadFile }) {
  return (
    <section className="gc-stage-form">
      <h3>{title}</h3>
      <div className="gc-stage-top">
        <Field label="Assigned To">
          <SelectInput value={stage.assignedTo || ''} onChange={(event) => onPatch({ assignedTo: event.target.value })}>
            <option value="">Unassigned</option>
            {ARTISTS.map((artist) => <option key={artist} value={artist}>{artist}</option>)}
          </SelectInput>
        </Field>
        <Field label="Status" className="gc-stage-status">
          <SelectInput value={stage.status} onChange={(event) => onPatch({ status: event.target.value })}>
            {STATUS_VALUES.map((status) => <option key={status} value={status}>{status}</option>)}
          </SelectInput>
        </Field>
      </div>
      <div className="gc-upload-row">
        <Field label="Old Version">
          <UploadSlot
            image={stage.oldImage}
            label={stage.oldImage ? 'v1_original.jpg' : 'Upload image'}
            onChange={(image) => onPatch({ oldImage: image })}
            onUploadFile={(file) => onUploadFile(file, 'old')}
            onPreview={(image) => onPreview(image, `${title} - Old Version`)}
          />
        </Field>
        <Field label="New Version">
          <UploadSlot
            image={stage.newImage}
            label={stage.newImage ? 'v2_revised.jpg' : 'Drop or click to upload'}
            onChange={(image) => onPatch({ newImage: image })}
            onUploadFile={(file) => onUploadFile(file, 'new')}
            onPreview={(image) => onPreview(image, `${title} - New Version`)}
          />
        </Field>
      </div>
    </section>
  );
}

function PanelDetailModal({ panel, chapter, onClose, onSave, onPreview }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(panel)));

  const patchStage = (stageName, patch) => {
    setDraft((current) => ({
      ...current,
      [stageName]: {
        ...current[stageName],
        ...patch,
      },
    }));
  };

  return (
    <Modal
      title={draft.name}
      subtitle={`${chapter.name} - Panel #${draft.stt}`}
      badge={<Badge status={draft.styleFrame.status} />}
      onClose={onClose}
      footer={(
        <>
          <Button label="Cancel" onClick={onClose} />
          <Button
            icon={Save}
            label="Save Changes"
            primary
            onClick={() => onSave({ ...draft, updatedAt: Date.now() })}
          />
        </>
      )}
    >
      <div className="gc-panel-modal-layout">
        <aside className="gc-origin-column">
          <Field label="Origin Comic">
            <UploadSlot
              image={draft.originImage || 'placeholder'}
              label={draft.originImage ? 'origin image' : 'origin comic reference'}
              tall
              onChange={(image) => setDraft((current) => ({ ...current, originImage: image }))}
              onUploadFile={(file) => uploadImageAsset({
                file,
                comicId: chapter.comicId,
                chapterId: chapter.id,
                panelId: draft.id,
                stage: 'origin',
                version: 'origin',
              })}
              onPreview={(image) => onPreview(image, `${draft.name} - Origin Comic`)}
            />
          </Field>
          <Button
            icon={ImageUp}
            label="Replace"
            small
            className="gc-origin-replace"
            onClick={() => document.querySelector('.gc-origin-column input[type="file"]')?.click()}
          />
        </aside>

        <div className="gc-panel-stage-stack">
          <StageSelects
            title="Style Frame"
            stage={draft.styleFrame}
            onPatch={(patch) => patchStage('styleFrame', patch)}
            onUploadFile={(file, version) => uploadImageAsset({
              file,
              comicId: chapter.comicId,
              chapterId: chapter.id,
              panelId: draft.id,
              stage: 'style_frame',
              version,
            })}
            onPreview={(image, title) => onPreview(image, `${draft.name} - ${title}`)}
          />
          <StageSelects
            title="Video"
            stage={draft.video}
            onPatch={(patch) => patchStage('video', patch)}
            onUploadFile={(file, version) => uploadImageAsset({
              file,
              comicId: chapter.comicId,
              chapterId: chapter.id,
              panelId: draft.id,
              stage: 'video',
              version,
            })}
            onPreview={(image, title) => onPreview(image, `${draft.name} - ${title}`)}
          />
        </div>
      </div>
    </Modal>
  );
}

function AddPanelModal({ chapter, chapterPanels, onClose, onCreate, onPreview }) {
  const [draft, setDraft] = useState(emptyAddDraft);
  const nextStt = String(chapterPanels.length + 1).padStart(3, '0');
  const defaultPanelName = `MAGMEL_${chapter.name.replace(/\s+/g, '').toUpperCase()}_PANEL${nextStt}`;

  const patch = (value) => setDraft((current) => ({ ...current, ...value }));

  return (
    <Modal
      title="+ New Panel"
      subtitle={`${chapter.name} - Panel #${nextStt}`}
      width={760}
      onClose={onClose}
      footer={(
        <>
          <Button label="Cancel" onClick={onClose} />
          <Button
            icon={Plus}
            label="Create Panel"
            primary
            onClick={() => {
              onCreate(makeNewPanel(chapter.id, chapterPanels, { ...draft, name: draft.name.trim() || defaultPanelName }));
              onClose();
            }}
          />
        </>
      )}
    >
      <div className="gc-add-panel-form">
        <Field label="Panel Name">
          <TextInput
            value={draft.name}
            placeholder={defaultPanelName}
            onChange={(event) => patch({ name: event.target.value })}
          />
        </Field>
        <Field label="Origin Comic">
          <UploadSlot
            image={draft.originImage}
            label="Upload origin reference"
            onChange={(image) => patch({ originImage: image })}
            onUploadFile={(file) => uploadImageAsset({
              file,
              comicId: chapter.comicId,
              chapterId: chapter.id,
              stage: 'origin',
              version: 'origin',
            })}
            onPreview={(image) => onPreview(image, 'New Panel - Origin Comic')}
          />
        </Field>
        <div className="gc-add-panel-stages">
          <section className="gc-stage-form">
            <h3>Style Frame</h3>
            <Field label="Assigned To">
              <SelectInput value={draft.sfAssigned} onChange={(event) => patch({ sfAssigned: event.target.value })}>
                <option value="">Unassigned</option>
                {ARTISTS.map((artist) => <option key={artist} value={artist}>{artist}</option>)}
              </SelectInput>
            </Field>
            <Field label="Status">
              <SelectInput value={draft.sfStatus} onChange={(event) => patch({ sfStatus: event.target.value })}>
                {STATUS_VALUES.map((status) => <option key={status} value={status}>{status}</option>)}
              </SelectInput>
            </Field>
          </section>
          <section className="gc-stage-form">
            <h3>Video</h3>
            <Field label="Assigned To">
              <SelectInput value={draft.vidAssigned} onChange={(event) => patch({ vidAssigned: event.target.value })}>
                <option value="">Unassigned</option>
                {ARTISTS.map((artist) => <option key={artist} value={artist}>{artist}</option>)}
              </SelectInput>
            </Field>
            <Field label="Status">
              <SelectInput value={draft.vidStatus} onChange={(event) => patch({ vidStatus: event.target.value })}>
                {STATUS_VALUES.map((status) => <option key={status} value={status}>{status}</option>)}
              </SelectInput>
            </Field>
          </section>
        </div>
      </div>
    </Modal>
  );
}

export default function TrackerScreen({
  chapter,
  panels,
  onUpdatePanel,
  onCreatePanel,
}) {
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [artistFilter, setArtistFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);

  const chapterPanels = useMemo(() => {
    return panels.filter((panel) => panel.chapterId === chapter.id);
  }, [chapter.id, panels]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return chapterPanels.filter((panel) => {
      const statusMatch = statusFilter === 'All'
        || panel.styleFrame.status === statusFilter
        || panel.video.status === statusFilter;
      const artistMatch = artistFilter === 'All'
        || panel.styleFrame.assignedTo === artistFilter
        || panel.video.assignedTo === artistFilter;
      const searchMatch = !needle || panel.name.toLowerCase().includes(needle);

      return statusMatch && artistMatch && searchMatch;
    });
  }, [artistFilter, chapterPanels, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagePanels = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [artistFilter, search, statusFilter, chapter.id]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const openPreview = (image, title) => {
    if (!isPreviewableAsset(image) || image === 'placeholder') return;
    setPreviewImage({ image, title });
  };

  const updatePanelImage = (panel, patch) => {
    onUpdatePanel({ ...panel, ...patch, updatedAt: Date.now() });
  };

  const updateStageImage = (panel, stageName, key, image) => {
    onUpdatePanel({
      ...panel,
      [stageName]: {
        ...panel[stageName],
        [key]: image,
      },
      updatedAt: Date.now(),
    });
  };

  return (
    <main className="gc-tracker-screen">
      <div className="gc-tracker-toolbar">
        <div className="gc-tracker-title">
          <strong>{chapter.name}</strong>
          <span>- {filtered.length}/{chapterPanels.length} panels</span>
        </div>
        <div className="gc-toolbar-spacer" />
        <label className="gc-search-box">
          <Search size={14} />
          <TextInput placeholder="Search panel..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <SelectInput value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="All">All Status</option>
          {STATUS_VALUES.map((status) => <option key={status} value={status}>{status}</option>)}
        </SelectInput>
        <SelectInput value={artistFilter} onChange={(event) => setArtistFilter(event.target.value)}>
          <option value="All">All Artists</option>
          {ARTISTS.map((artist) => <option key={artist} value={artist}>{artist}</option>)}
        </SelectInput>
        <Button icon={Download} label="Export" onClick={() => exportPanelsToCsv(chapter, filtered)} />
        <Button icon={Plus} label="Panel" primary onClick={() => setShowAddPanel(true)} />
      </div>

      <div className="gc-table-wrap">
        <table className="gc-tracker-table">
          <colgroup>
            <col style={{ width: 44 }} />
            <col style={{ width: 216 }} />
            <col style={{ width: 220 }} />
            <col style={{ width: 96 }} />
            <col style={{ width: 224 }} />
            <col style={{ width: 224 }} />
            <col style={{ width: 104 }} />
            <col style={{ width: 96 }} />
            <col style={{ width: 224 }} />
            <col style={{ width: 224 }} />
            <col style={{ width: 104 }} />
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan="2">STT</th>
              <th rowSpan="2">Panel Name</th>
              <th rowSpan="2" className="center">Origin</th>
              <th colSpan="4" className="group">STYLE FRAME</th>
              <th colSpan="4" className="group">VIDEO</th>
              <th rowSpan="2" />
            </tr>
            <tr>
              {['Assigned', 'Old', 'New', 'Status', 'Assigned', 'Old', 'New', 'Status'].map((header, index) => (
                <th key={`${header}-${index}`} className={index === 4 ? 'split' : ''}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagePanels.map((panel, index) => (
              <tr key={panel.id} onClick={() => setSelectedPanel(panel)}>
                <td className="dim">{panel.stt}</td>
                <td className="panel-name">{panel.name}</td>
                <td className="center">
                  <ImageThumb
                    image={panel.originImage || 'placeholder'}
                    {...trackerImageSize(panel.originImage, 'origin')}
                    onChange={(image) => updatePanelImage(panel, { originImage: image })}
                    onUploadFile={(file) => uploadImageAsset({
                      file,
                      comicId: chapter.comicId,
                      chapterId: chapter.id,
                      panelId: panel.id,
                      stage: 'origin',
                      version: 'origin',
                    })}
                    onPreview={(image) => openPreview(image, `${panel.name} - Origin Comic`)}
                    title="Drop origin image here"
                  />
                </td>
                <td>
                  <div className="gc-assignee">
                    <Avatar name={panel.styleFrame.assignedTo} size={20} />
                    <span>{panel.styleFrame.assignedTo || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="center">
                  <ImageThumb
                    image={panel.styleFrame.oldImage}
                    {...trackerImageSize(panel.styleFrame.oldImage)}
                    onChange={(image) => updateStageImage(panel, 'styleFrame', 'oldImage', image)}
                    onUploadFile={(file) => uploadImageAsset({
                      file,
                      comicId: chapter.comicId,
                      chapterId: chapter.id,
                      panelId: panel.id,
                      stage: 'style_frame',
                      version: 'old',
                    })}
                    onPreview={(image) => openPreview(image, `${panel.name} - Style Frame Old`)}
                    title="Drop style frame old image here"
                  />
                </td>
                <td className="center">
                  <ImageThumb
                    image={panel.styleFrame.newImage}
                    {...trackerImageSize(panel.styleFrame.newImage)}
                    onChange={(image) => updateStageImage(panel, 'styleFrame', 'newImage', image)}
                    onUploadFile={(file) => uploadImageAsset({
                      file,
                      comicId: chapter.comicId,
                      chapterId: chapter.id,
                      panelId: panel.id,
                      stage: 'style_frame',
                      version: 'new',
                    })}
                    onPreview={(image) => openPreview(image, `${panel.name} - Style Frame New`)}
                    title="Drop style frame new image here"
                  />
                </td>
                <td><Badge status={panel.styleFrame.status} /></td>
                <td className="split">
                  {panel.video.assignedTo ? (
                    <div className="gc-assignee">
                      <Avatar name={panel.video.assignedTo} size={20} />
                      <span>{panel.video.assignedTo}</span>
                    </div>
                  ) : <span className="dim">-</span>}
                </td>
                <td className="center">
                  {panel.video.assignedTo ? (
                    <ImageThumb
                      image={panel.video.oldImage}
                      {...trackerImageSize(panel.video.oldImage)}
                      onChange={(image) => updateStageImage(panel, 'video', 'oldImage', image)}
                      onUploadFile={(file) => uploadImageAsset({
                        file,
                        comicId: chapter.comicId,
                        chapterId: chapter.id,
                        panelId: panel.id,
                        stage: 'video',
                        version: 'old',
                      })}
                      onPreview={(image) => openPreview(image, `${panel.name} - Video Old`)}
                      title="Drop video old image here"
                    />
                  ) : <span className="dim">-</span>}
                </td>
                <td className="center">
                  {panel.video.assignedTo ? (
                    <ImageThumb
                      image={panel.video.newImage}
                      {...trackerImageSize(panel.video.newImage)}
                      onChange={(image) => updateStageImage(panel, 'video', 'newImage', image)}
                      onUploadFile={(file) => uploadImageAsset({
                        file,
                        comicId: chapter.comicId,
                        chapterId: chapter.id,
                        panelId: panel.id,
                        stage: 'video',
                        version: 'new',
                      })}
                      onPreview={(image) => openPreview(image, `${panel.name} - Video New`)}
                      title="Drop video new image here"
                    />
                  ) : <span className="dim">-</span>}
                </td>
                <td><Badge status={panel.video.status} /></td>
                <td className="center action-dots">...</td>
              </tr>
            ))}
            {pagePanels.length === 0 ? (
              <tr>
                <td colSpan="12" className="gc-empty-cell">No panels match the current filter.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <footer className="gc-pagination">
        <span>Showing {pagePanels.length} of {filtered.length} panels</span>
        <div>
          <Button icon={ChevronLeft} label="Prev" small disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} />
          <span className="gc-page-count">{page}/{pageCount}</span>
          <Button icon={ChevronRight} label="Next" small disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} />
        </div>
      </footer>

      {selectedPanel ? (
        <PanelDetailModal
          panel={selectedPanel}
          chapter={chapter}
          onClose={() => setSelectedPanel(null)}
          onSave={(updated) => {
            onUpdatePanel(updated);
            setSelectedPanel(null);
          }}
          onPreview={openPreview}
        />
      ) : null}

      {showAddPanel ? (
        <AddPanelModal
          chapter={chapter}
          chapterPanels={chapterPanels}
          onClose={() => setShowAddPanel(false)}
          onCreate={onCreatePanel}
          onPreview={openPreview}
        />
      ) : null}

      {previewImage ? (
        <ImageZoomViewer
          image={previewImage.image}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      ) : null}
    </main>
  );
}
