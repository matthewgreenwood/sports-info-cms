import React, { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

const VisaInvitationsPage = () => {
  const { get, put, post } = useFetchClient();

  // ── Pending (not yet sent) ─────────────────────────────────────────────────
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [sendingState, setSendingState] = useState({});

  // ── History (already sent) ─────────────────────────────────────────────────
  const [historyAll, setHistoryAll] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [historyExpandedIds, setHistoryExpandedIds] = useState(new Set());
  const [historyFilterCountry, setHistoryFilterCountry] = useState('');
  const [historyFilterSubmittedBy, setHistoryFilterSubmittedBy] = useState('');
  const [historyFilterOutcome, setHistoryFilterOutcome] = useState('');
  const [view, setView] = useState('current'); // 'current' | 'previous'

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchMembers = () => {
    setLoading(true);
    setError(null);
    get(
      '/content-manager/collection-types/api::add-delegation-member.add-delegation-member' +
      '?pageSize=1000' +
      '&filters[visa_letter_requested][$eq]=true' +
      '&filters[visa_letter_sent][$ne]=true' +
      '&populate[role]=*' +
      '&sort=country:asc,surname:asc'
    )
      .then(({ data }) => setMembers(data?.results ?? data?.data ?? []))
      .catch(() => setError('Failed to load visa invitation requests.'))
      .finally(() => setLoading(false));
  };

  const fetchHistory = () => {
    setHistoryLoading(true);
    setHistoryError(null);
    get(
      '/content-manager/collection-types/api::add-delegation-member.add-delegation-member' +
      '?pageSize=1000' +
      '&filters[visa_letter_sent][$eq]=true' +
      '&populate[role]=*' +
      '&sort=visa_letter_sent_at:desc'
    )
      .then(({ data }) => setHistoryAll(data?.results ?? data?.data ?? []))
      .catch(() => setHistoryError('Failed to load history.'))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => { fetchMembers(); fetchHistory(); }, []);

  // ── Approve/Decline handler ────────────────────────────────────────────────
  const handleSend = async (m, approve) => {
    const stateKey = `${m.id ?? m.documentId}-${approve ? 'approve' : 'decline'}`;
    setSendingState((prev) => ({ ...prev, [stateKey]: 'sending' }));
    try {
      await put(
        `/content-manager/collection-types/api::add-delegation-member.add-delegation-member/${m.documentId}`,
        { approve_visa_request: approve, send_visa_request_letter: true }
      );
      await post(
        `/content-manager/collection-types/api::add-delegation-member.add-delegation-member/${m.documentId}/actions/publish`,
        {}
      );
      setSendingState((prev) => ({ ...prev, [stateKey]: 'success' }));
      setTimeout(() => { fetchMembers(); fetchHistory(); }, 2000);
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Unknown error';
      setSendingState((prev) => ({ ...prev, [stateKey]: `error: ${msg}` }));
    }
  };

  // ── Shared helpers ─────────────────────────────────────────────────────────
  const toggleExpand = (id, setFn) => {
    setFn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try { return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return val; }
  };

  // Extract plain text from Strapi blocks (rich text) content
  const blocksToText = (blocks) => {
    if (!Array.isArray(blocks) || blocks.length === 0) return null;
    return blocks
      .map((block) => {
        if (!Array.isArray(block.children)) return '';
        return block.children.map((child) => child.text ?? '').join('');
      })
      .filter(Boolean)
      .join('\n') || null;
  };

  const DetailRow = ({ label, value }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid #32324d' }}>
        <div style={{ width: '180px', flexShrink: 0, fontSize: '12px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '2px' }}>{label}</div>
        <div style={{ fontSize: '14px', color: '#eaeaef', wordBreak: 'break-word' }}>{String(value)}</div>
      </div>
    );
  };

  // Reusable expanded detail panel (showActions = pending section only)
  const DetailPanel = ({ m, showActions }) => (
    <div style={{ padding: '16px 20px 20px', borderTop: '1px solid #32324d', background: '#181826' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#7b79ff', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '10px' }}>Personal Details</div>
          <DetailRow label="First Name" value={m.first_name} />
          <DetailRow label="Surname" value={m.surname} />
          <DetailRow label="Date of Birth" value={formatDate(m.date_of_birth)} />
          <DetailRow label="Country" value={m.country} />
          <DetailRow label="Role" value={m.role?.accreditation_role ?? null} />
          <DetailRow label="Submitted By" value={m.submitted_by} />
          <DetailRow label="Submitted By Email" value={m.submitted_by_email} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#7b79ff', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '10px' }}>Passport &amp; Visa</div>
          <DetailRow label="Passport Number" value={m.passport_number} />
          <DetailRow label="Passport Expiry" value={formatDate(m.passport_expiry_date)} />
          <DetailRow label="Passport Nationality" value={m.passport_nationality} />
          <DetailRow label="Visa Letter Requested" value={m.visa_letter_requested ? 'Yes' : 'No'} />
          <DetailRow label="Visa Request Approved" value={m.approve_visa_request == null ? null : m.approve_visa_request ? 'Yes' : 'No'} />
          <DetailRow label="Send Letter Triggered" value={m.send_visa_request_letter == null ? null : m.send_visa_request_letter ? 'Yes' : 'No'} />
          <DetailRow label="Letter Sent" value={m.visa_letter_sent ? 'Yes' : 'No'} />
          <DetailRow label="Letter Sent At" value={m.visa_letter_sent_at ? formatDate(m.visa_letter_sent_at) : null} />
          {m.visa_pdf_file && (
            <div style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid #32324d' }}>
              <div style={{ width: '180px', flexShrink: 0, fontSize: '12px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '2px' }}>Visa PDF File</div>
              <div style={{ fontSize: '14px', wordBreak: 'break-word' }}>
                <a href={m.visa_pdf_file} target="_blank" rel="noopener noreferrer" style={{ color: '#7b79ff', textDecoration: 'underline' }}>View PDF</a>
              </div>
            </div>
          )}
          <DetailRow label="Visa Notes" value={blocksToText(m.visa_notes)} />

          {showActions && (() => {
            const baseKey = m.id ?? m.documentId;
            const approveState = sendingState[`${baseKey}-approve`];
            const declineState = sendingState[`${baseKey}-decline`];
            const anyBusy = approveState === 'sending' || declineState === 'sending'
              || approveState === 'success' || declineState === 'success';

            const BtnState = ({ state, approve }) => {
              const isSending = state === 'sending';
              const isSuccess = state === 'success';
              const isError = state && state.startsWith('error');
              const label = approve ? 'Approve & Send' : 'Decline & Send';
              return (
                <div>
                  <button
                    disabled={anyBusy}
                    onClick={(e) => { e.stopPropagation(); handleSend(m, approve); }}
                    style={{
                      background: isSuccess ? '#328048' : isError ? '#b72b2b' : approve ? '#4945ff' : '#d9822b',
                      border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '600',
                      padding: '8px 18px', cursor: anyBusy ? 'default' : 'pointer',
                      opacity: isSending ? 0.7 : 1, whiteSpace: 'nowrap',
                    }}
                  >
                    {isSending ? 'Sending…' : isSuccess ? 'Sent!' : label}
                  </button>
                  {isError && (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#ee5e52' }}>
                      {state.replace('error: ', '')}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <BtnState state={approveState} approve={true} />
                <BtnState state={declineState} approve={false} />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );

  // Reusable record list
  const RecordList = ({ records, expandedSet, onToggle, showActions }) => (
    <div>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr 1fr 1.5fr 1fr',
        gap: '8px', padding: '8px 16px', background: '#212134',
        borderRadius: '6px 6px 0 0', border: '1px solid #32324d', borderBottom: 'none',
      }}>
        {['Name', 'Country', 'Role', 'Submitted By', 'Outcome', 'Sent At', ''].map((h) => (
          <div key={h} style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>{h}</div>
        ))}
      </div>
      {records.map((m, idx) => {
        const key = m.id ?? m.documentId;
        const isExpanded = expandedSet.has(key);
        const isLast = idx === records.length - 1;
        const approved = m.approve_visa_request;
        return (
          <div key={key} style={{ border: '1px solid #32324d', borderTop: 'none', borderRadius: isLast && !isExpanded ? '0 0 6px 6px' : '0', background: '#1e1e2e' }}>
            <div
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr 1fr 1.5fr 1fr', gap: '8px', padding: '12px 16px', cursor: 'pointer', alignItems: 'center' }}
              onClick={() => onToggle(key)}
            >
              <div style={{ color: '#eaeaef', fontSize: '14px', fontWeight: '500' }}>{m.first_name} {m.surname}</div>
              <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{m.country || '—'}</div>
              <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{m.role?.accreditation_role || '—'}</div>
              <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{m.submitted_by || '—'}</div>
              <div>
                {m.visa_letter_sent ? (
                  <span style={{
                    fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px',
                    background: approved ? '#1a3a28' : '#3a1a1a',
                    color: approved ? '#5cb87a' : '#ee5e52',
                  }}>
                    {approved ? 'Approved' : 'Declined'}
                  </span>
                ) : '—'}
              </div>
              <div style={{ color: '#a5a5ba', fontSize: '13px' }}>
                {m.visa_letter_sent_at ? formatDate(m.visa_letter_sent_at) : '—'}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '18px', color: '#7b79ff', lineHeight: 1 }}>{isExpanded ? '▾' : '▸'}</span>
              </div>
            </div>
            {isExpanded && <DetailPanel m={m} showActions={showActions} />}
          </div>
        );
      })}
    </div>
  );

  // ── History filter options (derived from full dataset) ─────────────────────
  const historyCountryOptions = [...new Set(historyAll.map((m) => m.country).filter(Boolean))].sort();
  const historySubmittedByOptions = [...new Set(historyAll.map((m) => m.submitted_by).filter(Boolean))].sort();

  const historyFiltered = historyAll.filter((m) => {
    if (historyFilterCountry && m.country !== historyFilterCountry) return false;
    if (historyFilterSubmittedBy && m.submitted_by !== historyFilterSubmittedBy) return false;
    if (historyFilterOutcome === 'approved' && !m.approve_visa_request) return false;
    if (historyFilterOutcome === 'declined' && m.approve_visa_request) return false;
    return true;
  });

  const filterSelectStyle = {
    background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px',
    color: '#fff', fontSize: '13px', padding: '7px 10px', cursor: 'pointer', minWidth: '180px',
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', margin: 0 }}>
            Manage Visa Invitations
          </h1>
        </div>
        <button
          onClick={() => { fetchMembers(); fetchHistory(); }}
          style={{ background: '#4945ff', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Refresh All
        </button>
      </div>

      {/* ── Toggle tabs ── */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '28px', borderBottom: '2px solid #32324d' }}>
        {[
          { key: 'current', label: 'Current Requests' },
          { key: 'previous', label: 'Previous Requests' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            style={{
              background: 'none', border: 'none', borderBottom: view === key ? '2px solid #7b79ff' : '2px solid transparent',
              marginBottom: '-2px', color: view === key ? '#7b79ff' : '#a5a5ba',
              fontSize: '14px', fontWeight: view === key ? '600' : '400',
              padding: '8px 20px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {label}
            {!loading && key === 'current' && (
              <span style={{ marginLeft: '6px', fontSize: '11px', color: view === 'current' ? '#7b79ff' : '#8e8ea0' }}>({members.length})</span>
            )}
            {!historyLoading && key === 'previous' && (
              <span style={{ marginLeft: '6px', fontSize: '11px', color: view === 'previous' ? '#7b79ff' : '#8e8ea0' }}>({historyAll.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Current Requests tab ── */}
      {view === 'current' && (
        <div>
          {loading && <p style={{ color: '#a5a5ba', fontSize: '14px' }}>Loading…</p>}
          {error && <p style={{ color: '#ee5e52', fontSize: '14px' }}>{error}</p>}
          {!loading && !error && members.length === 0 && (
            <p style={{ color: '#a5a5ba', fontSize: '14px' }}>No pending visa invitation requests found.</p>
          )}
          {!loading && !error && members.length > 0 && (
            <div>
              <p style={{ color: '#a5a5ba', fontSize: '13px', marginBottom: '16px' }}>
                {members.length} record{members.length !== 1 ? 's' : ''} found
              </p>
              <RecordList
                records={members}
                expandedSet={expandedIds}
                onToggle={(key) => toggleExpand(key, setExpandedIds)}
                showActions={true}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Previous Requests tab ── */}
      {view === 'previous' && (
        <div>
          {historyLoading && <p style={{ color: '#a5a5ba', fontSize: '14px' }}>Loading…</p>}
          {historyError && <p style={{ color: '#ee5e52', fontSize: '14px' }}>{historyError}</p>}

          {!historyLoading && !historyError && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Country</div>
                  <select
                    value={historyFilterCountry}
                    onChange={(e) => setHistoryFilterCountry(e.target.value)}
                    style={filterSelectStyle}
                  >
                    <option value="">All Countries</option>
                    {historyCountryOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Submitted By</div>
                  <select
                    value={historyFilterSubmittedBy}
                    onChange={(e) => setHistoryFilterSubmittedBy(e.target.value)}
                    style={filterSelectStyle}
                  >
                    <option value="">All Submitters</option>
                    {historySubmittedByOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Outcome</div>
                  <select
                    value={historyFilterOutcome}
                    onChange={(e) => setHistoryFilterOutcome(e.target.value)}
                    style={filterSelectStyle}
                  >
                    <option value="">All Outcomes</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
                {(historyFilterCountry || historyFilterSubmittedBy || historyFilterOutcome) && (
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      onClick={() => { setHistoryFilterCountry(''); setHistoryFilterSubmittedBy(''); setHistoryFilterOutcome(''); }}
                      style={{ background: 'none', border: '1px solid #32324d', borderRadius: '6px', color: '#a5a5ba', fontSize: '13px', padding: '7px 12px', cursor: 'pointer' }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>

              <p style={{ color: '#a5a5ba', fontSize: '13px', marginBottom: '16px' }}>
                {historyFiltered.length} record{historyFiltered.length !== 1 ? 's' : ''}
                {(historyFilterCountry || historyFilterSubmittedBy || historyFilterOutcome) ? ' (filtered)' : ''}
              </p>

              {historyFiltered.length === 0 ? (
                <p style={{ color: '#a5a5ba', fontSize: '14px' }}>No records match the selected filters.</p>
              ) : (
                <RecordList
                  records={historyFiltered}
                  expandedSet={historyExpandedIds}
                  onToggle={(key) => toggleExpand(key, setHistoryExpandedIds)}
                  showActions={false}
                />
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default VisaInvitationsPage;
