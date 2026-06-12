export const getPanelStageStatus = (panel) => {
  const statuses = [panel.styleFrame.status, panel.video.status];
  if (statuses.includes('Rejected')) return 'Rejected';
  if (statuses.includes('Review')) return 'Review';
  if (statuses.includes('In Progress')) return 'In Progress';
  if (statuses.every((status) => status === 'Approved' || status === 'Done')) return 'Approved';
  return 'In Progress';
};

export const getChapterStats = (panels) => {
  const stats = {
    total: panels.length,
    Approved: 0,
    'In Progress': 0,
    Review: 0,
    Rejected: 0,
  };

  panels.forEach((panel) => {
    const status = getPanelStageStatus(panel);
    if (stats[status] !== undefined) stats[status] += 1;
  });

  return stats;
};

export const getChapterProgress = (panels) => {
  const stats = getChapterStats(panels);
  const total = stats.total || 1;

  return {
    stats,
    approvedPct: Math.round((stats.Approved / total) * 100),
    progressPct: Math.round((stats['In Progress'] / total) * 100),
    reviewPct: Math.round((stats.Review / total) * 100),
    rejectedPct: Math.round((stats.Rejected / total) * 100),
  };
};

export const makeNewPanel = (chapterId, currentPanels, draft) => {
  const nextNumber = currentPanels.length + 1;
  const stt = String(nextNumber).padStart(3, '0');
  const chapterNumber = chapterId.split('-').at(-1) || '1';

  return {
    id: `${chapterId}-panel-${Date.now()}`,
    chapterId,
    stt,
    name: draft.name || `MAGMEL_CHAP${chapterNumber}_PANEL${stt}`,
    originImage: draft.originImage || null,
    styleFrame: {
      assignedTo: draft.sfAssigned || '',
      status: draft.sfStatus || 'Review',
      oldImage: draft.sfOldImage || null,
      newImage: draft.sfNewImage || null,
    },
    video: {
      assignedTo: draft.vidAssigned || '',
      status: draft.vidStatus || 'Review',
      oldImage: draft.vidOldImage || null,
      newImage: draft.vidNewImage || null,
    },
    updatedAt: Date.now(),
  };
};

export const exportPanelsToCsv = (chapter, panels) => {
  const headers = [
    'STT',
    'Panel Name',
    'Style Assigned',
    'Style Status',
    'Style Old Image',
    'Style New Image',
    'Video Assigned',
    'Video Status',
    'Video Old Image',
    'Video New Image',
  ];

  const rows = panels.map((panel) => [
    panel.stt,
    panel.name,
    panel.styleFrame.assignedTo || '',
    panel.styleFrame.status,
    panel.styleFrame.oldImage ? 'yes' : 'no',
    panel.styleFrame.newImage ? 'yes' : 'no',
    panel.video.assignedTo || '',
    panel.video.status,
    panel.video.oldImage ? 'yes' : 'no',
    panel.video.newImage ? 'yes' : 'no',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${chapter.name.toLowerCase().replace(/\s+/g, '-')}-panels.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};
