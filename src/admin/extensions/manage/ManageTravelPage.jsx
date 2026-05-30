import React, { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import * as XLSX from 'xlsx';

const ManageTravelPage = () => {
  const { get } = useFetchClient();

  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // ── View toggle ────────────────────────────────────────────────────────────
  const [view, setView] = useState('received'); // 'received' | 'missing'

  // ── Received filters ───────────────────────────────────────────────────────
  const [filterCountry, setFilterCountry] = useState('');
  const [filterSubmittedBy, setFilterSubmittedBy] = useState('');
  const [filterArrivalDate, setFilterArrivalDate] = useState('');
  const [filterDepartureDate, setFilterDepartureDate] = useState('');

  // ── Missing view ───────────────────────────────────────────────────────────
  const [allMembers, setAllMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(null);
  const [missingFilterCountry, setMissingFilterCountry] = useState('');
  const [missingFilterSubmittedBy, setMissingFilterSubmittedBy] = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchRecords = () => {
    setLoading(true);
    setError(null);
    setMembersLoading(true);
    setMembersError(null);
    Promise.all([
      get(
        '/content-manager/collection-types/api::arrival-departure.arrival-departure' +
        '?pageSize=1000' +
        '&populate[delegation_member][populate][photo]=*' +
        '&sort=surname:asc,first_name:asc'
      ),
      get(
        '/content-manager/collection-types/api::add-delegation-member.add-delegation-member' +
        '?pageSize=1000' +
        '&populate[role]=*' +
        '&sort=country:asc,surname:asc,first_name:asc'
      ),
    ])
      .then(([travelRes, membersRes]) => {
        setAllRecords(travelRes.data?.results ?? travelRes.data?.data ?? []);
        setAllMembers(membersRes.data?.results ?? membersRes.data?.data ?? []);
      })
      .catch(() => {
        setError('Failed to load travel records.');
        setMembersError('Failed to load delegation members.');
      })
      .finally(() => {
        setLoading(false);
        setMembersLoading(false);
      });
  };

  useEffect(() => { fetchRecords(); }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
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

  const formatTime = (val) => {
    if (!val) return '—';
    return (val || '').substring(0, 5);
  };

  const resolvePhotoUrl = (photo) => {
    if (!photo) return null;
    const raw = photo?.formats?.thumbnail?.url ?? photo?.url ?? null;
    if (!raw) return null;
    return raw.startsWith('http') ? raw : window.location.origin + raw;
  };

  // ── Export ──────────────────────────────────────────────────────────────────
  const exportToXlsx = () => {
    const sorted = [...allRecords].sort((a, b) => {
      const dateA = a.arrival_date ?? '';
      const dateB = b.arrival_date ?? '';
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      const countryA = (a.delegation_member?.country ?? '').toLowerCase();
      const countryB = (b.delegation_member?.country ?? '').toLowerCase();
      if (countryA < countryB) return -1;
      if (countryA > countryB) return 1;
      const surnameA = (a.surname ?? '').toLowerCase();
      const surnameB = (b.surname ?? '').toLowerCase();
      if (surnameA < surnameB) return -1;
      if (surnameA > surnameB) return 1;
      return 0;
    });

    const COLUMNS = [
      'First Name', 'Surname', 'Country',
      'Arrival Date', 'Arrival Time', 'Arrival Location', 'Arrival Flight Number', 'Arrival Notes',
      'Departure Date', 'Departure Time', 'Departure Location', 'Departure Flight Number',
      'Departure Pick-up Time', 'Departure Pick-up Location', 'Departure Notes',
      'Reference Number', 'Submitted By', 'Submitted By Email',
    ];

    const dataRows = sorted.map((r) => ([
      r.first_name ?? '',
      r.surname ?? '',
      r.delegation_member?.country ?? '',
      r.arrival_date ?? '',
      (r.arrival_time ?? '').substring(0, 5),
      r.arrival_location ?? '',
      r.arrival_flight_number ?? '',
      r.arrival_notes ?? '',
      r.departure_date ?? '',
      (r.departure_time ?? '').substring(0, 5),
      r.departure_location ?? '',
      r.departure_flight_number ?? '',
      (r.departure_pick_up_time ?? '').substring(0, 5),
      r.departure_pick_up_location ?? '',
      r.departure_notes ?? '',
      r.travel_details_reference_number ?? '',
      r.travel_details_submitted_by ?? '',
      r.travel_details_submitted_by_email ?? '',
    ]));

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const exportTimestamp = now.toLocaleString('en-GB');

    const sheetData = [
      [`Arrivals & Departures Export    |    Export Date: ${exportTimestamp}`, ...Array(COLUMNS.length - 1).fill('')],
      COLUMNS,
      ...dataRows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: COLUMNS.length - 1 } }];

    ws['!cols'] = [
      { wch: 16 }, { wch: 18 }, { wch: 20 },
      { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 22 }, { wch: 28 },
      { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 22 },
      { wch: 16 }, { wch: 24 }, { wch: 28 },
      { wch: 22 }, { wch: 24 }, { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Arrivals & Departures');
    XLSX.writeFile(wb, `arrivals_departures_${datePart}.xlsx`);
  };

  // ── Derived: received view ─────────────────────────────────────────────────
  const countryOptions = [...new Set(allRecords.map((r) => r.delegation_member?.country).filter(Boolean))].sort();
  const submittedByOptions = [...new Set(allRecords.map((r) => r.travel_details_submitted_by).filter(Boolean))].sort();

  const hasFilters = filterCountry || filterSubmittedBy || filterArrivalDate || filterDepartureDate;

  const filtered = allRecords.filter((r) => {
    if (filterCountry && r.delegation_member?.country !== filterCountry) return false;
    if (filterSubmittedBy && r.travel_details_submitted_by !== filterSubmittedBy) return false;
    if (filterArrivalDate && r.arrival_date !== filterArrivalDate) return false;
    if (filterDepartureDate && r.departure_date !== filterDepartureDate) return false;
    return true;
  });

  // ── Derived: missing view ──────────────────────────────────────────────────
  const travelMemberDocIds = new Set(allRecords.map((r) => r.delegation_member?.documentId).filter(Boolean));
  const missingMembers = allMembers.filter((m) => !travelMemberDocIds.has(m.documentId));
  const missingCountryOptions = [...new Set(missingMembers.map((m) => m.country).filter(Boolean))].sort();
  const missingSubmittedByOptions = [...new Set(missingMembers.map((m) => m.submitted_by).filter(Boolean))].sort();
  const hasMissingFilters = missingFilterCountry || missingFilterSubmittedBy;
  const filteredMissing = missingMembers.filter((m) => {
    if (missingFilterCountry && m.country !== missingFilterCountry) return false;
    if (missingFilterSubmittedBy && m.submitted_by !== missingFilterSubmittedBy) return false;
    return true;
  });

  // ── Styles ─────────────────────────────────────────────────────────────────
  const filterSelectStyle = {
    background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px',
    color: '#fff', fontSize: '13px', padding: '7px 10px', cursor: 'pointer', minWidth: '160px',
  };

  const filterInputStyle = {
    background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px',
    color: '#fff', fontSize: '13px', padding: '7px 10px', minWidth: '160px', colorScheme: 'dark',
  };

  const DetailRow = ({ label, value }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid #32324d' }}>
        <div style={{ width: '190px', flexShrink: 0, fontSize: '12px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '2px' }}>{label}</div>
        <div style={{ fontSize: '14px', color: '#eaeaef', wordBreak: 'break-word' }}>{String(value)}</div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', margin: 0 }}>Manage Travel</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={exportToXlsx}
            disabled={loading || allRecords.length === 0}
            style={{ background: 'none', border: '1px solid #32324d', borderRadius: '4px', color: loading || allRecords.length === 0 ? '#6b7280' : '#a5a5ba', fontSize: '12px', padding: '4px 10px', cursor: loading || allRecords.length === 0 ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
          >
            Export Data
          </button>
          <button
            onClick={fetchRecords}
            style={{ background: '#4945ff', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Toggle tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '28px', borderBottom: '2px solid #32324d' }}>
        {[{ key: 'received', label: 'Travel Details Received' }, { key: 'missing', label: 'Travel Details Missing' }].map(({ key, label }) => (
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
            {!loading && key === 'received' && (
              <span style={{ marginLeft: '6px', fontSize: '11px', color: view === 'received' ? '#7b79ff' : '#8e8ea0' }}>({allRecords.length})</span>
            )}
            {!membersLoading && key === 'missing' && (
              <span style={{ marginLeft: '6px', fontSize: '11px', color: view === 'missing' ? '#7b79ff' : '#8e8ea0' }}>({missingMembers.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Travel Details Received ── */}
      {view === 'received' && (
        <div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Country</div>
          <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} style={filterSelectStyle}>
            <option value="">All Countries</option>
            {countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Submitted By</div>
          <select value={filterSubmittedBy} onChange={(e) => setFilterSubmittedBy(e.target.value)} style={filterSelectStyle}>
            <option value="">All Submitters</option>
            {submittedByOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Arrival Date</div>
          <input type="date" value={filterArrivalDate} onChange={(e) => setFilterArrivalDate(e.target.value)} style={filterInputStyle} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Departure Date</div>
          <input type="date" value={filterDepartureDate} onChange={(e) => setFilterDepartureDate(e.target.value)} style={filterInputStyle} />
        </div>
        {hasFilters && (
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => { setFilterCountry(''); setFilterSubmittedBy(''); setFilterArrivalDate(''); setFilterDepartureDate(''); }}
              style={{ background: 'none', border: '1px solid #32324d', borderRadius: '6px', color: '#a5a5ba', fontSize: '13px', padding: '7px 12px', cursor: 'pointer' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {loading && <p style={{ color: '#a5a5ba', fontSize: '14px' }}>Loading…</p>}
      {error && <p style={{ color: '#ee5e52', fontSize: '14px' }}>{error}</p>}

      {!loading && !error && (
        <div>
          <p style={{ color: '#a5a5ba', fontSize: '13px', marginBottom: '16px' }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}{hasFilters ? ' (filtered)' : ''}
          </p>

          {filtered.length === 0 ? (
            <p style={{ color: '#a5a5ba', fontSize: '14px' }}>
              {hasFilters ? 'No records match the selected filters.' : 'No travel records found.'}
            </p>
          ) : (
            <div>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1.5fr 40px',
                gap: '8px', padding: '8px 16px', background: '#212134',
                borderRadius: '6px 6px 0 0', border: '1px solid #32324d', borderBottom: 'none',
              }}>
                {['Name', 'Country', 'Submitted By', 'Arrival Date', 'Departure Date', ''].map((h) => (
                  <div key={h} style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>{h}</div>
                ))}
              </div>

              {/* Rows */}
              {filtered.map((r, idx) => {
                const key = r.id ?? r.documentId;
                const isExpanded = expandedIds.has(key);
                const isLast = idx === filtered.length - 1;
                const member = r.delegation_member ?? {};
                const photoUrl = resolvePhotoUrl(member.photo);

                return (
                  <div key={key} style={{
                    border: '1px solid #32324d', borderTop: 'none',
                    borderRadius: isLast && !isExpanded ? '0 0 6px 6px' : '0',
                    background: '#1e1e2e',
                  }}>
                    <div
                      style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1.5fr 40px', gap: '8px', padding: '12px 16px', cursor: 'pointer', alignItems: 'center' }}
                      onClick={() => toggleExpand(key)}
                    >
                      <div style={{ color: '#eaeaef', fontSize: '14px', fontWeight: '500' }}>{r.first_name} {r.surname}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{member.country || '—'}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{r.travel_details_submitted_by || '—'}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '13px' }}>{formatDate(r.arrival_date)}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '13px' }}>{formatDate(r.departure_date)}</div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '18px', color: '#7b79ff', lineHeight: 1 }}>{isExpanded ? '▾' : '▸'}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '16px 20px 20px', borderTop: '1px solid #32324d', background: '#181826' }}>
                        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

                          {/* Photo */}
                          {photoUrl && (
                            <div style={{ flexShrink: 0 }}>
                              <div style={{ fontSize: '11px', color: '#7b79ff', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '10px' }}>Photo</div>
                              <img
                                src={photoUrl}
                                alt={`${r.first_name} ${r.surname}`}
                                style={{ width: '100px', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #32324d' }}
                              />
                            </div>
                          )}

                          {/* Detail grid */}
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>

                            {/* Arrival */}
                            <div>
                              <div style={{ fontSize: '11px', color: '#7b79ff', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '10px' }}>Arrival</div>
                              <DetailRow label="Date" value={formatDate(r.arrival_date)} />
                              <DetailRow label="Time" value={formatTime(r.arrival_time)} />
                              <DetailRow label="Location" value={r.arrival_location} />
                              <DetailRow label="Flight Number" value={r.arrival_flight_number} />
                              <DetailRow label="Notes" value={r.arrival_notes} />
                            </div>

                            {/* Departure */}
                            <div>
                              <div style={{ fontSize: '11px', color: '#7b79ff', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '10px' }}>Departure</div>
                              <DetailRow label="Date" value={formatDate(r.departure_date)} />
                              <DetailRow label="Time" value={formatTime(r.departure_time)} />
                              <DetailRow label="Location" value={r.departure_location} />
                              <DetailRow label="Flight Number" value={r.departure_flight_number} />
                              <DetailRow label="Pick-up Time" value={formatTime(r.departure_pick_up_time)} />
                              <DetailRow label="Pick-up Location" value={r.departure_pick_up_location} />
                              <DetailRow label="Notes" value={r.departure_notes} />
                            </div>

                            {/* Submission */}
                            <div style={{ marginTop: '20px' }}>
                              <div style={{ fontSize: '11px', color: '#7b79ff', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '10px' }}>Submission</div>
                              <DetailRow label="Reference" value={r.travel_details_reference_number} />
                              <DetailRow label="Submitted By" value={r.travel_details_submitted_by} />
                              <DetailRow label="Submitted By Email" value={r.travel_details_submitted_by_email} />
                            </div>

                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

        </div>
      )}

      {/* ── Travel Details Missing ── */}
      {view === 'missing' && (
        <div>
          {membersLoading && <p style={{ color: '#a5a5ba', fontSize: '14px' }}>Loading…</p>}
          {membersError && <p style={{ color: '#ee5e52', fontSize: '14px' }}>{membersError}</p>}

          {!membersLoading && !membersError && (
            <div>
              {/* Missing filters */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Country</div>
                  <select value={missingFilterCountry} onChange={(e) => setMissingFilterCountry(e.target.value)} style={filterSelectStyle}>
                    <option value="">All Countries</option>
                    {missingCountryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Submitted By</div>
                  <select value={missingFilterSubmittedBy} onChange={(e) => setMissingFilterSubmittedBy(e.target.value)} style={filterSelectStyle}>
                    <option value="">All Submitters</option>
                    {missingSubmittedByOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {hasMissingFilters && (
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      onClick={() => { setMissingFilterCountry(''); setMissingFilterSubmittedBy(''); }}
                      style={{ background: 'none', border: '1px solid #32324d', borderRadius: '6px', color: '#a5a5ba', fontSize: '13px', padding: '7px 12px', cursor: 'pointer' }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>

              <p style={{ color: '#a5a5ba', fontSize: '13px', marginBottom: '16px' }}>
                {filteredMissing.length} member{filteredMissing.length !== 1 ? 's' : ''} with no travel record{hasMissingFilters ? ' (filtered)' : ''}
              </p>

              {filteredMissing.length === 0 ? (
                <p style={{ color: '#a5a5ba', fontSize: '14px' }}>
                  {hasMissingFilters ? 'No records match the selected filters.' : 'All delegation members have travel details submitted.'}
                </p>
              ) : (
                <div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 2fr',
                    gap: '8px', padding: '8px 16px', background: '#212134',
                    borderRadius: '6px 6px 0 0', border: '1px solid #32324d', borderBottom: 'none',
                  }}>
                    {['Name', 'Country', 'Role', 'Submitted By'].map((h) => (
                      <div key={h} style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>{h}</div>
                    ))}
                  </div>
                  {filteredMissing.map((m, idx) => (
                    <div key={m.id ?? m.documentId} style={{
                      display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 2fr',
                      gap: '8px', padding: '12px 16px',
                      border: '1px solid #32324d', borderTop: 'none',
                      borderRadius: idx === filteredMissing.length - 1 ? '0 0 6px 6px' : '0',
                      background: '#1e1e2e', alignItems: 'center',
                    }}>
                      <div style={{ color: '#eaeaef', fontSize: '14px', fontWeight: '500' }}>{m.first_name} {m.surname}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{m.country || '—'}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{m.role?.accreditation_role || '—'}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{m.submitted_by || '—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ManageTravelPage;
