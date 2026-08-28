import React, { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import * as XLSX from 'xlsx';

export const EXPORT_EXCLUDED_STATUSES = ['Other Option Allocated', 'Declined', 'Cancelled'];

const HotelDashboardPage = () => {
  const { get } = useFetchClient();
  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedHotelIds, setExpandedHotelIds] = useState(new Set());
  const [expandedRoomTypes, setExpandedRoomTypes] = useState(new Set());
  const [dailyModal, setDailyModal] = useState(null); // null or { hotel, linkedRoomTypes, allocatedBookings }
  const [exportingHotelId, setExportingHotelId] = useState(null);
  const [roomingListHotelId, setRoomingListHotelId] = useState(null);

  const toggleHotel = (id) =>
    setExpandedHotelIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleRoomType = (id) =>
    setExpandedRoomTypes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleExportData = async (hotel) => {
    setExportingHotelId(hotel.id);
    try {
      // Use the already-loaded bookings state — the same data powering the dashboard stats.
      // This avoids any risk of a separate API call returning incorrect or partial results.
      const rows = bookings.filter(
        (b) =>
          String(b.booking_allocated_hotel?.id) === String(hotel.id) &&
          !EXPORT_EXCLUDED_STATUSES.includes(b.booking_status)
      );

      const fmtExportDate = (val) => {
        if (!val) return '';
        const d = new Date(val);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      };

      const fmtExportDateTime = (val) => {
        if (!val) return '';
        const d = new Date(val);
        return (
          `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ` +
          `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
        );
      };

      const fmtUserName = (user) => {
        if (!user) return '';
        const name = [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
        return name || user.email || '';
      };

      const now = new Date();
      const exportTimestamp = fmtExportDateTime(now);

      const COLUMNS = [
        'booking_reference_room',
        'booking_submitted_by',
        'booking_submitted_by_email',
        'booking_check_in_date',
        'booking_check_out_date',
        'booking_room_type',
        'booking_accessible_room',
        'booking_notes',
        'booking_status',
        'createdAt',
        'createdBy',
        'updatedAt',
        'updatedBy',
      ];

      const dataRows = rows.map((b) => ({
        booking_reference_room: b.booking_reference_room ?? '',
        booking_submitted_by: b.booking_submitted_by ?? '',
        booking_submitted_by_email: b.booking_submitted_by_email ?? '',
        booking_check_in_date: fmtExportDate(b.booking_check_in_date),
        booking_check_out_date: fmtExportDate(b.booking_check_out_date),
        booking_room_type: b.booking_requested_hotel_room_type?.Description ?? '',
        booking_accessible_room: b.booking_accessible_room ?? '',
        booking_notes: b.booking_notes ?? '',
        booking_status: b.booking_status ?? '',
        createdAt: fmtExportDateTime(b.createdAt),
        createdBy: fmtUserName(b.createdBy),
        updatedAt: fmtExportDateTime(b.updatedAt),
        updatedBy: fmtUserName(b.updatedBy),
      }));

      const wb = XLSX.utils.book_new();

      // Build all rows as a single array-of-arrays so !ref is set correctly in one shot
      const sheetData = [
        // Row 1: title/timestamp spanning all columns (merge applied below)
        [`Hotel: ${hotel.hotel_name}    |    Export Date: ${exportTimestamp}`, ...Array(COLUMNS.length - 1).fill('')],
        // Row 2: column headers
        COLUMNS,
        // Rows 3+: data
        ...dataRows.map((row) => COLUMNS.map((col) => row[col] ?? '')),
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Merge header row across all columns
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: COLUMNS.length - 1 } }];

      // Set column widths
      ws['!cols'] = COLUMNS.map((col) => {
        const widths = {
          booking_reference_room: 20,
          booking_submitted_by: 25,
          booking_submitted_by_email: 30,
          booking_check_in_date: 16,
          booking_check_out_date: 16,
          booking_room_type: 28,
          booking_accessible_room: 20,
          booking_notes: 35,
          booking_status: 22,
          createdAt: 20,
          createdBy: 25,
          updatedAt: 20,
          updatedBy: 25,
        };
        return { wch: widths[col] ?? 20 };
      });

      XLSX.utils.book_append_sheet(wb, ws, 'Bookings');

      const safeName = hotel.hotel_name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
      const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      XLSX.writeFile(wb, `${safeName}_bookings_${datePart}.xlsx`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', e);
    } finally {
      setExportingHotelId(null);
    }
  };

  const handleExportRoomingList = async (hotel) => {
    setRoomingListHotelId(hotel.id);
    try {
      const hotelBookings = bookings.filter(
        (b) => String(b.booking_allocated_hotel?.id) === String(hotel.id)
      );

      const fmtExportDate = (val) => {
        if (!val) return '';
        const d = new Date(val);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      };

      const toFullName = (m) => [m?.first_name, m?.surname].filter(Boolean).join(' ').trim();

      const roomingRows = [];
      hotelBookings.forEach((b) => {
        const occupants = Array.isArray(b.booking_allocated_members) ? b.booking_allocated_members : [];
        if (occupants.length === 0) return;

        occupants.forEach((member, idx) => {
          const sharingWith = occupants
            .filter((_, otherIdx) => otherIdx !== idx)
            .map((other) => toFullName(other))
            .filter(Boolean)
            .join(', ');

          roomingRows.push({
            country: member.country ?? '',
            surname: member.surname ?? '',
            first_name: member.first_name ?? '',
            room_type: b.booking_requested_hotel_room_type?.Description ?? '',
            check_in_date: fmtExportDate(b.booking_check_in_date),
            check_out_date: fmtExportDate(b.booking_check_out_date),
            'Sharing With': sharingWith,
          });
        });
      });

      roomingRows.sort((a, b) => {
        const aKey = `${a.country}|${a.surname}|${a.first_name}`.toLowerCase();
        const bKey = `${b.country}|${b.surname}|${b.first_name}`.toLowerCase();
        if (aKey < bKey) return -1;
        if (aKey > bKey) return 1;
        return 0;
      });

      const COLUMNS = ['country', 'surname', 'first_name', 'room_type', 'check_in_date', 'check_out_date', 'Sharing With'];
      const roomingSheetData = [
        COLUMNS,
        ...roomingRows.map((row) => COLUMNS.map((col) => row[col] ?? '')),
      ];
      const ws = XLSX.utils.aoa_to_sheet(roomingSheetData);
      ws['!cols'] = [
        { wch: 20 }, // country
        { wch: 22 }, // surname
        { wch: 22 }, // first_name
        { wch: 28 }, // room_type
        { wch: 16 }, // check_in_date
        { wch: 16 }, // check_out_date
        { wch: 40 }, // Sharing With
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rooming List');

      const now = new Date();
      const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const safeName = hotel.hotel_name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
      XLSX.writeFile(wb, `${safeName}_rooming_list_${datePart}.xlsx`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Rooming list export failed:', e);
    } finally {
      setRoomingListHotelId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      get('/content-manager/collection-types/api::accommodation-hotel.accommodation-hotel?pageSize=100&sort=hotel_name:asc'),
      get('/content-manager/collection-types/api::hotel-room-type-link.hotel-room-type-link?pageSize=500&sort=Description:asc&populate[accommodation_hotel]=*&populate[accommodation_room_type]=*&populate[hotel_room_inventory]=*'),
      get('/content-manager/collection-types/api::accommodation-booking.accommodation-booking?pageSize=1000&fields[0]=booking_status&fields[1]=booking_reference_room&fields[2]=booking_country&fields[3]=booking_submitted_by&fields[4]=booking_submitted_by_email&fields[5]=booking_check_in_date&fields[6]=booking_check_out_date&fields[7]=booking_accessible_room&fields[8]=booking_notes&fields[9]=createdAt&fields[10]=updatedAt&populate[booking_allocated_hotel]=id,hotel_name&populate[booking_requested_hotel_room_type][populate][accommodation_hotel]=id,hotel_name&populate[booking_requested_hotel_room_type][populate][accommodation_room_type]=id,people_per_room&populate[booking_allocated_members][fields][0]=country&populate[booking_allocated_members][fields][1]=surname&populate[booking_allocated_members][fields][2]=first_name&populate[createdBy]=firstname,lastname,email&populate[updatedBy]=firstname,lastname,email'),
    ])
      .then(([hotelsRes, roomTypesRes, bookingsRes]) => {
        setHotels(hotelsRes.data?.results ?? hotelsRes.data?.data ?? []);
        setRoomTypes(roomTypesRes.data?.results ?? roomTypesRes.data?.data ?? []);
        setBookings(bookingsRes.data?.results ?? bookingsRes.data?.data ?? []);
      })
      .catch(() => setError('Failed to load hotel data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>Hotel Dashboard</h1>
        <div style={{ color: '#a5a5ba', fontSize: '14px' }}>Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>Hotel Dashboard</h1>
        <div style={{ color: '#ee5e52', fontSize: '14px' }}>{error}</div>
      </div>
    );
  }

  const fmtDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Build per-hotel stats
  const hotelStats = hotels.map((hotel) => {
    const linkedRoomTypes = roomTypes.filter(
      (rt) => String(rt.accommodation_hotel?.id) === String(hotel.id)
    );
    const allocatedBookings = bookings.filter(
      (b) => String(b.booking_allocated_hotel?.id) === String(hotel.id)
    );
    const requestedBookings = bookings.filter((b) => {
      const rtHotelId = b.booking_requested_hotel_room_type?.accommodation_hotel?.id;
      return rtHotelId != null && String(rtHotelId) === String(hotel.id);
    });
    const statusCounts = allocatedBookings.reduce((acc, b) => {
      const s = b.booking_status ?? 'Unknown';
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {});
    return { hotel, linkedRoomTypes, allocatedBookings, requestedBookings, statusCounts };
  });

  const STATUS_COLORS = {
    Allocated: '#22c55e',
    Confirmed: '#4ade80',
    Pending: '#f97316',
    Declined: '#ef4444',
    'Waiting List': '#eab308',
    'Other Option Allocated': '#6b7280',
    Redundant: '#6b7280',
    Cancelled: '#ef4444',
  };

  const cardStyle = {
    background: '#212134',
    border: '1px solid #32324d',
    borderRadius: '8px',
    padding: '20px 24px',
    marginBottom: '20px',
  };

  const statBoxStyle = {
    background: '#181826',
    border: '1px solid #32324d',
    borderRadius: '6px',
    padding: '12px 16px',
    textAlign: 'center',
    minWidth: '80px',
  };

  const colHdr = { fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' };

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>
        Hotel Dashboard
      </h1>

      {hotels.length === 0 && (
        <div style={{ color: '#a5a5ba', fontSize: '14px' }}>No hotels found.</div>
      )}

      {hotelStats.map(({ hotel, linkedRoomTypes, allocatedBookings, requestedBookings, statusCounts }) => (
        <div key={hotel.id} style={cardStyle}>
          {(() => {
            const isHotelOpen = expandedHotelIds.has(hotel.id);
            return (
              <>
          {/* Hotel name */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => toggleHotel(hotel.id)}
                aria-expanded={isHotelOpen}
                aria-label={`${isHotelOpen ? 'Collapse' : 'Expand'} ${hotel.hotel_name}`}
                title={`${isHotelOpen ? 'Collapse' : 'Expand'} hotel details`}
                style={{ background: 'none', border: '1px solid #32324d', borderRadius: '4px', color: '#a5a5ba', fontSize: '16px', lineHeight: 1, padding: '4px 8px', cursor: 'pointer' }}
              >
                {isHotelOpen ? '▾' : '▸'}
              </button>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#fff', margin: 0 }}>
                {hotel.hotel_name}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {hotel.currency && (
                <span style={{ fontSize: '12px', color: '#8e8ea0', background: '#181826', border: '1px solid #32324d', borderRadius: '4px', padding: '3px 8px' }}>
                  {hotel.currency}
                </span>
              )}
              <button
                onClick={() => setDailyModal({ hotel, linkedRoomTypes, allocatedBookings })}
                style={{ background: 'none', border: '1px solid #4945ff', borderRadius: '4px', color: '#7b79ff', fontSize: '12px', padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Daily Bookings
              </button>
              <button
                onClick={() => handleExportRoomingList(hotel)}
                disabled={roomingListHotelId === hotel.id}
                style={{ background: 'none', border: '1px solid #22c55e', borderRadius: '4px', color: roomingListHotelId === hotel.id ? '#6b7280' : '#22c55e', fontSize: '12px', padding: '4px 10px', cursor: roomingListHotelId === hotel.id ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
              >
                {roomingListHotelId === hotel.id ? 'Preparing…' : 'Rooming List'}
              </button>
              <button
                onClick={() => handleExportData(hotel)}
                disabled={exportingHotelId === hotel.id}
                style={{ background: 'none', border: '1px solid #32324d', borderRadius: '4px', color: exportingHotelId === hotel.id ? '#6b7280' : '#a5a5ba', fontSize: '12px', padding: '4px 10px', cursor: exportingHotelId === hotel.id ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
              >
                {exportingHotelId === hotel.id ? 'Exporting…' : 'Export Data'}
              </button>
            </div>
          </div>

          {isHotelOpen && (
            <>
          {/* Summary stats */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={statBoxStyle}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#f97316' }}>{requestedBookings.filter(b => b.booking_status === 'Pending').length}</div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>◉ Pending</div>
            </div>
            <div style={statBoxStyle}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#7b79ff' }}>{allocatedBookings.filter(b => b.booking_status === 'Allocated').length}</div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>● Allocated</div>
            </div>
            <div style={statBoxStyle}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#22c55e' }}>{allocatedBookings.filter(b => b.booking_status === 'Confirmed').length}</div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>✓ Confirmed</div>
            </div>
          </div>

          {/* Status breakdown */}
          {Object.keys(statusCounts).length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Booking Status Breakdown</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#181826', border: '1px solid #32324d', borderRadius: '4px', padding: '4px 10px', fontSize: '13px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[status] ?? '#6b7280', flexShrink: 0 }} />
                    <span style={{ color: '#c0c0cf' }}>{status}</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room types list */}
          {linkedRoomTypes.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Room Types</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {linkedRoomTypes.map((rt) => {
                  const roomBookings = allocatedBookings.filter(
                    (b) => b.booking_requested_hotel_room_type?.id === rt.id
                  );
                  // Board-basis links (B&B / Half Board / Full Board) can share the same physical
                  // room inventory, so total/available must be computed across every sibling link
                  // that draws from the same inventory record, not just this one.
                  const inventoryId = rt.hotel_room_inventory?.id;
                  const siblingIds = inventoryId != null
                    ? linkedRoomTypes.filter((r) => r.hotel_room_inventory?.id === inventoryId).map((r) => r.id)
                    : [rt.id];
                  const pooledBookingsCount = allocatedBookings.filter(
                    (b) => siblingIds.includes(b.booking_requested_hotel_room_type?.id)
                  ).length;
                  const totalRooms = rt.hotel_room_inventory?.total_rooms ?? null;
                  const isOpen = expandedRoomTypes.has(rt.id);
                  return (
                    <div key={rt.id} style={{ border: '1px solid #32324d', borderRadius: '4px', overflow: 'hidden' }}>
                      {/* Clickable header row */}
                      <button
                        onClick={() => toggleRoomType(rt.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: isOpen ? '#1e1e2e' : '#181826', border: 'none', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', flexWrap: 'wrap', gap: '8px', textAlign: 'left' }}
                      >
                        <span style={{ color: '#fff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#8e8ea0', fontSize: '11px' }}>{isOpen ? '▾' : '▸'}</span>
                          {rt.Description ?? `Room Type #${rt.id}`}
                        </span>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {rt.room_cost_per_person != null && (
                            <span style={{ color: '#8e8ea0', fontSize: '12px' }}>
                              {parseFloat(rt.room_cost_per_person).toFixed(2)} {hotel.currency ?? ''}
                              <span style={{ color: '#6b7280' }}> /person</span>
                            </span>
                          )}
                          {rt.accommodation_room_type?.people_per_room != null && (
                            <span style={{ color: '#8e8ea0', fontSize: '12px' }}>
                              {rt.accommodation_room_type.people_per_room} pax
                            </span>
                          )}
                          <span style={{ color: '#c0c0cf', fontSize: '12px' }}>
                            <span style={{ color: '#6b7280' }}>Total Rooms: </span>
                            <span style={{ fontWeight: '600' }}>{totalRooms ?? '—'}</span>
                          </span>
                          <span style={{ color: '#7b79ff', fontSize: '12px', fontWeight: '600' }}>
                            {roomBookings.length} booked
                          </span>
                          <span style={{ color: '#c0c0cf', fontSize: '12px' }}>
                            <span style={{ color: '#6b7280' }}>Rooms Available: </span>
                            <span style={{ fontWeight: '600', color: totalRooms != null ? ((totalRooms - pooledBookingsCount) > 0 ? '#22c55e' : '#ee5e52') : '#c0c0cf' }}>
                              {totalRooms != null ? totalRooms - pooledBookingsCount : '—'}
                            </span>
                          </span>
                        </div>
                      </button>

                      {/* Expanded booking rows */}
                      {isOpen && (
                        <div style={{ borderTop: '1px solid #32324d', marginLeft: '24px', borderLeft: '2px solid #32324d' }}>
                          {roomBookings.length === 0 ? (
                            <div style={{ padding: '10px 12px', fontSize: '13px', color: '#a5a5ba', fontStyle: 'italic' }}>No bookings for this room type.</div>
                          ) : (
                            <>
                              {/* Column headers */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px 100px', gap: '0 12px', padding: '6px 12px', background: '#13131f', borderBottom: '1px solid #32324d' }}>
                                {['Room Reference', 'Country', 'Submitted By', 'Check In', 'Check Out'].map((h) => (
                                  <div key={h} style={colHdr}>{h}</div>
                                ))}
                              </div>
                              {roomBookings.map((b) => (
                                <div
                                  key={b.id}
                                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px 100px', gap: '0 12px', padding: '8px 12px', borderBottom: '1px solid #32324d', fontSize: '13px', alignItems: 'center' }}
                                >
                                  <span style={{ color: '#fff' }}>{b.booking_reference_room || `#${b.id}`}</span>
                                  <span style={{ color: '#c0c0cf' }}>{b.booking_country || '—'}</span>
                                  <span style={{ color: '#c0c0cf' }}>{b.booking_submitted_by || '—'}</span>
                                  <span style={{ color: '#a5a5ba' }}>{fmtDate(b.booking_check_in_date)}</span>
                                  <span style={{ color: '#a5a5ba' }}>{fmtDate(b.booking_check_out_date)}</span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
            </>
          )}
              </>
            );
          })()}
        </div>
      ))}

      {/* ── Daily Bookings Modal ── */}
      {dailyModal && (() => {
        const mRoomTypes = dailyModal.linkedRoomTypes;
        const mBookings = dailyModal.allocatedBookings;
        const toDateStr = (val) => val ? String(val).slice(0, 10) : '';
        const fmtDay = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
        const bookingsWithDates = mBookings.filter(b => b.booking_check_in_date && b.booking_check_out_date);
        let days = [];
        if (bookingsWithDates.length > 0) {
          const cis = bookingsWithDates.map(b => toDateStr(b.booking_check_in_date));
          const cos = bookingsWithDates.map(b => toDateStr(b.booking_check_out_date));
          const minDay = cis.reduce((a, b) => a < b ? a : b);
          const maxDay = cos.reduce((a, b) => a > b ? a : b);
          const cur = new Date(minDay + 'T00:00:00Z');
          const end = new Date(maxDay + 'T00:00:00Z');
          while (cur <= end) { days.push(cur.toISOString().slice(0, 10)); cur.setUTCDate(cur.getUTCDate() + 1); }
        }
        const getCount = (rtId, day) => mBookings.filter(b => {
          if (String(b.booking_requested_hotel_room_type?.id) !== String(rtId)) return false;
          const ci = toDateStr(b.booking_check_in_date);
          const co = toDateStr(b.booking_check_out_date);
          return ci && co && ci <= day && co > day;
        }).length;
        return (
          <div key="daily-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '8px', width: '90vw', maxWidth: '1100px', maxHeight: '85vh', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #32324d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Bookings By Day</h2>
                  <p style={{ fontSize: '13px', color: '#8e8ea0', margin: '4px 0 0' }}>{dailyModal.hotel.hotel_name}</p>
                </div>
                <button onClick={() => setDailyModal(null)} style={{ background: 'none', border: 'none', color: '#8e8ea0', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '4px 8px' }}>✕</button>
              </div>
              <div style={{ overflow: 'auto', flex: 1 }}>
                {days.length === 0 ? (
                  <div style={{ padding: '24px', color: '#a5a5ba', fontSize: '14px' }}>No bookings with check-in/check-out dates found.</div>
                ) : (
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#13131f', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '11px', borderBottom: '1px solid #32324d', whiteSpace: 'nowrap', minWidth: '90px' }}>Date</th>
                        {mRoomTypes.map(rt => (
                          <th key={rt.id} style={{ padding: '10px 12px', textAlign: 'center', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '11px', borderBottom: '1px solid #32324d', whiteSpace: 'nowrap', borderLeft: '1px solid #32324d' }}>
                            {rt.Description ?? `Type #${rt.id}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((day, idx) => (
                        <tr key={day} style={{ background: idx % 2 === 0 ? '#1e1e2e' : '#181826' }}>
                          <td style={{ padding: '8px 16px', color: '#c0c0cf', borderBottom: '1px solid #32324d', whiteSpace: 'nowrap' }}>{fmtDay(day)}</td>
                          {mRoomTypes.map(rt => {
                            const count = getCount(rt.id, day);
                            return (
                              <td key={rt.id} style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #32324d', borderLeft: '1px solid #32324d', color: count > 0 ? '#fff' : '#32324d', fontWeight: count > 0 ? '600' : 'normal', background: count > 0 ? 'rgba(73,69,255,0.1)' : 'transparent' }}>
                                {count > 0 ? count : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={{ padding: '14px 24px', borderTop: '1px solid #32324d', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setDailyModal(null)} style={{ background: 'none', border: '1px solid #32324d', borderRadius: '6px', color: '#c0c0cf', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default HotelDashboardPage;
