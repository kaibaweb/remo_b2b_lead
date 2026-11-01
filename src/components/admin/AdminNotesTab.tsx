'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from 'firebase/auth';
import type { MeetingNote } from '@/types/admin';
import {
  fetchNotesDirect,
  saveNoteDirect,
  deleteNoteDirect,
} from '@/lib/firestore-admin-client';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  Upload,
  Link as LinkIcon,
  ExternalLink,
  RefreshCw,
  Check,
} from 'lucide-react';

interface Props {
  user: User;
}

export function AdminNotesTab({ user }: Props) {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('일반');
  const [editContent, setEditContent] = useState('');
  const [editAttachments, setEditAttachments] = useState<MeetingNote['attachments']>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual one-shot fetch (0-cost caching: only fetches on initial load or Refresh click)
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchNotesDirect();
      setNotes(items);
      if (items.length > 0 && !selectedNote) {
        setSelectedNote(items[0]);
      }
    } catch (err) {
      console.error('[Fetch Notes Direct Error]', err);
    } finally {
      setLoading(false);
    }
  }, [selectedNote]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSelectNote = (note: MeetingNote) => {
    setSelectedNote(note);
    setIsEditing(false);
  };

  const handleStartCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedNote(null);
    setEditTitle('');
    setEditDate(today);
    setEditCategory('CHTF 2026');
    setEditContent('');
    setEditAttachments([]);
    setUploadError('');
    setIsEditing(true);
  };

  const handleStartEdit = () => {
    if (!selectedNote) return;
    setEditTitle(selectedNote.title);
    setEditDate(selectedNote.date || '');
    setEditCategory(selectedNote.category || '일반');
    setEditContent(selectedNote.content || '');
    setEditAttachments(selectedNote.attachments || []);
    setUploadError('');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      alert('회의록 제목을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const isUpdate = !!selectedNote?.id;
      const savedNote = await saveNoteDirect(
        {
          title: editTitle,
          date: editDate,
          category: editCategory,
          content: editContent,
          attachments: editAttachments,
        },
        selectedNote?.id,
        user.email || 'gitkaiba@gmail.com'
      );

      if (isUpdate) {
        setNotes((prev) => prev.map((n) => (n.id === savedNote.id ? savedNote : n)));
      } else {
        setNotes((prev) => [savedNote, ...prev]);
      }
      setSelectedNote(savedNote);
      setIsEditing(false);
    } catch (err: unknown) {
      console.error('[Save Note Error]', err);
      alert((err as Error).message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('이 회의록을 삭제하시겠습니까?')) return;
    try {
      await deleteNoteDirect(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('[Delete Note Error]', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 10MB File / Image upload handler (base64 encoded for instant storage and preview)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError('');

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit
    const newAttachments = [...(editAttachments || [])];

    Array.from(files).forEach((file) => {
      if (file.size > maxSizeBytes) {
        setUploadError(`'${file.name}' 파일이 제한 용량(10MB)을 초과했습니다.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultUrl = uploadEvent.target?.result as string;
        newAttachments.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: resultUrl,
        });
        setEditAttachments([...newAttachments]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setEditAttachments((prev) => (prev ? prev.filter((_, i) => i !== index) : []));
  };

  // Helper to parse content text and render clickable external links
  const renderFormattedText = (text: string) => {
    if (!text) return <p className="text-slate-500 italic">내용이 없습니다.</p>;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split('\n').map((line, lineIdx) => {
      const parts = line.split(urlRegex);
      return (
        <p key={lineIdx} className="mb-2 leading-relaxed text-slate-200 break-words">
          {parts.map((part, partIdx) => {
            if (part.match(urlRegex)) {
              return (
                <a
                  key={partIdx}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline font-medium mx-1"
                >
                  <span>{part}</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.content || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
      {/* LEFT PANEL: Notes List (4 cols) */}
      <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-[700px]">
        {/* Search & Actions */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            placeholder="회의록 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={fetchNotes}
            disabled={loading}
            title="새로고침 (캐시 재갱신)"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>작성</span>
          </button>
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs">회의록 로딩 중...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">등록된 회의록이 없습니다.</div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = selectedNote?.id === note.id && !isEditing;
              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-600 text-white shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                      {note.category || '일반'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{note.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{note.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{note.content || '내용 없음'}</p>
                  {note.attachments && note.attachments.length > 0 && (
                    <div className="mt-2 text-[10px] text-blue-400 font-medium flex items-center gap-1">
                      <FileText className="w-3 h-3" /> 첨부 {note.attachments.length}개
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Preview / Edit Window (8 cols) */}
      <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col h-[700px]">
        {isEditing ? (
          /* EDIT MODE */
          <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {selectedNote?.id ? '회의록 수정' : '신규 회의록 작성'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? '저장 중...' : '저장 완료'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">회의 제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="예: CHTF 2026 선전 파트너십 미팅"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">회의 일자</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">분류/태그</label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="예: CHTF 2026, 데이터 공급, 한국 총판/SI"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-[11px] text-slate-400 mb-1">
                회의 내용 (링크는 https:// 형태로 작성 시 자동 연결됩니다)
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="회의 주요 안건, 협의 사항, 링크 주소(URL) 등을 자유롭게 작성하세요..."
                className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed font-mono custom-scrollbar"
              />
            </div>

            {/* File / Image Upload (Max 10MB) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400">파일/이미지 첨부 (최대 10MB/파일)</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Upload className="w-3.5 h-3.5" /> 파일 추가
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </div>

              {uploadError && <p className="text-[11px] text-red-400 mb-2">{uploadError}</p>}

              {/* Attachments preview list */}
              {editAttachments && editAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {editAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                    >
                      {att.type.startsWith('image/') ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={att.url} alt={att.name} className="w-5 h-5 object-cover rounded" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-slate-300 max-w-[120px] truncate">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : selectedNote ? (
          /* PREVIEW MODE */
          <div className="flex flex-col h-full space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold">
                    {selectedNote.category || '일반'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{selectedNote.date}</span>
                </div>
                <h2 className="text-lg font-black text-white">{selectedNote.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> 수정
                </button>
                <button
                  onClick={() => handleDelete(selectedNote.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content view with clickable link parsing */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-sm font-sans">
              {renderFormattedText(selectedNote.content)}
            </div>

            {/* Attachments / Image Previews */}
            {selectedNote.attachments && selectedNote.attachments.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 mb-3">첨부 파일 ({selectedNote.attachments.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedNote.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2 group"
                    >
                      {att.type.startsWith('image/') ? (
                        <div className="relative w-full h-28 rounded-lg overflow-hidden bg-slate-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="h-28 flex items-center justify-center bg-slate-900 rounded-lg">
                          <FileText className="w-8 h-8 text-slate-500" />
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 truncate font-medium max-w-[130px]">{att.name}</span>
                        <a
                          href={att.url}
                          download={att.name}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          다운로드
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
            <FileText className="w-10 h-10 mb-3 text-slate-700" />
            <p>좌측 목록에서 회의록을 선택하거나 상단의 [+ 작성] 버튼을 눌러주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
