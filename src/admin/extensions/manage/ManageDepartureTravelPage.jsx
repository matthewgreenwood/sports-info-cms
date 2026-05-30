import React, { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import * as XLSX from 'xlsx';

const ManageDepartureTravelPage = () => {
  const { get, put, post } = useFetchClient();

  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Per-record inline edit state ──────────────────────────────────────────
  const [editData, setEditData] = useState({}); // { [key]: { field: value, ... } }
  const [savingIds, setSavingIds] = useState(new Set());
  const [saveMessages, setSaveMessages] = useState({}); // { [key]: { type, text } }

  // ── Bulk pick-up time update ───────────────────────────────────────────────
  const [bulkPickUpTime, setBulkPickUpTime] = useState('');
  const [bulkPickUpLocation, setBulkPickUpLocation] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkUpdateMsg, setBulkUpdateMsg] = useState(null); // { type: 'success'|'error', text }

  // ── Hotels for location combobox ───────────────────────────────────────────
  const [hotelOptions, setHotelOptions] = useState([]);
  useEffect(() => {
    get('/content-manager/collection-types/api::accommodation-hotel.accommodation-hotel?pageSize=200&fields[0]=hotel_name&sort=hotel_name:asc')
      .then(({ data }) => setHotelOptions((data?.results ?? data?.data ?? []).map((h) => h.hotel_name).filter(Boolean)))
      .catch(() => {});
  }, []);

  const handleBulkUpdatePickUpTime = async () => {
    if ((!bulkPickUpTime && !bulkPickUpLocation) || selectedIds.size === 0) return;
    setBulkUpdating(true);
    setBulkUpdateMsg(null);
    const records = allRecords.filter((r) => selectedIds.has(r.id ?? r.documentId));
    const payload = {};
    if (bulkPickUpTime) payload.departure_pick_up_time = `${bulkPickUpTime}:00`;
    if (bulkPickUpLocation) payload.departure_pick_up_location = bulkPickUpLocation;
    try {
      await Promise.all(
        records.map(async (r) => {
          await put(
            `/content-manager/collection-types/api::arrival-departure.arrival-departure/${r.documentId}`,
            payload
          );
          await post(
            `/content-manager/collection-types/api::arrival-departure.arrival-departure/${r.documentId}/actions/publish`,
            {}
          );
        })
      );
      setBulkUpdateMsg({ type: 'success', text: `Updated ${records.length} record${records.length !== 1 ? 's' : ''}.` });
      setSelectedIds(new Set());
      setBulkPickUpTime('');
      setBulkPickUpLocation('');
      fetchRecords();
    } catch {
      setBulkUpdateMsg({ type: 'error', text: 'Update failed. Please try again.' });
    } finally {
      setBulkUpdating(false);
    }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const [filterCountry, setFilterCountry] = useState('');
  const [filterDepartureDate, setFilterDepartureDate] = useState('');

  const [sortKey, setSortKey] = useState('departure_date');
  const [sortDir, setSortDir] = useState('asc');
  const [view, setView] = useState('pending'); // 'pending' | 'set'

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
    return <span style={{ marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const fetchRecords = () => {
    setLoading(true);
    setError(null);
    get(
      '/content-manager/collection-types/api::arrival-departure.arrival-departure' +
      '?pageSize=1000' +
      '&populate[delegation_member][populate][photo]=*' +
      '&sort=departure_date:asc,surname:asc,first_name:asc'
    )
      .then(({ data }) => {
        const results = data?.results ?? data?.data ?? [];
        setAllRecords(results.filter((r) => r.departure_date));
      })
      .catch(() => setError('Failed to load departure records.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecords(); }, []);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    // Initialise edit data the first time this record is expanded
    setEditData((prev) => {
      if (prev[id]) return prev;
      const record = allRecords.find((r) => (r.id ?? r.documentId) === id);
      if (!record) return prev;
      return {
        ...prev,
        [id]: {
          departure_date: record.departure_date ?? '',
          departure_time: (record.departure_time ?? '').substring(0, 5),
          departure_location: record.departure_location ?? '',
          departure_flight_number: record.departure_flight_number ?? '',
          departure_pick_up_time: (record.departure_pick_up_time ?? '').substring(0, 5),
          departure_pick_up_location: record.departure_pick_up_location ?? '',
          departure_notes: record.departure_notes ?? '',
        },
      };
    });
  };

  const handleSaveRecord = async (r) => {
    const key = r.id ?? r.documentId;
    const data = editData[key];
    if (!data) return;
    setSavingIds((prev) => new Set([...prev, key]));
    setSaveMessages((prev) => ({ ...prev, [key]: null }));
    try {
      const payload = {
        departure_date: data.departure_date || null,
        departure_time: data.departure_time ? `${data.departure_time}:00` : null,
        departure_location: data.departure_location || null,
        departure_flight_number: data.departure_flight_number || null,
        departure_pick_up_time: data.departure_pick_up_time ? `${data.departure_pick_up_time}:00` : null,
        departure_pick_up_location: data.departure_pick_up_location || null,
        departure_notes: data.departure_notes || null,
      };
      await put(
        `/content-manager/collection-types/api::arrival-departure.arrival-departure/${r.documentId}`,
        payload
      );
      await post(
        `/content-manager/collection-types/api::arrival-departure.arrival-departure/${r.documentId}/actions/publish`,
        {}
      );
      setSaveMessages((prev) => ({ ...prev, [key]: { type: 'success', text: 'Changes saved successfully.' } }));
      fetchRecords();
    } catch {
      setSaveMessages((prev) => ({ ...prev, [key]: { type: 'error', text: 'Save failed. Please try again.' } }));
    } finally {
      setSavingIds((prev) => { const next = new Set(prev); next.delete(key); return next; });
    }
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

  const exportToXlsx = () => {
    const sorted = [...allRecords].sort((a, b) => {
      const dateA = a.departure_date ?? '';
      const dateB = b.departure_date ?? '';
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
      'Departure Date', 'Country', 'Surname', 'First Name',
      'Pick-up Location', 'Pick-up Time',
    ];

    const dataRows = sorted.map((r) => ([
      r.departure_date ?? '',
      r.delegation_member?.country ?? '',
      r.surname ?? '',
      r.first_name ?? '',
      r.departure_pick_up_location ?? '',
      (r.departure_pick_up_time ?? '').substring(0, 5),
    ]));

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const exportTimestamp = now.toLocaleString('en-GB');

    const sheetData = [
      [`Departure Travel Export    |    Export Date: ${exportTimestamp}`, ...Array(COLUMNS.length - 1).fill('')],
      COLUMNS,
      ...dataRows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: COLUMNS.length - 1 } }];
    ws['!cols'] = [
      { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 16 },
      { wch: 28 }, { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Departure Travel');
    XLSX.writeFile(wb, `departure_travel_${datePart}.xlsx`);
  };

  const LocationCombobox = ({ value, onChange }) => {
    const [open, setOpen] = React.useState(false);
    const wrapperRef = React.useRef(null);
    const filtered = value
      ? hotelOptions.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
      : hotelOptions;
    React.useEffect(() => {
      const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);
    return (
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          placeholder="Type or select a location…"
          onFocus={() => setOpen(true)}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          style={{
            background: '#374151', border: '1px solid #4b5563', borderRadius: '8px',
            color: '#fff', fontSize: '13px', padding: '8px 12px', minWidth: '220px', outline: 'none',
          }}
        />
        {open && filtered.length > 0 && (
          <ul style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
            background: '#1e1e2e', border: '1px solid #4b5563', borderRadius: '8px',
            margin: 0, padding: '4px 0', listStyle: 'none', minWidth: '220px', maxHeight: '220px',
            overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}>
            {filtered.map((opt) => (
              <li
                key={opt}
                onMouseDown={(e) => { e.preventDefault(); onChange(opt); setOpen(false); }}
                style={{
                  padding: '8px 14px', fontSize: '13px', color: opt === value ? '#7b79ff' : '#eaeaef',
                  background: opt === value ? '#272740' : 'transparent', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#272740'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = opt === value ? '#272740' : 'transparent'; }}
              >
                {opt}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const FlowbiteCheckbox = ({ checked, indeterminate, onChange, onClick }) => {
    const isOn = checked || indeterminate;
    return (
      <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', lineHeight: 0 }} onClick={onClick}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
          background: isOn ? '#1a56db' : '#374151',
          border: isOn ? 'none' : '1px solid #4b5563',
          boxSizing: 'border-box',
        }}>
          {checked && !indeterminate && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {indeterminate && (
            <span style={{ display: 'block', width: '8px', height: '2px', background: '#fff', borderRadius: '1px' }} />
          )}
        </span>
      </label>
    );
  };

  const filterSelectStyle = {
    background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px',
    color: '#fff', fontSize: '13px', padding: '7px 10px', cursor: 'pointer', minWidth: '160px',
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

  const setRecords = allRecords.filter((r) => r.departure_pick_up_time && r.departure_pick_up_location);
  const pendingRecords = allRecords.filter((r) => !r.departure_pick_up_time || !r.departure_pick_up_location);
  const viewRecords = view === 'set' ? setRecords : pendingRecords;

  const countryOptions = [...new Set(viewRecords.map((r) => r.delegation_member?.country).filter(Boolean))].sort();
  const departureDateOptions = [...new Set(viewRecords.map((r) => r.departure_date).filter(Boolean))].sort();
  const hasFilters = filterCountry || filterDepartureDate;

  const filtered = viewRecords
    .filter((r) => {
      if (filterCountry && r.delegation_member?.country !== filterCountry) return false;
      if (filterDepartureDate && r.departure_date !== filterDepartureDate) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortKey === 'name') {
        aVal = `${a.surname ?? ''} ${a.first_name ?? ''}`;
        bVal = `${b.surname ?? ''} ${b.first_name ?? ''}`;
      } else if (sortKey === 'country') {
        aVal = a.delegation_member?.country ?? '';
        bVal = b.delegation_member?.country ?? '';
      } else {
        aVal = a[sortKey] ?? '';
        bVal = b[sortKey] ?? '';
      }
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', margin: 0 }}>Departure Travel</h1>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '28px', borderBottom: '2px solid #32324d' }}>
        {[
          { key: 'pending', label: 'Pick-up Details Pending' },
          { key: 'set', label: 'Pick-up Details Set' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setView(key); setFilterCountry(''); setFilterDepartureDate(''); setSelectedIds(new Set()); }}
            style={{
              background: 'none', border: 'none', borderBottom: view === key ? '2px solid #7b79ff' : '2px solid transparent',
              marginBottom: '-2px', color: view === key ? '#7b79ff' : '#a5a5ba',
              fontSize: '14px', fontWeight: view === key ? '600' : '400',
              padding: '8px 20px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {label}
            {!loading && (
              <span style={{ marginLeft: '6px', fontSize: '11px', color: view === key ? '#7b79ff' : '#8e8ea0' }}>
                ({key === 'pending' ? pendingRecords.length : setRecords.length})
              </span>
            )}
          </button>
        ))}
      </div>

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
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Departure Date</div>
          <select value={filterDepartureDate} onChange={(e) => setFilterDepartureDate(e.target.value)} style={filterSelectStyle}>
            <option value="">All Dates</option>
            {departureDateOptions.map((d) => <option key={d} value={d}>{formatDate(d)}</option>)}
          </select>
        </div>
        {hasFilters && (
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => { setFilterCountry(''); setFilterDepartureDate(''); }}
              style={{ background: 'none', border: '1px solid #32324d', borderRadius: '6px', color: '#a5a5ba', fontSize: '13px', padding: '7px 12px', cursor: 'pointer' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk pick-up time */}
      {selectedIds.size > 0 && (
        <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#212134', border: '1px solid #32324d', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600', marginBottom: '12px' }}>Set Departure Pick Up Details</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#a5a5ba', whiteSpace: 'nowrap' }}>
            {selectedIds.size} record{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#8e8ea0', whiteSpace: 'nowrap' }}>Pick-up Time</label>
            <input
              type="time"
              value={bulkPickUpTime}
              onChange={(e) => { setBulkPickUpTime(e.target.value); setBulkUpdateMsg(null); }}
              style={{
                background: '#374151', border: '1px solid #4b5563', borderRadius: '8px',
                color: '#fff', fontSize: '13px', padding: '8px 12px', colorScheme: 'dark', cursor: 'pointer',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#8e8ea0', whiteSpace: 'nowrap' }}>Pick-up Location</label>
            <LocationCombobox value={bulkPickUpLocation} onChange={(v) => { setBulkPickUpLocation(v); setBulkUpdateMsg(null); }} />
          </div>
          <button
            onClick={handleBulkUpdatePickUpTime}
            disabled={bulkUpdating || (!bulkPickUpTime && !bulkPickUpLocation)}
            style={{
              background: bulkUpdating || (!bulkPickUpTime && !bulkPickUpLocation) ? '#32324d' : '#1a56db',
              border: 'none', borderRadius: '6px', color: bulkUpdating || (!bulkPickUpTime && !bulkPickUpLocation) ? '#6b7280' : '#fff',
              fontSize: '13px', padding: '8px 16px', cursor: bulkUpdating || (!bulkPickUpTime && !bulkPickUpLocation) ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {bulkUpdating ? 'Updating…' : 'Update Records'}
          </button>
          {bulkUpdateMsg && (
            <span style={{ fontSize: '13px', color: bulkUpdateMsg.type === 'success' ? '#31c48d' : '#ee5e52' }}>
              {bulkUpdateMsg.text}
            </span>
          )}
          </div>
        </div>
      )}

      {loading && <p style={{ color: '#a5a5ba', fontSize: '14px' }}>Loading…</p>}
      {error && <p style={{ color: '#ee5e52', fontSize: '14px' }}>{error}</p>}

      {!loading && !error && (
        <div>
          <p style={{ color: '#a5a5ba', fontSize: '13px', marginBottom: '16px' }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}{hasFilters ? ' (filtered)' : ''}
          </p>

          {filtered.length === 0 ? (
            <p style={{ color: '#a5a5ba', fontSize: '14px' }}>
              {hasFilters ? 'No records match the selected filters.' : 'No departure records found.'}
            </p>
          ) : (
            <div>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '32px 2fr 1.5fr 1.5fr 1.2fr 1.5fr 2fr 40px',
                gap: '8px', padding: '0 16px', background: '#212134',
                borderRadius: '6px 6px 0 0', border: '1px solid #32324d', borderBottom: 'none',
                alignItems: 'center',
              }}>
                <FlowbiteCheckbox
                  checked={filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id ?? r.documentId))}
                  indeterminate={selectedIds.size > 0 && !filtered.every((r) => selectedIds.has(r.id ?? r.documentId))}
                  onChange={(e) => {
                    if (e.target.checked || (!e.target.checked && selectedIds.size > 0 && !filtered.every((r) => selectedIds.has(r.id ?? r.documentId)))) {
                      setSelectedIds((prev) => { const next = new Set(prev); filtered.forEach((r) => next.add(r.id ?? r.documentId)); return next; });
                    } else {
                      setSelectedIds((prev) => { const next = new Set(prev); filtered.forEach((r) => next.delete(r.id ?? r.documentId)); return next; });
                    }
                  }}
                />
                {[
                  { label: 'Name', col: 'name' },
                  { label: 'Country', col: 'country' },
                  { label: 'Departure Date', col: 'departure_date' },
                  { label: 'Dep. Time', col: 'departure_time' },
                  { label: 'Pick-up Location', col: 'departure_pick_up_location' },
                  { label: 'Pick-up Time', col: 'departure_pick_up_time' },
                  { label: '', col: null },
                ].map(({ label, col }) =>
                  col ? (
                    <button key={col} onClick={() => handleSort(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: sortKey === col ? '#fff' : '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '11px', fontWeight: '600', padding: '10px 8px 10px 0', textAlign: 'left', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                      {label}<SortIcon col={col} />
                    </button>
                  ) : (
                    <div key="expand" />
                  )
                )}
              </div>

              {/* Rows */}
              {filtered.map((r, idx) => {
                const key = r.id ?? r.documentId;
                const isExpanded = expandedIds.has(key);
                const isLast = idx === filtered.length - 1;
                const member = r.delegation_member ?? {};

                return (
                  <div key={key} style={{
                    border: '1px solid #32324d', borderTop: 'none',
                    borderRadius: isLast && !isExpanded ? '0 0 6px 6px' : '0',
                    background: '#1e1e2e',
                  }}>
                    <div
                      style={{ display: 'grid', gridTemplateColumns: '32px 2fr 1.5fr 1.5fr 1.2fr 1.5fr 2fr 40px', gap: '8px', padding: '12px 16px', cursor: 'pointer', alignItems: 'center' }}
                      onClick={() => toggleExpand(key)}
                    >
                      <FlowbiteCheckbox
                        checked={selectedIds.has(key)}
                        onChange={(e) => toggleSelect(key, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div style={{ color: '#eaeaef', fontSize: '14px', fontWeight: '500' }}>{r.first_name} {r.surname}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '14px' }}>{member.country || '—'}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '13px' }}>{formatDate(r.departure_date)}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '13px' }}>{formatTime(r.departure_time)}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '13px' }}>{r.departure_pick_up_location || '—'}</div>
                      <div style={{ color: '#a5a5ba', fontSize: '13px' }}>{formatTime(r.departure_pick_up_time)}</div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '18px', color: '#7b79ff', lineHeight: 1 }}>{isExpanded ? '▾' : '▸'}</span>
                      </div>
                    </div>

                    {isExpanded && (() => {
                      const data = editData[key] ?? {};
                      const isSaving = savingIds.has(key);
                      const saveMsg = saveMessages[key];
                      const setField = (field, value) =>
                        setEditData((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
                      const fieldStyle = {
                        background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px',
                        color: '#eaeaef', fontSize: '13px', padding: '7px 10px',
                        width: '100%', boxSizing: 'border-box', colorScheme: 'dark',
                      };
                      const labelStyle = {
                        fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase',
                        letterSpacing: '0.05em', marginBottom: '4px', display: 'block',
                      };
                      const fieldGroupStyle = { marginBottom: '12px' };
                      return (
                        <div style={{ padding: '16px 20px 20px', borderTop: '1px solid #32324d', background: '#181826' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#7b79ff', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '12px' }}>Departure</div>
                              <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Date</label>
                                <input type="date" value={data.departure_date || ''} onChange={(e) => setField('departure_date', e.target.value)} style={fieldStyle} />
                              </div>
                              <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Time</label>
                                <input type="time" value={data.departure_time || ''} onChange={(e) => setField('departure_time', e.target.value)} style={fieldStyle} />
                              </div>
                              <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Location</label>
                                <input type="text" value={data.departure_location || ''} onChange={(e) => setField('departure_location', e.target.value)} style={fieldStyle} />
                              </div>
                              <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Flight Number</label>
                                <input type="text" value={data.departure_flight_number || ''} onChange={(e) => setField('departure_flight_number', e.target.value)} style={fieldStyle} />
                              </div>
                              <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Pick-up Time</label>
                                <input type="time" value={data.departure_pick_up_time || ''} onChange={(e) => setField('departure_pick_up_time', e.target.value)} style={fieldStyle} />
                              </div>
                              <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Pick-up Location</label>
                                <LocationCombobox value={data.departure_pick_up_location || ''} onChange={(v) => setField('departure_pick_up_location', v)} />
                              </div>
                              <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Notes</label>
                                <textarea value={data.departure_notes || ''} onChange={(e) => setField('departure_notes', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#7b79ff', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '10px' }}>Submission</div>
                              <DetailRow label="Reference" value={r.travel_details_reference_number} />
                              <DetailRow label="Submitted By" value={r.travel_details_submitted_by} />
                              <DetailRow label="Submitted By Email" value={r.travel_details_submitted_by_email} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #32324d' }}>
                            <button
                              onClick={() => handleSaveRecord(r)}
                              disabled={isSaving}
                              style={{
                                background: isSaving ? '#32324d' : '#4945ff',
                                border: 'none', borderRadius: '6px',
                                color: isSaving ? '#6b7280' : '#fff',
                                fontSize: '13px', padding: '8px 18px',
                                cursor: isSaving ? 'default' : 'pointer', fontWeight: '600',
                              }}
                            >
                              {isSaving ? 'Saving…' : 'Save Changes'}
                            </button>
                            {saveMsg && (
                              <span style={{ fontSize: '13px', color: saveMsg.type === 'success' ? '#31c48d' : '#ee5e52' }}>
                                {saveMsg.text}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageDepartureTravelPage;
