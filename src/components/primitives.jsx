import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minus, Move, Plus, RotateCcw, X } from 'lucide-react';
import { ROLE_COLORS, STATUS_COLORS } from '../data/seed.js';
import { getAssetName, getAssetUrl, isPreviewableAsset } from '../lib/assets.js';

const AVATAR_COLORS = [
  { bg: '#0f2040', tx: '#60a5fa' },
  { bg: '#042210', tx: '#22c55e' },
  { bg: '#200f38', tx: '#c084fc' },
  { bg: '#201000', tx: '#fbbf24' },
  { bg: '#041820', tx: '#22d3ee' },
];

const imageLabel = (image, fallback = 'Upload image') => {
  if (!image) return fallback;
  if (image === 'placeholder') return 'version uploaded';
  return getAssetName(image);
};

const isPreviewableImage = (image) => {
  return isPreviewableAsset(image);
};

const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const readDroppedImage = async (files, onChange, onUploadFile) => {
  const file = Array.from(files || []).find((item) => item.type.startsWith('image/'));
  if (!file) return;
  const image = onUploadFile ? await onUploadFile(file) : await fileToDataUrl(file);
  onChange(image, file);
};

export function Badge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.Done;

  return (
    <span
      className="gc-badge"
      style={{
        '--badge-bg': colors.bg,
        '--badge-bd': colors.bd,
        '--badge-tx': colors.tx,
      }}
    >
      <span className="gc-badge-dot" />
      {status}
    </span>
  );
}

export function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] || ROLE_COLORS.ARTIST;

  return (
    <span
      className="gc-role-badge"
      style={{
        '--role-color': color,
        '--role-bg': `${color}18`,
        '--role-bd': `${color}44`,
      }}
    >
      {role}
    </span>
  );
}

export function Avatar({ name = '?', size = 28 }) {
  const idx = (String(name).charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const color = AVATAR_COLORS[idx];

  return (
    <div
      className="gc-avatar"
      style={{
        '--avatar-size': `${size}px`,
        '--avatar-bg': color.bg,
        '--avatar-tx': color.tx,
      }}
      aria-hidden="true"
    >
      <span>{String(name)[0]?.toUpperCase() || '?'}</span>
    </div>
  );
}

export function Button({
  children,
  label,
  icon: Icon,
  primary = false,
  small = false,
  subtle = false,
  danger = false,
  className = '',
  type = 'button',
  ...props
}) {
  const classes = [
    'gc-btn',
    primary ? 'gc-btn-primary' : '',
    small ? 'gc-btn-small' : '',
    subtle ? 'gc-btn-subtle' : '',
    danger ? 'gc-btn-danger' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} type={type} {...props}>
      {Icon ? <Icon size={small ? 13 : 15} strokeWidth={2} /> : null}
      <span>{label || children}</span>
    </button>
  );
}

export function IconButton({ icon: Icon, label, className = '', ...props }) {
  return (
    <button className={`gc-icon-btn ${className}`} type="button" aria-label={label} title={label} {...props}>
      <Icon size={15} strokeWidth={2} />
    </button>
  );
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`gc-field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props) {
  return <input className="gc-input" {...props} />;
}

export function SelectInput({ children, ...props }) {
  return (
    <select className="gc-select" {...props}>
      {children}
    </select>
  );
}

export function ImageThumb({
  image,
  w,
  h,
  placeholder = '+',
  onChange,
  onUploadFile,
  onPreview,
  title = 'Drop image here',
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const realImage = isPreviewableImage(image);
  const hasImage = Boolean(image);
  const canUpload = Boolean(onChange);
  const imageUrl = getAssetUrl(image);

  const handleFiles = async (files) => {
    if (!canUpload || uploading) return;
    setUploading(true);
    setUploadError('');

    try {
      await readDroppedImage(files, onChange, onUploadFile);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = (event) => {
    event.stopPropagation();
    if (realImage && onPreview) {
      onPreview(image);
      return;
    }
    if (canUpload) inputRef.current?.click();
  };

  const handleDrop = async (event) => {
    if (!canUpload) return;
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    await handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      className={[
        'gc-img-thumb',
        hasImage ? 'has-image' : '',
        realImage ? 'has-real-image' : '',
        image === 'placeholder' ? 'has-placeholder-image' : '',
        canUpload ? 'can-upload' : '',
        dragging ? 'dragging' : '',
        uploading ? 'uploading' : '',
        uploadError ? 'has-upload-error' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--thumb-w': `${w || 54}px`, '--thumb-h': `${h || 36}px` }}
      onClick={handleClick}
      onDragEnter={(event) => {
        if (!canUpload) return;
        event.preventDefault();
        event.stopPropagation();
        setDragging(true);
      }}
      onDragOver={(event) => {
        if (!canUpload) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onDragLeave={(event) => {
        if (!canUpload) return;
        event.preventDefault();
        event.stopPropagation();
        setDragging(false);
      }}
      onDrop={handleDrop}
      title={realImage ? 'Click to zoom. Drop another image to replace.' : title}
    >
      {canUpload ? (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onClick={(event) => event.stopPropagation()}
          onChange={async (event) => {
            await handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
      ) : null}
      {realImage ? <img src={imageUrl} alt="" /> : null}
      {!hasImage ? <span>{uploading ? '...' : placeholder}</span> : null}
      {canUpload && !realImage ? <span className="gc-img-thumb-drop">{uploadError ? 'Retry' : uploading ? 'Uploading' : 'Drop'}</span> : null}
    </div>
  );
}

export function UploadSlot({ image, label, onChange, onUploadFile, onPreview, tall = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const realImage = isPreviewableImage(image);
  const imageUrl = getAssetUrl(image);

  const handleFiles = async (files) => {
    if (uploading) return;
    setUploading(true);
    setUploadError('');

    try {
      await readDroppedImage(files, onChange, onUploadFile);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = async (event) => {
    await handleFiles(event.target.files);
    event.target.value = '';
  };

  const handleClick = () => {
    if (realImage && onPreview) {
      onPreview(image);
      return;
    }
    inputRef.current?.click();
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    await handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      className={[
        'gc-upload-slot',
        image ? 'has-image' : '',
        realImage ? 'has-real-image' : '',
        image === 'placeholder' ? 'has-placeholder-image' : '',
        tall ? 'tall' : '',
        dragging ? 'dragging' : '',
        uploading ? 'uploading' : '',
        uploadError ? 'has-upload-error' : '',
      ].filter(Boolean).join(' ')}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(false);
      }}
      onDrop={handleDrop}
      title={realImage ? 'Click to zoom. Drop another image to replace.' : 'Click or drop an image here.'}
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} />
      {realImage ? <img src={imageUrl} alt="" /> : null}
      {!image ? <span className="gc-upload-plus">{uploading ? '...' : '+'}</span> : null}
      <span className="gc-upload-label">{uploadError || (uploading ? 'Uploading...' : label || imageLabel(image))}</span>
    </div>
  );
}

export function ImageZoomViewer({ image, title = 'Image Preview', onClose }) {
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const imageUrl = getAssetUrl(image);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });

  const fitToView = () => {
    const viewport = viewportRef.current;
    if (!viewport || !naturalSize.width || !naturalSize.height) return;
    const nextScale = Math.min(
      (viewport.clientWidth - 96) / naturalSize.width,
      (viewport.clientHeight - 96) / naturalSize.height,
      1,
    );
    setScale(Math.max(0.05, nextScale));
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    fitToView();
  }, [naturalSize.width, naturalSize.height]);

  const zoomAt = (clientX, clientY, nextScale) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const pointer = {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
    const ratio = nextScale / scale;
    setPosition((current) => ({
      x: pointer.x - (pointer.x - current.x) * ratio,
      y: pointer.y - (pointer.y - current.y) * ratio,
    }));
    setScale(nextScale);
  };

  const zoomBy = (factor) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const nextScale = Math.min(24, Math.max(0.03, scale * factor));
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, nextScale);
  };

  return (
    <div className="gc-zoom-backdrop" role="dialog" aria-modal="true">
      <div className="gc-zoom-toolbar">
        <div className="gc-zoom-title">
          <strong>{title}</strong>
          <span>{Math.round(scale * 100)}%</span>
        </div>
        <div className="gc-zoom-actions">
          <Button icon={Minus} label="Zoom out" small onClick={() => zoomBy(0.8)} />
          <Button icon={Plus} label="Zoom in" small onClick={() => zoomBy(1.25)} />
          <Button icon={RotateCcw} label="100%" small onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }} />
          <Button icon={Maximize2} label="Fit" small onClick={fitToView} />
          <Button icon={X} label="Close" small onClick={onClose} />
        </div>
      </div>

      <div
        ref={viewportRef}
        className="gc-zoom-viewport"
        onWheel={(event) => {
          event.preventDefault();
          const factor = event.deltaY > 0 ? 0.88 : 1.14;
          const nextScale = Math.min(24, Math.max(0.03, scale * factor));
          zoomAt(event.clientX, event.clientY, nextScale);
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: position.x,
            originY: position.y,
          };
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return;
          setPosition({
            x: dragRef.current.originX + event.clientX - dragRef.current.startX,
            y: dragRef.current.originY + event.clientY - dragRef.current.startY,
          });
        }}
        onPointerUp={(event) => {
          if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        onDoubleClick={fitToView}
      >
        <div className="gc-zoom-hint">
          <Move size={14} />
          Drag to pan. Scroll to zoom.
        </div>
        <img
          src={imageUrl}
          alt={title}
          draggable="false"
          onLoad={(event) => {
            setNaturalSize({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            });
          }}
          style={{
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
          }}
        />
      </div>
    </div>
  );
}

export function Modal({ title, subtitle, badge, onClose, children, footer, width = 900 }) {
  return (
    <div className="gc-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="gc-modal" style={{ '--modal-width': `${width}px` }} role="dialog" aria-modal="true">
        <header className="gc-modal-header">
          <div className="gc-modal-title-wrap">
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="gc-modal-header-actions">
            {badge}
            <Button icon={X} label="Close" small onClick={onClose} />
          </div>
        </header>
        <div className="gc-modal-body">{children}</div>
        {footer ? <footer className="gc-modal-footer">{footer}</footer> : null}
      </section>
    </div>
  );
}
