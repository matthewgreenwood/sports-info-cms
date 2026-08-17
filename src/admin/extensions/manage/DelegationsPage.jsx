import React, { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

const DelegationsPage = () => {
  const { get, put } = useFetchClient();
  const [downloadState, setDownloadState] = useState('idle'); // 'idle' | 'loading' | 'error'
  const [downloadError, setDownloadError] = useState(null);

  // ── Delegation Members section ─────────────────────────────────────────────
  const [allMembers, setAllMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [allRoles, setAllRoles] = useState([]);
  const [editForms, setEditForms] = useState({});   // keyed by documentId
  const [savingMap, setSavingMap] = useState({});   // keyed by documentId: 'idle'|'saving'|'success'|'error'
  const [saveMsgMap, setSaveMsgMap] = useState({}); // keyed by documentId

  const [filterCountry, setFilterCountry] = useState('');
  const [filterSubmittedBy, setFilterSubmittedBy] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterEventStatus, setFilterEventStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 100;

  // ── Bulk selection / bulk status change ───────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkSaveMsg, setBulkSaveMsg] = useState(null);
  const [photoDownloadState, setPhotoDownloadState] = useState({});
  const [view, setView] = useState('members'); // 'members' | 'photos'

  const fetchAllMembers = () => {
    setMembersLoading(true);
    setMembersError(null);
    get(
      '/content-manager/collection-types/api::add-delegation-member.add-delegation-member' +
      '?pageSize=2000' +
      '&populate[role]=*' +
      '&populate[photo]=*' +
      '&sort=country:asc,surname:asc'
    )
      .then(({ data }) => setAllMembers(data?.results ?? data?.data ?? []))
      .catch(() => setMembersError('Failed to load delegation members.'))
      .finally(() => setMembersLoading(false));
  };

  useEffect(() => { fetchAllMembers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch accreditation roles for the role dropdown
  useEffect(() => {
    get('/content-manager/collection-types/api::accreditation-role.accreditation-role?pageSize=200&sort=accreditation_role:asc')
      .then(({ data }) => setAllRoles(data?.results ?? data?.data ?? []))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = (id, m) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Seed edit form with current record values on first open, keyed by documentId
        const docId = m.documentId;
        setEditForms((prev) => {
          if (prev[docId]) return prev;
          return {
            ...prev,
            [docId]: {
              first_name:           m.first_name ?? '',
              surname:              m.surname ?? '',
              date_of_birth:        m.date_of_birth ?? '',
              country:              m.country ?? '',
              role_doc_id:          m.role?.documentId ?? '',
              event_status:         m.event_status ?? 'Long List',
              passport_number:      m.passport_number ?? '',
              passport_expiry_date: m.passport_expiry_date ?? '',
              passport_nationality: m.passport_nationality ?? '',
            },
          };
        });
      }
      return next;
    });
  };

  const setFormField = (docId, field, value) => {
    setEditForms((prev) => ({ ...prev, [docId]: { ...prev[docId], [field]: value } }));
  };

  const handleSave = async (m) => {
    const docId = m.documentId;
    const form = editForms[docId] ?? {};
    setSavingMap((prev) => ({ ...prev, [docId]: 'saving' }));
    setSaveMsgMap((prev) => ({ ...prev, [docId]: null }));
    try {
      await put(
        `/content-manager/collection-types/api::add-delegation-member.add-delegation-member/${docId}`,
        {
          first_name:           form.first_name,
          surname:              form.surname,
          date_of_birth:        form.date_of_birth || null,
          country:              form.country,
          role:                 form.role_doc_id || null,
          event_status:         form.event_status,
          passport_number:      form.passport_number || null,
          passport_expiry_date: form.passport_expiry_date || null,
          passport_nationality: form.passport_nationality || null,
        }
      );
      // Update the local record so the row label reflects the saved values immediately
      setAllMembers((prev) => prev.map((rec) => {
        if (rec.documentId !== docId) return rec;
        const newRole = allRoles.find((r) => r.documentId === form.role_doc_id);
        return {
          ...rec,
          first_name:           form.first_name,
          surname:              form.surname,
          date_of_birth:        form.date_of_birth || null,
          country:              form.country,
          role:                 newRole ?? rec.role,
          event_status:         form.event_status,
          passport_number:      form.passport_number || null,
          passport_expiry_date: form.passport_expiry_date || null,
          passport_nationality: form.passport_nationality || null,
        };
      }));
      setSavingMap((prev) => ({ ...prev, [docId]: 'success' }));
      setSaveMsgMap((prev) => ({ ...prev, [docId]: 'Changes saved.' }));
      setTimeout(() => setSavingMap((prev) => ({ ...prev, [docId]: 'idle' })), 3000);
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Unknown error';
      setSavingMap((prev) => ({ ...prev, [docId]: 'error' }));
      setSaveMsgMap((prev) => ({ ...prev, [docId]: `Error: ${msg}` }));
    }
  };

  const handleBulkSave = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkSaving(true);
    setBulkSaveMsg(null);
    const idsToUpdate = [...selectedIds];
    const statusToApply = bulkStatus;
    const savedIds = new Set();   // tracks records where PUT succeeded
    let errorCount = 0;

    try {
      for (const docId of idsToUpdate) {
        const m = allMembers.find((rec) => rec.documentId === docId);
        if (!m) { errorCount++; continue; }

        // PUT — save the field change
        try {
          await put(
            `/content-manager/collection-types/api::add-delegation-member.add-delegation-member/${docId}`,
            {
              first_name:           m.first_name,
              surname:              m.surname,
              date_of_birth:        m.date_of_birth || null,
              country:              m.country,
              role:                 m.role?.documentId || null,
              event_status:         statusToApply,
              passport_number:      m.passport_number || null,
              passport_expiry_date: m.passport_expiry_date || null,
              passport_nationality: m.passport_nationality || null,
            }
          );
          savedIds.add(docId);
        } catch (putErr) {
          errorCount++;
        }
      }
    } catch (_outerErr) {
      // safety net — should not normally be reached
    }

    // Cleanup — always reached because all errors are caught above
    const successCount = savedIds.size;
    setAllMembers((prev) => prev.map((rec) =>
      savedIds.has(rec.documentId) ? { ...rec, event_status: statusToApply } : rec
    ));
    setSelectedIds(new Set());
    setBulkStatus('');
    setBulkSaving(false);
    if (errorCount === 0) {
      setBulkSaveMsg(`${successCount} record${successCount !== 1 ? 's' : ''} updated.`);
    } else {
      setBulkSaveMsg(`${successCount} updated, ${errorCount} failed.`);
    }
    setTimeout(() => setBulkSaveMsg(null), 4000);
  };

  const inputStyle = {
    background: '#212134', border: '1px solid #32324d', borderRadius: '4px',
    color: '#eaeaef', fontSize: '13px', padding: '6px 8px', width: '100%', boxSizing: 'border-box',
  };

  const EditRow = ({ label, children }) => (
    <div style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid #32324d', alignItems: 'center' }}>
      <div style={{ width: '180px', flexShrink: 0, fontSize: '12px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );

  const formatDate = (val) => {
    if (!val) return '—';
    try { return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return val; }
  };

  // Derived filter options
  const countryOptions = [...new Set(allMembers.map((m) => m.country).filter(Boolean))].sort();
  const submittedByOptions = [...new Set(allMembers.map((m) => m.submitted_by).filter(Boolean))].sort();
  const roleOptions = [...new Set(allMembers.map((m) => m.role?.accreditation_role).filter(Boolean))].sort();
  const EVENT_STATUS_OPTIONS = ['Long List', 'Delegation Member', 'Cancelled'];

  const filteredMembers = allMembers.filter((m) => {
    if (filterCountry && m.country !== filterCountry) return false;
    if (filterSubmittedBy && m.submitted_by !== filterSubmittedBy) return false;
    if (filterRole && (m.role?.accreditation_role ?? '') !== filterRole) return false;
    if (filterEventStatus && (m.event_status ?? 'Long List') !== filterEventStatus) return false;
    return true;
  });

  const allFilteredIds = filteredMembers.map((m) => m.documentId);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));
  const someSelected = allFilteredIds.some((id) => selectedIds.has(id)) && !allSelected;

  const hasFilters = filterCountry || filterSubmittedBy || filterRole || filterEventStatus;

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const pagedMembers = filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 whenever filters change
  const setFilterAndReset = (setter) => (e) => { setter(e.target.value); setCurrentPage(1); };

  const eventStatusBadge = (status) => {
    const s = status || 'Long List';
    const color = s === 'Delegation Member' ? { bg: '#1a3a28', text: '#5cb87a', border: '#2e6645' }
                : s === 'Cancelled'         ? { bg: '#3a1a1a', text: '#ee5e52', border: '#6e2a2a' }
                :                             { bg: '#1a1a3a', text: '#7b79ff', border: '#32327a' };
    return (
      <span style={{
        fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px',
        background: color.bg, color: color.text, border: `1px solid ${color.border}`,
      }}>{s}</span>
    );
  };

  const filterSelectStyle = {
    background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px',
    color: '#fff', fontSize: '13px', padding: '7px 10px', cursor: 'pointer', minWidth: '180px',
  };

  const resolvePhotoUrl = (photo) => {
    if (!photo) return null;
    const raw = photo?.formats?.thumbnail?.url ?? photo?.url ?? null;
    if (!raw) return null;
    return raw.startsWith('http') ? raw : window.location.origin + raw;
  };

  const MemberDetailRow = ({ label, value }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid #32324d' }}>
        <div style={{ width: '180px', flexShrink: 0, fontSize: '12px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '2px' }}>{label}</div>
        <div style={{ fontSize: '14px', color: '#eaeaef', wordBreak: 'break-word' }}>{String(value)}</div>
      </div>
    );
  };

  const handleDownloadAllPhotos = async () => {
    setDownloadState('loading');
    setDownloadError(null);
    try {
      const { data } = await get('/api/photos/download-archive');
      if (!data?.url) throw new Error('No download URL returned.');
      // Open in a new tab — the signed Cloudinary URL triggers a zip download.
      // window.open() returns immediately so we keep the spinner visible for a
      // few seconds to reflect that the browser is still preparing the archive.
      window.open(data.url, '_blank', 'noopener,noreferrer');
      setTimeout(() => setDownloadState('idle'), 4000);
    } catch (err) {
      setDownloadError(err?.message ?? 'Failed to generate download link.');
      setDownloadState('error');
    }
  };

  const handleDownloadMemberPhotos = async (member) => {
    const photo = member.photo;
    if (!photo) return;

    const photoUrls = [
      ['original', photo.url],
      ...Object.entries(photo.formats ?? {}).map(([size, format]) => [size, format?.url]),
    ].filter(([, url]) => url);
    const uniquePhotoUrls = [...new Map(photoUrls.map(([size, url]) => [url, [size, url]])).values()];
    const memberId = member.documentId;
    const name = `${member.first_name ?? 'member'}-${member.surname ?? 'photo'}`
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    setPhotoDownloadState((prev) => ({ ...prev, [memberId]: 'loading' }));
    try {
      for (const [size, rawUrl] of uniquePhotoUrls) {
        const url = rawUrl.startsWith('http') ? rawUrl : window.location.origin + rawUrl;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Unable to download ${size} image.`);
        const blobUrl = URL.createObjectURL(await response.blob());
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${name}-${size}${url.match(/\.[a-z0-9]+(?:\?|$)/i)?.[0].replace('?', '') ?? ''}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
      }
      setPhotoDownloadState((prev) => ({ ...prev, [memberId]: 'success' }));
    } catch (err) {
      setPhotoDownloadState((prev) => ({ ...prev, [memberId]: 'error' }));
      setDownloadError(err?.message ?? 'Failed to download member photos.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', margin: 0 }}>
          Delegations
        </h1>
        {view === 'members' && (
          <button
            onClick={fetchAllMembers}
            style={{ background: '#4945ff', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
          >
            Refresh
          </button>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '28px', borderBottom: '2px solid #32324d' }}>
        {[
          { key: 'members', label: 'Delegation Members' },
          { key: 'photos',  label: 'Photos' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            style={{
              background: 'none', border: 'none',
              borderBottom: view === key ? '2px solid #7b79ff' : '2px solid transparent',
              marginBottom: '-2px', color: view === key ? '#7b79ff' : '#a5a5ba',
              fontSize: '14px', fontWeight: view === key ? '600' : '400',
              padding: '8px 20px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {label}
            {key === 'members' && !membersLoading && (
              <span style={{ marginLeft: '6px', fontSize: '11px', color: view === 'members' ? '#7b79ff' : '#8e8ea0' }}>({allMembers.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Delegation Members tab ────────────────────────────────────────── */}
      {view === 'members' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Country</div>
              <select value={filterCountry} onChange={setFilterAndReset(setFilterCountry)} style={filterSelectStyle}>
                <option value="">All Countries</option>
                {countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Submitted By</div>
              <select value={filterSubmittedBy} onChange={setFilterAndReset(setFilterSubmittedBy)} style={filterSelectStyle}>
                <option value="">All Submitters</option>
                {submittedByOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Role</div>
              <select value={filterRole} onChange={setFilterAndReset(setFilterRole)} style={filterSelectStyle}>
                <option value="">All Roles</option>
                {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Event Status</div>
              <select value={filterEventStatus} onChange={setFilterAndReset(setFilterEventStatus)} style={filterSelectStyle}>
                <option value="">All Statuses</option>
                {EVENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {hasFilters && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={() => { setFilterCountry(''); setFilterSubmittedBy(''); setFilterRole(''); setFilterEventStatus(''); setCurrentPage(1); }}
                  style={{ background: 'none', border: '1px solid #32324d', borderRadius: '6px', color: '#a5a5ba', fontSize: '13px', padding: '7px 12px', cursor: 'pointer' }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* ── Bulk Actions ─────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
            padding: '12px 16px', background: '#181826', border: '1px solid #32324d',
            borderRadius: '6px', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '12px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'No records selected'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <label style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Status</label>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="">— Select —</option>
                {EVENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button
              onClick={handleBulkSave}
              disabled={bulkSaving || !bulkStatus || selectedIds.size === 0}
              style={{
                background: bulkSaving ? '#32324d' : '#4945ff',
                border: 'none', borderRadius: '6px', color: '#fff',
                fontSize: '13px', fontWeight: '600', padding: '8px 18px',
                cursor: (bulkSaving || !bulkStatus || selectedIds.size === 0) ? 'not-allowed' : 'pointer',
                opacity: (bulkSaving || !bulkStatus || selectedIds.size === 0) ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              {bulkSaving ? 'Saving…' : 'Save Changes'}
            </button>
            {bulkSaveMsg && (
              <span style={{ fontSize: '13px', color: bulkSaveMsg.includes('failed') ? '#ee5e52' : '#5cb87a' }}>{bulkSaveMsg}</span>
            )}
          </div>

          {membersLoading && <p style={{ color: '#a5a5ba', fontSize: '14px' }}>Loading…</p>}
        {membersError && <p style={{ color: '#ee5e52', fontSize: '14px' }}>{membersError}</p>}

        {!membersLoading && !membersError && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ color: '#a5a5ba', fontSize: '13px', margin: 0 }}>
                {filteredMembers.length} record{filteredMembers.length !== 1 ? 's' : ''}{hasFilters ? ' (filtered)' : ''}
                {totalPages > 1 && (
                  <span style={{ color: '#8e8ea0' }}> — page {currentPage} of {totalPages}</span>
                )}
              </p>
            </div>

            {filteredMembers.length === 0 ? (
              <p style={{ color: '#a5a5ba', fontSize: '14px' }}>No records match the selected filters.</p>
            ) : (
              <div>
                {/* Header row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '28px 2fr 1.5fr 1.5fr 1.5fr 1.2fr 1fr',
                  gap: '8px', padding: '8px 16px', background: '#212134',
                  borderRadius: '6px 6px 0 0', border: '1px solid #32324d', borderBottom: 'none',
                  alignItems: 'center',
                }}>
                  <div>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={() => {
                        if (allSelected) {
                          setSelectedIds(new Set());
                        } else {
                          setSelectedIds(new Set(allFilteredIds));
                        }
                      }}
                      style={{ cursor: 'pointer', accentColor: '#7b79ff' }}
                    />
                  </div>
                  {['Name', 'Country', 'Role', 'Submitted By', 'Event Status', ''].map((h) => (
                    <div key={h} style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>{h}</div>
                  ))}
                </div>

                {pagedMembers.map((m, idx) => {
                  const key = m.id ?? m.documentId;
                  const isExpanded = expandedIds.has(key);
                  const isLast = idx === pagedMembers.length - 1;
                  return (
                    <div key={key} style={{ border: '1px solid #32324d', borderTop: 'none', borderRadius: isLast && !isExpanded ? '0 0 6px 6px' : '0', background: '#1e1e2e' }}>
                      <div
                        style={{ display: 'grid', gridTemplateColumns: '28px 2fr 1.5fr 1.5fr 1.5fr 1.2fr 1fr', gap: '8px', padding: '12px 16px', cursor: 'pointer', alignItems: 'center' }}
                        onClick={() => toggleExpand(key, m)}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(m.documentId)}
                            onChange={(e) => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) { next.add(m.documentId); } else { next.delete(m.documentId); }
                                return next;
                              });
                            }}
                            style={{ cursor: 'pointer', accentColor: '#7b79ff' }}
                          />
                        </div>
                        <div style={{ color: '#eaeaef', fontSize: '14px', fontWeight: '500' }}>{m.first_name} {m.surname}</div>
                        <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{m.country || '—'}</div>
                        <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{m.role?.accreditation_role || '—'}</div>
                        <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{m.submitted_by || '—'}</div>
                        <div>{eventStatusBadge(m.event_status)}</div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '18px', color: '#7b79ff', lineHeight: 1 }}>{isExpanded ? '▾' : '▸'}</span>
                        </div>
                      </div>
                      {isExpanded && (() => {
                        const docId = m.documentId;
                        const form = editForms[docId] ?? {};
                        const saveState = savingMap[docId] ?? 'idle';
                        const saveMsg = saveMsgMap[docId];
                        const isSaving = saveState === 'saving';
                        return (
                          <div style={{ padding: '16px 20px 20px', borderTop: '1px solid #32324d', background: '#181826' }}>
                            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                              {/* Photo */}
                              {resolvePhotoUrl(m.photo) && (
                                <div style={{ flexShrink: 0 }}>
                                  <div style={{ fontSize: '11px', color: '#7b79ff', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '10px' }}>Photo</div>
                                  <img
                                    src={resolvePhotoUrl(m.photo)}
                                    alt={`${m.first_name} ${m.surname}`}
                                    style={{ width: '100px', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #32324d' }}
                                  />
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDownloadMemberPhotos(m); }}
                                    disabled={photoDownloadState[m.documentId] === 'loading'}
                                    style={{ display: 'block', marginTop: '8px', background: '#32324d', border: '1px solid #4945ff', borderRadius: '4px', color: '#eaeaef', fontSize: '11px', padding: '5px 8px', cursor: photoDownloadState[m.documentId] === 'loading' ? 'default' : 'pointer', opacity: photoDownloadState[m.documentId] === 'loading' ? 0.6 : 1, whiteSpace: 'nowrap' }}
                                    title="Download the original image and all available image sizes"
                                  >
                                    {photoDownloadState[m.documentId] === 'loading' ? 'Downloading...' : photoDownloadState[m.documentId] === 'success' ? 'Downloaded' : 'Download'}
                                  </button>
                                </div>
                              )}
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>

                              {/* ── Personal Details ── */}
                              <div>
                                <div style={{ fontSize: '11px', color: '#7b79ff', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '10px' }}>Personal Details</div>
                                <EditRow label="First Name">
                                  <input style={inputStyle} value={form.first_name ?? ''} onChange={(e) => setFormField(docId, 'first_name', e.target.value)} />
                                </EditRow>
                                <EditRow label="Surname">
                                  <input style={inputStyle} value={form.surname ?? ''} onChange={(e) => setFormField(docId, 'surname', e.target.value)} />
                                </EditRow>
                                <EditRow label="Date of Birth">
                                  <input type="date" style={inputStyle} value={form.date_of_birth ?? ''} onChange={(e) => setFormField(docId, 'date_of_birth', e.target.value)} />
                                </EditRow>
                                <EditRow label="Country">
                                  <input style={inputStyle} value={form.country ?? ''} onChange={(e) => setFormField(docId, 'country', e.target.value)} />
                                </EditRow>
                                <EditRow label="Role">
                                  <select style={inputStyle} value={form.role_doc_id ?? ''} onChange={(e) => setFormField(docId, 'role_doc_id', e.target.value)}>
                                    <option value="">— No Role —</option>
                                    {allRoles.map((r) => (
                                      <option key={r.documentId} value={r.documentId}>{r.accreditation_role}</option>
                                    ))}
                                  </select>
                                </EditRow>
                                <EditRow label="Event Status">
                                  <select style={inputStyle} value={form.event_status ?? 'Long List'} onChange={(e) => setFormField(docId, 'event_status', e.target.value)}>
                                    {['Long List', 'Delegation Member', 'Cancelled'].map((s) => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </EditRow>
                                <MemberDetailRow label="Submitted By" value={m.submitted_by} />
                                <MemberDetailRow label="Submitted By Email" value={m.submitted_by_email} />
                              </div>

                              {/* ── Passport & Visa ── */}
                              <div>
                                <div style={{ fontSize: '11px', color: '#7b79ff', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '10px' }}>Passport &amp; Visa</div>
                                <EditRow label="Passport Number">
                                  <input style={inputStyle} value={form.passport_number ?? ''} onChange={(e) => setFormField(docId, 'passport_number', e.target.value)} />
                                </EditRow>
                                <EditRow label="Passport Expiry">
                                  <input type="date" style={inputStyle} value={form.passport_expiry_date ?? ''} onChange={(e) => setFormField(docId, 'passport_expiry_date', e.target.value)} />
                                </EditRow>
                                <EditRow label="Passport Nationality">
                                  <input style={inputStyle} value={form.passport_nationality ?? ''} onChange={(e) => setFormField(docId, 'passport_nationality', e.target.value)} />
                                </EditRow>
                                <MemberDetailRow label="Visa Letter Requested" value={m.visa_letter_requested ? 'Yes' : 'No'} />
                                <MemberDetailRow label="Visa Request Approved" value={m.approve_visa_request == null ? null : m.approve_visa_request ? 'Yes' : 'No'} />
                                <MemberDetailRow label="Letter Sent" value={m.visa_letter_sent ? 'Yes' : 'No'} />
                                <MemberDetailRow label="Letter Sent At" value={m.visa_letter_sent_at ? formatDate(m.visa_letter_sent_at) : null} />
                                {m.visa_pdf_file && (
                                  <div style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid #32324d' }}>
                                    <div style={{ width: '180px', flexShrink: 0, fontSize: '12px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '2px' }}>Visa PDF File</div>
                                    <div style={{ fontSize: '14px' }}><a href={m.visa_pdf_file} target="_blank" rel="noopener noreferrer" style={{ color: '#7b79ff', textDecoration: 'underline' }}>View PDF</a></div>
                                  </div>
                                )}
                              </div>
                            </div>
                            </div>

                            {/* ── Save button ── */}
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #32324d', display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSave(m); }}
                                disabled={isSaving}
                                style={{
                                  background: saveState === 'success' ? '#328048' : saveState === 'error' ? '#b72b2b' : '#4945ff',
                                  border: 'none', borderRadius: '6px', color: '#fff',
                                  fontSize: '13px', fontWeight: '600', padding: '8px 20px',
                                  cursor: isSaving ? 'default' : 'pointer', opacity: isSaving ? 0.7 : 1,
                                }}
                              >
                                {isSaving ? 'Saving…' : saveState === 'success' ? 'Saved!' : 'Save Changes'}
                              </button>
                              {saveMsg && (
                                <span style={{ fontSize: '13px', color: saveState === 'error' ? '#ee5e52' : '#5cb87a' }}>{saveMsg}</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid #32324d' }}>
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      style={{ background: 'none', border: '1px solid #32324d', borderRadius: '4px', color: currentPage === 1 ? '#4a4a6a' : '#a5a5ba', fontSize: '13px', padding: '5px 10px', cursor: currentPage === 1 ? 'default' : 'pointer' }}
                    >«</button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{ background: 'none', border: '1px solid #32324d', borderRadius: '4px', color: currentPage === 1 ? '#4a4a6a' : '#a5a5ba', fontSize: '13px', padding: '5px 10px', cursor: currentPage === 1 ? 'default' : 'pointer' }}
                    >‹</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '...' ? (
                          <span key={`ellipsis-${i}`} style={{ color: '#4a4a6a', fontSize: '13px', padding: '0 4px' }}>…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            style={{
                              background: p === currentPage ? '#4945ff' : 'none',
                              border: '1px solid', borderColor: p === currentPage ? '#4945ff' : '#32324d',
                              borderRadius: '4px', color: p === currentPage ? '#fff' : '#a5a5ba',
                              fontSize: '13px', padding: '5px 10px', cursor: 'pointer', minWidth: '34px',
                            }}
                          >{p}</button>
                        )
                      )
                    }
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{ background: 'none', border: '1px solid #32324d', borderRadius: '4px', color: currentPage === totalPages ? '#4a4a6a' : '#a5a5ba', fontSize: '13px', padding: '5px 10px', cursor: currentPage === totalPages ? 'default' : 'pointer' }}
                    >›</button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      style={{ background: 'none', border: '1px solid #32324d', borderRadius: '4px', color: currentPage === totalPages ? '#4a4a6a' : '#a5a5ba', fontSize: '13px', padding: '5px 10px', cursor: currentPage === totalPages ? 'default' : 'pointer' }}
                    >»</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* ── Photos tab ───────────────────────────────────────────────────── */}
      {view === 'photos' && (
        <div style={{ background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '8px', padding: '20px 24px', maxWidth: '520px' }}>
          <p style={{ color: '#a5a5ba', fontSize: '14px', marginBottom: '16px', marginTop: 0 }}>
            Download all delegation member photos as a zip archive.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleDownloadAllPhotos}
              disabled={downloadState === 'loading'}
              style={{
                background: downloadState === 'loading' ? '#32324d' : '#7b79ff',
                border: 'none', borderRadius: '6px', color: '#fff',
                cursor: downloadState === 'loading' ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: '600', padding: '9px 18px',
                opacity: downloadState === 'loading' ? 0.7 : 1,
              }}
            >
              Download All
            </button>
            {downloadState === 'loading' && (
              <svg
                width="18" height="18" viewBox="0 0 18 18"
                style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <circle cx="9" cy="9" r="7" fill="none" stroke="#32324d" strokeWidth="2.5" />
                <path d="M9 2 A7 7 0 0 1 16 9" fill="none" stroke="#7b79ff" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
          {downloadState === 'error' && downloadError && (
            <p style={{ color: '#ee5e52', fontSize: '13px', marginTop: '10px', marginBottom: 0 }}>
              {downloadError}
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default DelegationsPage;
