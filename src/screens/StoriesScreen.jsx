import { useMemo, useState } from 'react';
import { BookOpen, Plus, Save, Trash2 } from 'lucide-react';
import { Button, Field, TextInput, UploadSlot } from '../components/primitives.jsx';
import { getAssetUrl, uploadImageAsset } from '../lib/assets.js';

const blankStory = {
  name: '',
  thumbnail: null,
};

export default function StoriesScreen({
  comics,
  chapters,
  onCreateComic,
  onUpdateComic,
  onDeleteComic,
  onOpenComic,
}) {
  const [showForm, setShowForm] = useState(comics.length === 0);
  const [draft, setDraft] = useState(blankStory);
  const [error, setError] = useState('');

  const comicChapterCounts = useMemo(() => {
    return comics.reduce((map, comic) => {
      const comicChapters = chapters.filter((chapter) => chapter.comicId === comic.id);
      map[comic.id] = comicChapters.length;
      return map;
    }, {});
  }, [chapters, comics]);

  const createStory = () => {
    if (!draft.name.trim()) {
      setError('Please enter the comic name.');
      return;
    }

    if (!draft.thumbnail) {
      setError('Please add a thumbnail before creating the comic.');
      return;
    }

    onCreateComic({
      id: `comic-${Date.now()}`,
      name: draft.name.trim(),
      thumbnail: draft.thumbnail,
      updatedAt: 'Just created',
    });
    setDraft(blankStory);
    setError('');
    setShowForm(false);
  };

  return (
    <main className="gc-screen gc-stories">
      <header className="gc-stories-header">
        <div>
          <h1>Comic Library</h1>
          <p>Create a comic first, then open it to manage chapters and panels.</p>
        </div>
        <Button icon={Plus} label="New Comic" primary onClick={() => setShowForm(true)} />
      </header>

      {error && !showForm ? <div className="gc-error inline">{error}</div> : null}

      {showForm ? (
        <section className="gc-story-form-card">
          <div className="gc-story-form-head">
            <BookOpen size={18} />
            <div>
              <h2>New Comic</h2>
              <p>Name the story and add a thumbnail for quick recognition.</p>
            </div>
          </div>
          <div className="gc-story-form-grid">
            <Field label="Comic Name">
              <TextInput
                autoFocus
                value={draft.name}
                placeholder="Enter comic title..."
                onChange={(event) => {
                  setDraft({ ...draft, name: event.target.value });
                  setError('');
                }}
              />
            </Field>
            <Field label="Thumbnail">
              <UploadSlot
                image={draft.thumbnail}
                label="Drop cover image"
                onChange={(thumbnail) => setDraft({ ...draft, thumbnail })}
                onUploadFile={(file) => uploadImageAsset({
                  file,
                  stage: 'comic_thumbnail',
                  version: 'cover',
                })}
              />
            </Field>
          </div>
          {error ? <div className="gc-error inline">{error}</div> : null}
          <div className="gc-form-actions">
            <Button label="Cancel" onClick={() => {
              setDraft(blankStory);
              setError('');
              setShowForm(false);
            }} />
            <Button icon={Save} label="Create Comic" primary onClick={createStory} />
          </div>
        </section>
      ) : null}

      <section className="gc-comic-grid">
        {comics.map((comic) => {
          const chapterCount = comicChapterCounts[comic.id] || 0;
          return (
            <article
              className="gc-comic-card"
              key={comic.id}
              tabIndex={0}
              role="button"
              onClick={() => onOpenComic(comic.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpenComic(comic.id);
                }
              }}
            >
              <div className="gc-comic-thumb">
                {comic.thumbnail ? <img src={getAssetUrl(comic.thumbnail)} alt="" /> : (
                  <div className="gc-comic-thumb-empty">
                    <BookOpen size={24} />
                    <span>No thumbnail</span>
                  </div>
                )}
                <label className="gc-comic-thumb-upload" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="file"
                    accept="image/*"
                    onClick={(event) => event.stopPropagation()}
                    onChange={async (event) => {
                      event.stopPropagation();
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        const thumbnail = await uploadImageAsset({
                          file,
                          comicId: comic.id,
                          stage: 'comic_thumbnail',
                          version: 'cover',
                        });
                        onUpdateComic({ ...comic, thumbnail });
                        setError('');
                      } catch (uploadError) {
                        setError(uploadError instanceof Error ? uploadError.message : 'Could not upload thumbnail.');
                      } finally {
                        event.target.value = '';
                      }
                    }}
                  />
                  Change thumbnail
                </label>
                <Button
                  icon={Trash2}
                  label="Delete comic"
                  small
                  danger
                  className="gc-comic-delete"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteComic(comic);
                  }}
                />
              </div>
              <div className="gc-comic-card-body">
                <h2>{comic.name}</h2>
                <p>{chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}</p>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
