import React, { useState, useEffect, useCallback } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { unique, getCurrencySymbol, STATUS_SYMBOL, selectStyle } from './shared';

const ManageAccommodationPage = () => {
  const { get, put, post } = useFetchClient();

  // All bookings fetched for dropdown population
  const [allBookings, setAllBookings] = useState([]);
  // Filtered bookings for the list panel
  const [filteredBookings, setFilteredBookings] = useState([]);
  // Selected filter values
  const [filterRef, setFilterRef] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterSubmittedBy, setFilterSubmittedBy] = useState('');
  const [filterHotelOption, setFilterHotelOption] = useState('');
  const [filterAllocated, setFilterAllocated] = useState('');
  const [filterRequestedHotel, setFilterRequestedHotel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRoomRef, setFilterRoomRef] = useState('');
  // Selected room reference (list item)
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState('booking_reference_room');
  const [sortDir, setSortDir] = useState('asc');

  // Allocate Hotel Choice state
  const [allHotels, setAllHotels] = useState([]);
  const [allRoomTypes, setAllRoomTypes] = useState([]);
  // Map of accommodation_room_type id -> people_per_room for reliable lookup
  const [peoplePerRoomMap, setPeoplePerRoomMap] = useState({});
  const [statusOptions] = useState(['Pending', 'Allocated', 'Confirmed', 'Declined', 'Waiting List', 'Other Option Allocated', 'Redundant', 'Cancelled']);
  const [allocateHotelId, setAllocateHotelId] = useState('');
  const [allocateSaving, setAllocateSaving] = useState(false);
  const [allocateSaveMsg, setAllocateSaveMsg] = useState(null);
  const [showAllocatePreviewModal, setShowAllocatePreviewModal] = useState(false);
  const [allocatePreviewData, setAllocatePreviewData] = useState(null); // { toAllocate, toOther, hotelName }
  const [allocatePreviewLoading, setAllocatePreviewLoading] = useState(false);

  // Capacity over-limit warning modal state
  const [showCapacityWarningModal, setShowCapacityWarningModal] = useState(false);
  const [capacityWarningData, setCapacityWarningData] = useState(null); // { overCapacity: [...], previewData }

  // Detail edit form state
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editSaveMsg, setEditSaveMsg] = useState(null);

  // Send Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmSending, setConfirmSending] = useState(false);
  const [confirmSendMsg, setConfirmSendMsg] = useState(null);

  // Unconfirmed-status warning modal state (shown when booking_send_confirmation is checked but status !== 'Confirmed')
  const [showUnconfirmedWarning, setShowUnconfirmedWarning] = useState(false);
  const [pendingSavePayload, setPendingSavePayload] = useState(null);

  // Occupant management state
  const [allMembers, setAllMembers] = useState([]);
  const [addMemberId, setAddMemberId] = useState('');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Fetch hotels for the Allocate Hotel Choice dropdown
  useEffect(() => {
    get('/content-manager/collection-types/api::accommodation-hotel.accommodation-hotel?pageSize=100&fields[0]=hotel_name&sort=hotel_name:asc')
      .then(({ data }) => setAllHotels(data?.results ?? data?.data ?? []))
      .catch(() => {});
  }, []);

  // booking_status options — kept in sync with the schema enum
  const FALLBACK_STATUS_OPTIONS = ['Pending', 'Allocated', 'Confirmed', 'Declined', 'Waiting List', 'Other Option Allocated', 'Redundant', 'Cancelled'];

  // Fetch hotel-room-type-link records for the editable dropdown (with hotel and room type populated)
  useEffect(() => {
    get('/content-manager/collection-types/api::hotel-room-type-link.hotel-room-type-link?pageSize=500&sort=Description:asc&populate[accommodation_hotel]=*&populate[accommodation_room_type]=*')
      .then(({ data }) => setAllRoomTypes(data?.results ?? data?.data ?? []))
      .catch(() => {});
  }, []);

  // Fetch all delegation members for occupant assignment
  useEffect(() => {
    get('/content-manager/collection-types/api::add-delegation-member.add-delegation-member?pageSize=2000&fields[0]=first_name&fields[1]=surname&fields[2]=country&populate[role]=*&sort=surname:asc')
      .then(({ data }) => setAllMembers(data?.results ?? data?.data ?? []))
      .catch(() => {});
  }, []);

  // Fetch accommodation-room-type records to build a reliable id -> people_per_room map
  useEffect(() => {
    get('/content-manager/collection-types/api::accommodation-room-type.accommodation-room-type?pageSize=100&fields[0]=people_per_room')
      .then(({ data }) => {
        const map = {};
        (data?.results ?? data?.data ?? []).forEach((rt) => { map[rt.id] = rt.people_per_room ?? 1; });
        setPeoplePerRoomMap(map);
      })
      .catch(() => {});
  }, []);

  // Fetch ALL bookings once for dropdown options
  useEffect(() => {
    setLoading(true);
    get('/content-manager/collection-types/api::accommodation-booking.accommodation-booking?pageSize=1000&fields[0]=booking_reference_submission&fields[1]=booking_country&fields[2]=booking_submitted_by&fields[3]=booking_request_hotel_option_choice&fields[4]=booking_reference_room&fields[5]=createdAt&fields[6]=booking_type&populate[0]=booking_allocated_hotel')
      .then(({ data }) => setAllBookings(data?.results ?? data?.data ?? []))
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, []);

  // Derive dropdown options from all bookings
  const refOptions = unique(allBookings.map((b) => b.booking_reference_submission));
  const countryOptions = unique(allBookings.map((b) => b.booking_country));
  const submittedByOptions = unique(allBookings.map((b) => b.booking_submitted_by));
  const roomRefOptions = unique(allBookings.map((b) => b.booking_reference_room));
  const hotelOptionMap = allBookings.reduce((acc, b) => {
    const opt = b.booking_request_hotel_option_choice;
    if (opt != null && !acc[String(opt)]) {
      acc[String(opt)] = b.booking_allocated_hotel?.hotel_name ?? null;
    }
    return acc;
  }, {});
  const hotelOptionOptions = Object.keys(hotelOptionMap).sort((a, b) => Number(a) - Number(b));

  // Fetch filtered bookings whenever a filter changes
  const fetchFiltered = useCallback(({ preserveSelection = false } = {}) => {
    const params = new URLSearchParams();
    params.set('pageSize', '1000');
    params.set('populate[booking_allocated_hotel]', '*');
    params.set('populate[booking_requested_hotel_room_type][populate][accommodation_hotel]', '*');
    params.set('populate[booking_requested_hotel_room_type][populate][accommodation_room_type]', '*');
    params.set('populate[booking_allocated_members][populate][role]', '*');
    if (filterRef) params.set('filters[booking_reference_submission][$eq]', filterRef);
    if (filterCountry) params.set('filters[booking_country][$eq]', filterCountry);
    if (filterSubmittedBy) params.set('filters[booking_submitted_by][$eq]', filterSubmittedBy);
    if (filterHotelOption) params.set('filters[booking_request_hotel_option_choice][$eq]', filterHotelOption);
    if (filterRoomRef) params.set('filters[booking_reference_room][$eq]', filterRoomRef);

    if (!filterRef && !filterCountry && !filterSubmittedBy && !filterHotelOption && !filterStatus && !filterAllocated && !filterRequestedHotel && !filterRoomRef) {
      setFilteredBookings([]);
      if (!preserveSelection) setSelectedId(null);
      return;
    }

    setListLoading(true);
    if (!preserveSelection) setSelectedId(null);
    get(`/content-manager/collection-types/api::accommodation-booking.accommodation-booking?${params.toString()}`)
      .then(({ data }) => setFilteredBookings(data?.results ?? data?.data ?? []))
      .catch(() => setError('Failed to load filtered bookings.'))
      .finally(() => setListLoading(false));
  }, [filterRef, filterCountry, filterSubmittedBy, filterHotelOption, filterStatus, filterAllocated, filterRequestedHotel, filterRoomRef]);

  useEffect(() => { fetchFiltered(); }, [filterRef, filterCountry, filterSubmittedBy, filterHotelOption, filterStatus, filterAllocated, filterRequestedHotel, filterRoomRef]);

  // Fetch data and show the preview modal before committing any changes.
  // First performs a capacity check — if any room type would be over-allocated a warning modal is shown.
  const handleAllocatePreview = async () => {
    if (!allocateHotelId || displayBookings.length === 0) return;
    setAllocatePreviewLoading(true);
    setAllocateSaveMsg(null);
    try {
      // Use allRoomTypes (already fetched with accommodation_hotel populated) to
      // determine which hotel each booking's requested room type belongs to.
      // The nested populate on fetchFiltered does not reliably return accommodation_hotel
      // from the Content Manager API, so we join via the cached allRoomTypes lookup.
      const getRoomTypeHotelId = (b) => {
        const rtId = b.booking_requested_hotel_room_type?.id;
        if (!rtId) return null;
        const rt = allRoomTypes.find((r) => r.id === rtId);
        return rt?.accommodation_hotel?.id ?? null;
      };

      const toAllocate = displayBookings.filter(
        (b) => String(getRoomTypeHotelId(b)) === String(allocateHotelId)
      );
      const toOther = displayBookings.filter(
        (b) => String(getRoomTypeHotelId(b)) !== String(allocateHotelId)
      );
      const hotelName = allHotels.find((h) => String(h.id) === String(allocateHotelId))?.hotel_name ?? '—';
      const previewData = { toAllocate, toOther, hotelName };

      // ── Capacity check ────────────────────────────────────────────────────
      // Count how many bookings per room-type-link are being newly set to Allocated
      // (exclude those already Allocated or Confirmed — they're already counted in existing totals)
      const roomTypeNewCount = {};
      for (const b of toAllocate) {
        const rtId = String(b.booking_requested_hotel_room_type?.id ?? '');
        if (!rtId) continue;
        if (b.booking_status === 'Allocated' || b.booking_status === 'Confirmed') continue;
        roomTypeNewCount[rtId] = (roomTypeNewCount[rtId] ?? 0) + 1;
      }

      const roomTypeIdsToCheck = Object.keys(roomTypeNewCount);
      const overCapacity = [];

      if (roomTypeIdsToCheck.length > 0) {
        // For each room type, query all existing Allocated+Confirmed bookings to calculate availability
        const countResults = await Promise.all(
          roomTypeIdsToCheck.map(async (rtId) => {
            const { data } = await get(
              `/content-manager/collection-types/api::accommodation-booking.accommodation-booking?pageSize=2000&fields[0]=booking_status&filters[booking_requested_hotel_room_type][id][$eq]=${rtId}`
            );
            const existingBookings = data?.results ?? data?.data ?? [];
            const existingCount = existingBookings.filter(
              (b) => b.booking_status === 'Allocated' || b.booking_status === 'Confirmed'
            ).length;
            const rtLink = allRoomTypes.find((r) => String(r.id) === String(rtId));
            const totalRooms = rtLink?.total_rooms ?? 0;
            const available = totalRooms - existingCount;
            const newAllocating = roomTypeNewCount[rtId];
            return { rtId, rtLink, totalRooms, existingCount, available, newAllocating };
          })
        );

        for (const result of countResults) {
          if (result.newAllocating > result.available) {
            overCapacity.push({
              roomTypeName: result.rtLink?.Description ?? `Room Type ${result.rtId}`,
              totalRooms: result.totalRooms,
              existingCount: result.existingCount,
              newAllocating: result.newAllocating,
              available: result.available,
            });
          }
        }
      }

      if (overCapacity.length > 0) {
        setCapacityWarningData({ overCapacity, previewData });
        setShowCapacityWarningModal(true);
      } else {
        setAllocatePreviewData(previewData);
        setShowAllocatePreviewModal(true);
      }
    } catch (e) {
      setAllocateSaveMsg(`Error: ${e?.response?.data?.error?.message ?? e?.message ?? 'Unknown error'}`);
    } finally {
      setAllocatePreviewLoading(false);
    }
  };

  // Called when the user confirms they want to proceed despite the capacity warning
  const handleCapacityWarningConfirm = () => {
    const previewData = capacityWarningData?.previewData;
    setShowCapacityWarningModal(false);
    setCapacityWarningData(null);
    if (previewData) {
      setAllocatePreviewData(previewData);
      setShowAllocatePreviewModal(true);
    }
  };

  const handleAllocateSave = async () => {
    if (!allocatePreviewData) return;
    const { toAllocate, toOther } = allocatePreviewData;
    setShowAllocatePreviewModal(false);
    setAllocateSaving(true);
    setAllocateSaveMsg(null);
    try {
      const allBookings = [...toAllocate, ...toOther];
      await Promise.all([
        ...toAllocate.map((b) =>
          put(`/content-manager/collection-types/api::accommodation-booking.accommodation-booking/${b.documentId}`, {
            booking_allocated_hotel: { connect: [{ id: Number(allocateHotelId) }], disconnect: [] },
            booking_status: 'Allocated',
          })
        ),
        ...toOther.map((b) =>
          put(`/content-manager/collection-types/api::accommodation-booking.accommodation-booking/${b.documentId}`, {
            booking_status: 'Other Option Allocated',
          })
        ),
      ]);
      // Publish each document so the public API reflects the updated status
      await Promise.all(
        allBookings.map((b) =>
          post(`/content-manager/collection-types/api::accommodation-booking.accommodation-booking/${b.documentId}/actions/publish`, {})
        )
      );

      setAllocateSaveMsg(`Allocated ${toAllocate.length} booking(s); marked ${toOther.length} as Other Option Allocated.`);

      // Optimistically update filteredBookings so the list and Send Confirmation button
      // reflect the new statuses immediately. We do NOT re-fetch from the server here
      // because Strapi Cloud can return stale data immediately after a PUT, overwriting
      // the correct state. The data will be refreshed on the next filter change.
      const allocatedHotel = allHotels.find((h) => String(h.id) === String(allocateHotelId)) ?? null;
      const allocatedIds = new Set(toAllocate.map((b) => b.id));
      const otherIds = new Set(toOther.map((b) => b.id));
      setFilteredBookings((prev) => prev.map((b) => {
        if (allocatedIds.has(b.id)) return { ...b, booking_status: 'Allocated', booking_allocated_hotel: allocatedHotel };
        if (otherIds.has(b.id))    return { ...b, booking_status: 'Other Option Allocated' };
        return b;
      }));
    } catch (e) {
      setAllocateSaveMsg(`Error: ${e?.response?.data?.error?.message ?? e?.message ?? 'Unknown error'}`);
    } finally {
      setAllocateSaving(false);
      setAllocatePreviewData(null);
    }
  };

  const selectedBooking = filteredBookings.find((b) => b.id === selectedId) ?? null;

  // Sync edit form when selection changes OR when underlying data refreshes
  useEffect(() => {
    if (!selectedBooking) { setEditForm(null); setEditSaveMsg(null); return; }
    setEditSaveMsg(null);
    setEditForm({
      booking_type: selectedBooking.booking_type ?? '',
      booking_country: selectedBooking.booking_country ?? '',
      booking_check_in_date: selectedBooking.booking_check_in_date ?? '',
      booking_check_out_date: selectedBooking.booking_check_out_date ?? '',
      booking_accessible_room: selectedBooking.booking_accessible_room ?? 'No',
      booking_status: selectedBooking.booking_status ?? 'Pending',
      booking_request_hotel_option_choice: selectedBooking.booking_request_hotel_option_choice ?? '',
      booking_requested_hotel_room_cost_per_person: selectedBooking.booking_requested_hotel_room_cost_per_person ?? '',
      booking_submitted_by: selectedBooking.booking_submitted_by ?? '',
      booking_submitted_by_email: selectedBooking.booking_submitted_by_email ?? '',
      booking_send_confirmation: selectedBooking.booking_send_confirmation ?? false,
      booking_reference_submission: selectedBooking.booking_reference_submission ?? '',
      booking_reference_room: selectedBooking.booking_reference_room ?? '',
      booking_notes: selectedBooking.booking_notes ?? '',
      booking_allocated_hotel: selectedBooking.booking_allocated_hotel?.id ?? '',
      booking_requested_hotel_room_type: selectedBooking.booking_requested_hotel_room_type?.id ?? '',
      booking_allocated_members: selectedBooking.booking_allocated_members ?? [],
    });
    setAddMemberId('');
  }, [selectedId, filteredBookings]);

  const handleEditField = (field, value) => {
    if (field === 'booking_requested_hotel_room_type') {
      const roomType = allRoomTypes.find((r) => String(r.id) === String(value));
      setEditForm((prev) => ({
        ...prev,
        [field]: value,
        booking_requested_hotel_room_cost_per_person: roomType?.room_cost_per_person ?? prev.booking_requested_hotel_room_cost_per_person,
      }));
    } else {
      setEditForm((prev) => ({ ...prev, [field]: value }));
    }
    setEditSaveMsg(null);
  };

  // Core save logic — called directly or after the user confirms the unconfirmed-status warning
  const executeSave = async (skipWarning = false) => {
    if (!selectedBooking || !editForm) return;
    const triggerRoomConfirmation = editForm.booking_send_confirmation === true;

    // If the checkbox is ticked but the status isn't 'Confirmed', show a warning first (unless already bypassed)
    if (triggerRoomConfirmation && editForm.booking_status !== 'Confirmed' && !skipWarning) {
      setShowUnconfirmedWarning(true);
      return;
    }

    setShowUnconfirmedWarning(false);
    setPendingSavePayload(null);
    setEditSaving(true);
    setEditSaveMsg(null);
    try {
      const payload = {
        ...editForm,
        booking_request_hotel_option_choice: editForm.booking_request_hotel_option_choice !== '' ? Number(editForm.booking_request_hotel_option_choice) : null,
        booking_requested_hotel_room_cost_per_person: editForm.booking_requested_hotel_room_cost_per_person !== '' ? Number(editForm.booking_requested_hotel_room_cost_per_person) : null,
        booking_allocated_hotel: editForm.booking_allocated_hotel !== ''
          ? { connect: [{ id: Number(editForm.booking_allocated_hotel) }], disconnect: [] }
          : { disconnect: [] },
        booking_requested_hotel_room_type: editForm.booking_requested_hotel_room_type !== ''
          ? { connect: [{ id: Number(editForm.booking_requested_hotel_room_type) }], disconnect: [] }
          : { disconnect: [] },
        booking_allocated_members: {
          set: (editForm.booking_allocated_members ?? []).map((m) => ({ id: m.id })),
        },
      };
      await put(`/content-manager/collection-types/api::accommodation-booking.accommodation-booking/${selectedBooking.documentId}`, payload);
      // Publish so the public API reflects the updated values
      await post(`/content-manager/collection-types/api::accommodation-booking.accommodation-booking/${selectedBooking.documentId}/actions/publish`, {});
      if (triggerRoomConfirmation) {
        const { data: confirmData } = await post('/api/accommodation-bookings/send-room-confirmation', { booking_reference_room: selectedBooking.booking_reference_room });
        // Immediately reflect the sent timestamp in the list so the UI updates without waiting for fetchFiltered
        if (confirmData?.confirmation_sent_at) {
          setFilteredBookings((prev) =>
            prev.map((b) =>
              b.id === selectedBooking.id
                ? { ...b, booking_confirmation_sent_at: confirmData.confirmation_sent_at, booking_send_confirmation: false }
                : b
            )
          );
        }
      }
      setEditSaveMsg('Saved successfully.');
      fetchFiltered({ preserveSelection: true });
    } catch (e) {
      setEditSaveMsg(`Error: ${e?.response?.data?.error?.message ?? e?.message ?? 'Unknown error'}`);
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddMember = (memberId) => {
    const member = allMembers.find((m) => String(m.id) === String(memberId));
    if (!member) return;
    setEditForm((prev) => ({
      ...prev,
      booking_allocated_members: [...(prev.booking_allocated_members ?? []), member],
    }));
    setAddMemberId('');
    setEditSaveMsg(null);
  };

  const handleRemoveMember = (memberId) => {
    setEditForm((prev) => ({
      ...prev,
      booking_allocated_members: (prev.booking_allocated_members ?? []).filter((m) => m.id !== memberId),
    }));
    setEditSaveMsg(null);
  };

  const handleEditSave = () => executeSave(false);

  const filtersActive = filterRef || filterCountry || filterSubmittedBy || filterHotelOption || filterAllocated || filterRequestedHotel || filterStatus || filterRoomRef;

  // Values for the Send Confirmation modal — derived from all allocated bookings currently displayed
  const allocatedBookings = filteredBookings.filter((b) => b.booking_status === 'Allocated');
  const confirmSubmittedBy    = [...new Set(allocatedBookings.map((b) => b.booking_submitted_by).filter(Boolean))].join(', ');
  const confirmSubmissionRefs = [...new Set(allocatedBookings.map((b) => b.booking_reference_submission).filter(Boolean))];
  const confirmSubmissionRef  = confirmSubmissionRefs.join(', ');

  const handleSendConfirmation = async () => {
    setConfirmSending(true);
    setConfirmSendMsg(null);
    try {
      await Promise.all(
        confirmSubmissionRefs.map((ref) =>
          post('/api/accommodation-bookings/send-confirmation', { booking_reference_submission: ref })
        )
      );
      setConfirmSendMsg('Confirmation sent successfully.');
      fetchFiltered();
    } catch (e) {
      setConfirmSendMsg(`Error: ${e?.response?.data?.error?.message ?? e?.message ?? 'Unknown error'}`);
    } finally {
      setConfirmSending(false);
    }
  };

  // Apply client-side hotel/status filter on top of server-filtered results
  const displayBookings = filteredBookings.filter((b) => {
    if (filterAllocated) return String(b.booking_allocated_hotel?.id) === String(filterAllocated);
    return true;
  }).filter((b) => {
    if (filterRequestedHotel) {
      // Find all room-type-link IDs that belong to the selected hotel
      const hotelRoomTypeIds = allRoomTypes
        .filter((rt) => String(rt.accommodation_hotel?.id) === String(filterRequestedHotel))
        .map((rt) => rt.id);
      return hotelRoomTypeIds.includes(b.booking_requested_hotel_room_type?.id);
    }
    return true;
  }).filter((b) => {
    if (filterStatus) return b.booking_status === filterStatus;
    return true;
  });

  const sortedBookings = [...displayBookings].sort((a, b) => {
    // Primary: group by booking_reference_submission alphabetically
    const refCmp = String(a.booking_reference_submission ?? '').localeCompare(String(b.booking_reference_submission ?? ''), undefined, { numeric: true });
    if (refCmp !== 0) return refCmp;

    // Secondary: within each submission group, sort by hotel option choice ascending
    const optCmp = String(a.booking_request_hotel_option_choice ?? '').localeCompare(String(b.booking_request_hotel_option_choice ?? ''), undefined, { numeric: true });
    if (optCmp !== 0) return optCmp;

    // Tertiary: apply the user-selected column sort
    let aVal, bVal;
    if (sortKey === 'booking_requested_hotel_room_type') {
      aVal = a.booking_requested_hotel_room_type?.Description ?? '';
      bVal = b.booking_requested_hotel_room_type?.Description ?? '';
    } else {
      aVal = a[sortKey] ?? '';
      bVal = b[sortKey] ?? '';
    }
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
    return <span style={{ marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div>
      {/* Title */}
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>
        Manage Bookings
      </h1>

      {error && (
        <div style={{ color: '#ee5e52', marginBottom: '16px', fontSize: '13px' }}>{error}</div>
      )}

      {/* ── Filter dropdowns ── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Submission Reference</div>
          <select
            style={selectStyle}
            value={filterRef}
            onChange={(e) => setFilterRef(e.target.value)}
            disabled={loading}
          >
            <option value="">-- All --</option>
            {refOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Room Reference</div>
          <select
            style={selectStyle}
            value={filterRoomRef}
            onChange={(e) => setFilterRoomRef(e.target.value)}
            disabled={loading}
          >
            <option value="">-- All --</option>
            {roomRefOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Country</div>
          <select
            style={selectStyle}
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            disabled={loading}
          >
            <option value="">-- All --</option>
            {countryOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Submitted By</div>
          <select
            style={selectStyle}
            value={filterSubmittedBy}
            onChange={(e) => setFilterSubmittedBy(e.target.value)}
            disabled={loading}
          >
            <option value="">-- All --</option>
            {submittedByOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Status</div>
          <select
            style={selectStyle}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            disabled={loading}
          >
            <option value="">-- All --</option>
            {statusOptions.map((s) => <option key={s} value={s}>{`${s}  ${STATUS_SYMBOL[s] ?? ''}`}</option>)}
          </select>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Hotel Option</div>
          <select
            style={selectStyle}
            value={filterHotelOption}
            onChange={(e) => setFilterHotelOption(e.target.value)}
            disabled={loading}
          >
            <option value="">-- All --</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Allocated Hotel</div>
          <select
            style={selectStyle}
            value={filterAllocated}
            onChange={(e) => setFilterAllocated(e.target.value)}
            disabled={loading}
          >
            <option value="">-- All --</option>
            {allHotels.map((h) => <option key={h.id} value={h.id}>{h.hotel_name}</option>)}
          </select>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Requested Hotel</div>
          <select
            style={selectStyle}
            value={filterRequestedHotel}
            onChange={(e) => setFilterRequestedHotel(e.target.value)}
            disabled={loading}
          >
            <option value="">-- All --</option>
            {allHotels.map((h) => <option key={h.id} value={h.id}>{h.hotel_name}</option>)}
          </select>
        </div>

        {filtersActive && (
          <button
            style={{ ...selectStyle, border: '1px solid #4945ff', color: '#7b79ff', background: 'none', padding: '7px 14px' }}
            onClick={() => { setFilterRef(''); setFilterCountry(''); setFilterSubmittedBy(''); setFilterHotelOption(''); setFilterAllocated(''); setFilterRequestedHotel(''); setFilterStatus(''); setFilterRoomRef(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Submitter info (shown when Submission Reference or Room Reference is selected) ── */}
      {(() => {
        if (!filterRef && !filterRoomRef) return null;
        const match = allBookings.find((b) =>
          (filterRef && b.booking_reference_submission === filterRef) ||
          (filterRoomRef && b.booking_reference_room === filterRoomRef)
        );
        if (!match) return null;
        return (
          <div style={{ display: 'flex', gap: '32px', marginBottom: '24px', padding: '14px 18px', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '8px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Submitted By</div>
              <div style={{ fontSize: '14px', color: '#fff' }}>{match.booking_submitted_by || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Country</div>
              <div style={{ fontSize: '14px', color: '#fff' }}>{match.booking_country || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Submitted At</div>
              <div style={{ fontSize: '14px', color: '#fff' }}>{match.createdAt ? new Date(match.createdAt).toLocaleString() : '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Booking Type</div>
              <div style={{ fontSize: '14px', color: '#fff' }}>{match.booking_type || '—'}</div>
            </div>
          </div>
        );
      })()}

      {/* ── Allocate Hotel Choice row ── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Allocate Hotel Choice</div>
          <select
            style={selectStyle}
            value={allocateHotelId}
            onChange={(e) => { setAllocateHotelId(e.target.value); setAllocateSaveMsg(null); }}
            disabled={allocateSaving}
          >
            <option value="">-- Select Hotel --</option>
            {allHotels.map((h) => <option key={h.id} value={h.id}>{h.hotel_name}</option>)}
          </select>
        </div>
        <button
          style={{
            ...selectStyle,
            border: '1px solid #4945ff',
            color: allocateSaving || allocatePreviewLoading || !allocateHotelId || displayBookings.length === 0 ? '#8e8ea0' : '#7b79ff',
            background: 'none',
            padding: '7px 14px',
            cursor: allocateSaving || allocatePreviewLoading || !allocateHotelId || displayBookings.length === 0 ? 'not-allowed' : 'pointer',
            opacity: allocateSaving || allocatePreviewLoading || !allocateHotelId || displayBookings.length === 0 ? 0.6 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onClick={handleAllocatePreview}
          disabled={allocateSaving || allocatePreviewLoading || !allocateHotelId || displayBookings.length === 0}
        >
          {(allocateSaving || allocatePreviewLoading) && (
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              border: '2px solid #8e8ea0',
              borderTopColor: '#7b79ff',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              flexShrink: 0,
            }} />
          )}
          {allocateSaving ? 'Saving…' : allocatePreviewLoading ? 'Checking…' : 'Save Option'}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <button
          style={{
            ...selectStyle,
            border: '1px solid #22c55e',
            color: allocatedBookings.length === 0 ? '#8e8ea0' : '#22c55e',
            background: 'none',
            padding: '7px 14px',
            cursor: allocatedBookings.length === 0 ? 'not-allowed' : 'pointer',
            opacity: allocatedBookings.length === 0 ? 0.6 : 1,
          }}
          onClick={() => { setConfirmSendMsg(null); setShowConfirmModal(true); }}
          disabled={allocatedBookings.length === 0}
        >
          Send Confirmation
        </button>
        {allocateSaveMsg && (
          <div style={{ fontSize: '13px', color: allocateSaveMsg.startsWith('Error') ? '#ee5e52' : '#5cb85c', alignSelf: 'center' }}>
            {allocateSaveMsg}
          </div>
        )}
      </div>

      {/* ── Split panel: list + detail ── */}
      {filtersActive && (
        <div style={{ display: 'flex', gap: '0', minHeight: '500px', border: '1px solid #32324d', borderRadius: '8px', overflow: 'hidden' }}>

          {/* Left: room reference list */}
          <div style={{ width: '520px', minWidth: '520px', borderRight: '1px solid #32324d', overflowY: 'auto', background: '#1e1e2e' }}>
            {/* Column header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 60px 32px', gap: '0 8px', padding: '0', fontSize: '11px', borderBottom: '1px solid #32324d', background: '#181826' }}>
              {[{ label: `Room Reference${!listLoading ? ` (${displayBookings.length})` : ''}`, col: 'booking_reference_room' }, { label: 'Room Type', col: 'booking_requested_hotel_room_type' }, { label: 'Option', col: 'booking_request_hotel_option_choice' }].map(({ label, col }) => (
                <button key={col} onClick={() => handleSort(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: sortKey === col ? '#fff' : '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '11px', fontWeight: '600', padding: '10px 8px 10px 0', textAlign: 'left', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  {col === 'booking_reference_room' && <span style={{ paddingLeft: '16px' }}>{label}</span>}
                  {col !== 'booking_reference_room' && label}
                  <SortIcon col={col} />
                </button>
              ))}
              <div style={{ padding: '10px 8px 10px 0', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '11px', fontWeight: '600', textAlign: 'center' }}>St</div>
            </div>
            {listLoading ? (
              <div style={{ padding: '24px 16px', color: '#a5a5ba', fontSize: '13px' }}>Loading…</div>
            ) : displayBookings.length === 0 ? (
              <div style={{ padding: '24px 16px', color: '#a5a5ba', fontSize: '13px' }}>No results found.</div>
            ) : (
              sortedBookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 60px 32px',
                    gap: '0 8px',
                    alignItems: 'center',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    background: selectedId === b.id ? '#4945ff22' : 'none',
                    border: 'none',
                    borderLeft: selectedId === b.id ? '3px solid #4945ff' : '3px solid transparent',
                    borderBottom: '1px solid #32324d',
                    cursor: 'pointer',
                    color: selectedId === b.id ? '#7b79ff' : '#c0c0cf',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.booking_reference_room || `#${b.id}`}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedId === b.id ? '#7b79ff' : '#a5a5ba', fontSize: '12px' }}>
                    {b.booking_requested_hotel_room_type?.Description ?? '—'}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedId === b.id ? '#7b79ff' : '#a5a5ba', fontSize: '12px', textAlign: 'center' }}>
                    {b.booking_request_hotel_option_choice ?? '—'}
                  </span>
                  <span style={{ textAlign: 'center', fontSize: '14px', lineHeight: 1 }} title={b.booking_status ?? ''}>
                    {b.booking_status === 'Allocated' && <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />}
                    {b.booking_status === 'Pending' && <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#f97316' }} />}
                    {b.booking_status === 'Confirmed' && <span style={{ color: '#22c55e' }}>✓</span>}
                    {b.booking_status === 'Declined' && <span style={{ color: '#ef4444' }}>✕</span>}
                    {b.booking_status === 'Waiting List' && <span style={{ color: '#eab308' }}>?</span>}
                    {b.booking_status === 'Other Option Allocated' && <span style={{ color: '#6b7280', fontSize: '16px' }}>⊗</span>}
                    {b.booking_status === 'Redundant' && <span style={{ color: '#6b7280', fontSize: '12px' }}>—</span>}
                    {!b.booking_status && <span style={{ color: '#6b7280' }}>·</span>}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Right: detail view */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#212134' }}>
            {!selectedBooking || !editForm ? (
              <div style={{ color: '#a5a5ba', fontSize: '14px' }}>
                Select a room reference from the list to view its details.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                    {selectedBooking.booking_reference_room || `Booking #${selectedBooking.id}`}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {editSaveMsg && (
                      <span style={{ fontSize: '13px', color: editSaveMsg.startsWith('Error') ? '#ee5e52' : '#5cb85c' }}>{editSaveMsg}</span>
                    )}
                    <button
                      onClick={handleEditSave}
                      disabled={editSaving}
                      style={{ background: '#4945ff', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.7 : 1 }}
                    >
                      {editSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Row 1: Booking Type | Country | Submitted By | Submitted By Email */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 32px' }}>
                    {[['Booking Type', 'booking_type', 'text'],
                      ['Country', 'booking_country', 'text'],
                      ['Submitted By', 'booking_submitted_by', 'text'],
                      ['Submitted By Email', 'booking_submitted_by_email', 'email'],
                    ].map(([label, field, type]) => (
                      <div key={field}>
                        <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
                        <input
                          type={type}
                          value={editForm[field]}
                          onChange={(e) => handleEditField(field, e.target.value)}
                          style={{ width: '100%', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '7px 10px', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Row 2: Check-In Date | Check-Out Date | Number of Nights */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 32px' }}>
                    {[['Check-In Date', 'booking_check_in_date', 'date'],
                      ['Check-Out Date', 'booking_check_out_date', 'date'],
                    ].map(([label, field, type]) => (
                      <div key={field}>
                        <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
                        <input
                          type={type}
                          value={editForm[field]}
                          onChange={(e) => handleEditField(field, e.target.value)}
                          style={{ width: '100%', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '7px 10px', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                    {(() => {
                      const checkIn = editForm.booking_check_in_date;
                      const checkOut = editForm.booking_check_out_date;
                      const nights = (checkIn && checkOut)
                        ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)
                        : null;
                      return (
                        <div>
                          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Number of Nights</div>
                          <div style={{ fontSize: '14px', color: nights > 0 ? '#fff' : '#a5a5ba', fontWeight: nights > 0 ? '600' : 'normal', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', padding: '7px 10px', boxSizing: 'border-box' }}>
                            {nights !== null && nights > 0 ? nights : '—'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Row 3: Requested Hotel | Requested Room Type | Hotel Option Choice | Accessible Room */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 32px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Requested Hotel</div>
                      <div style={{ fontSize: '14px', color: '#a5a5ba', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', padding: '7px 10px', boxSizing: 'border-box' }}>{selectedBooking.booking_requested_hotel_room_type?.accommodation_hotel?.hotel_name ?? '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Requested Room Type</div>
                      <select
                        style={{ width: '100%', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '7px 10px', boxSizing: 'border-box' }}
                        value={editForm.booking_requested_hotel_room_type}
                        onChange={(e) => handleEditField('booking_requested_hotel_room_type', e.target.value)}
                      >
                        <option value="">-- None --</option>
                        {allRoomTypes.map((r) => <option key={r.id} value={r.id}>{r.Description}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Hotel Option Choice</div>
                      <input
                        type="number"
                        value={editForm.booking_request_hotel_option_choice}
                        onChange={(e) => handleEditField('booking_request_hotel_option_choice', e.target.value)}
                        style={{ width: '100%', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '7px 10px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Accessible Room</div>
                      <select value={editForm.booking_accessible_room} onChange={(e) => handleEditField('booking_accessible_room', e.target.value)} style={{ width: '100%', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '7px 10px', boxSizing: 'border-box' }}>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Notes */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Notes</div>
                    <textarea
                      value={editForm.booking_notes}
                      onChange={(e) => handleEditField('booking_notes', e.target.value)}
                      rows={4}
                      style={{ width: '100%', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '10px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  {/* Row 5: Room Cost Per Person (from room type) | Cost Per Person | Total Room Cost */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 32px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Room Cost Per Person (Rate)</div>
                      {(() => {
                        const rt = allRoomTypes.find((r) => String(r.id) === String(editForm.booking_requested_hotel_room_type));
                        const rate = rt?.room_cost_per_person ?? selectedBooking?.booking_requested_hotel_room_type?.room_cost_per_person;
                        return (
                          <div style={{ fontSize: '14px', color: '#fff', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', padding: '7px 10px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between' }}>
                            {rate != null ? (<><span>{parseFloat(rate).toFixed(2)}</span><span style={{ color: '#8e8ea0' }}>{getCurrencySymbol(rt?.accommodation_hotel?.currency)}</span></>) : '—'}
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total Cost Per Person</div>
                      <div style={{ background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', padding: '7px 10px', boxSizing: 'border-box', color: '#fff', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                        {(() => {
                          const rt = allRoomTypes.find((r) => String(r.id) === String(editForm.booking_requested_hotel_room_type));
                          const sym = getCurrencySymbol(rt?.accommodation_hotel?.currency);
                          const rate = parseFloat(rt?.room_cost_per_person ?? selectedBooking?.booking_requested_hotel_room_type?.room_cost_per_person) || 0;
                          const checkIn = editForm.booking_check_in_date;
                          const checkOut = editForm.booking_check_out_date;
                          const nights = (checkIn && checkOut) ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000) : 0;
                          const total = rate > 0 && nights > 0 ? (rate * nights).toFixed(2) : null;
                          return total !== null ? (<><span>{total}</span><span style={{ color: '#8e8ea0' }}>{sym}</span></>) : '—';
                        })()}
                      </div>
                    </div>
                    {(() => {
                      const checkIn = editForm.booking_check_in_date;
                      const checkOut = editForm.booking_check_out_date;
                      const nights = (checkIn && checkOut)
                        ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)
                        : 0;
                      const resolvedRt = allRoomTypes.find((r) => String(r.id) === String(editForm.booking_requested_hotel_room_type));
                      const costPerPerson = parseFloat(resolvedRt?.room_cost_per_person ?? selectedBooking?.booking_requested_hotel_room_type?.room_cost_per_person) || 0;
                      const accRoomTypeId = resolvedRt?.accommodation_room_type?.id ?? selectedBooking?.booking_requested_hotel_room_type?.accommodation_room_type?.id;
                      const peoplePerRoom = (accRoomTypeId ? (peoplePerRoomMap[accRoomTypeId] ?? 1) : 1);
                      const total = nights > 0 && costPerPerson > 0 ? nights * costPerPerson * peoplePerRoom : null;
                      return (
                        <div>
                          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total Room Cost</div>
                          <div style={{ fontSize: '14px', color: total !== null ? '#fff' : '#a5a5ba', fontWeight: total !== null ? '600' : 'normal', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', padding: '7px 10px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between' }}>
                            {total !== null ? (<><span>{total.toFixed(2)}</span><span style={{ color: '#8e8ea0', fontWeight: 'normal' }}>{getCurrencySymbol(resolvedRt?.accommodation_hotel?.currency)}</span></>) : '—'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Row 6: Status | Allocated Hotel | Send Confirmation | Confirmation Sent At */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 32px', alignItems: 'end' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Status</div>
                      <select value={editForm.booking_status} onChange={(e) => handleEditField('booking_status', e.target.value)} style={{ width: '100%', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '7px 10px', boxSizing: 'border-box' }}>
                        {statusOptions.map((s) => <option key={s} value={s}>{`${s}  ${STATUS_SYMBOL[s] ?? ''}`}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Allocated Hotel</div>
                      <select value={editForm.booking_allocated_hotel} onChange={(e) => handleEditField('booking_allocated_hotel', e.target.value)} style={{ width: '100%', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '7px 10px', boxSizing: 'border-box' }}>
                        <option value="">-- None --</option>
                        {allHotels.map((h) => <option key={h.id} value={h.id}>{h.hotel_name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px' }}>
                      <input
                        id="send_confirmation"
                        type="checkbox"
                        checked={!!editForm.booking_send_confirmation}
                        onChange={(e) => handleEditField('booking_send_confirmation', e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="send_confirmation" style={{ fontSize: '13px', color: '#c0c0cf', cursor: 'pointer' }}>Send Confirmation</label>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Confirmation Sent At</div>
                      <div style={{ fontSize: '14px', color: selectedBooking.booking_confirmation_sent_at ? '#fff' : '#a5a5ba', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', padding: '7px 10px', boxSizing: 'border-box' }}>
                        {selectedBooking.booking_confirmation_sent_at
                          ? (() => { const d = new Date(selectedBooking.booking_confirmation_sent_at); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Row 7: Occupants */}
                  {(() => {
                    const resolvedRt = allRoomTypes.find((r) => String(r.id) === String(editForm.booking_requested_hotel_room_type));
                    const accRoomTypeId = resolvedRt?.accommodation_room_type?.id;
                    const maxOccupants = accRoomTypeId ? (peoplePerRoomMap[accRoomTypeId] ?? null) : null;
                    const currentCount = (editForm.booking_allocated_members ?? []).length;
                    const atCapacity = maxOccupants !== null && currentCount >= maxOccupants;
                    const alreadyIds = new Set((editForm.booking_allocated_members ?? []).map((m) => m.id));
                    const available = allMembers.filter((m) => !alreadyIds.has(m.id));
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Occupants
                          </div>
                          <div style={{ fontSize: '12px', color: atCapacity ? '#ee5e52' : '#a5a5ba' }}>
                            {maxOccupants !== null ? `${currentCount} / ${maxOccupants}` : currentCount > 0 ? `${currentCount}` : ''}
                          </div>
                          {atCapacity && (
                            <div style={{ fontSize: '11px', color: '#ee5e52' }}>Room at capacity</div>
                          )}
                        </div>
                        {/* Current occupant list */}
                        {currentCount === 0 ? (
                          <div style={{ fontSize: '14px', color: '#a5a5ba', fontStyle: 'italic', marginBottom: '10px' }}>No occupants assigned</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                            {editForm.booking_allocated_members.map((m) => (
                              <div key={m.id} style={{ display: 'flex', gap: '12px', background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '6px', padding: '10px 14px', alignItems: 'center' }}>
                                <div style={{ flex: 1, fontSize: '14px', color: '#fff' }}>
                                  {[m.first_name, m.surname].filter(Boolean).join(' ') || `Member #${m.id}`}
                                </div>
                                {m.role?.accreditation_role && (
                                  <div style={{ fontSize: '12px', color: '#7b79ff', background: '#4945ff22', borderRadius: '4px', padding: '2px 8px', flexShrink: 0 }}>
                                    {m.role.accreditation_role}
                                  </div>
                                )}
                                {m.country && (
                                  <div style={{ fontSize: '12px', color: '#a5a5ba', flexShrink: 0 }}>{m.country}</div>
                                )}
                                <button
                                  onClick={() => handleRemoveMember(m.id)}
                                  style={{ background: 'none', border: '1px solid #ee5e52', borderRadius: '4px', color: '#ee5e52', fontSize: '12px', padding: '2px 8px', cursor: 'pointer', flexShrink: 0, lineHeight: 1.4 }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Add occupant — hidden when at capacity */}
                        {!atCapacity && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select
                              style={{ ...selectStyle, flex: 1 }}
                              value={addMemberId}
                              onChange={(e) => setAddMemberId(e.target.value)}
                            >
                              <option value="">— Select a member to add —</option>
                              {available.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {[m.surname, m.first_name].filter(Boolean).join(', ')}{m.role?.accreditation_role ? ` · ${m.role.accreditation_role}` : ''}{m.country ? ` (${m.country})` : ''}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => { if (addMemberId) handleAddMember(addMemberId); }}
                              disabled={!addMemberId}
                              style={{ ...selectStyle, border: '1px solid #4945ff', color: addMemberId ? '#7b79ff' : '#8e8ea0', background: 'none', padding: '7px 16px', cursor: addMemberId ? 'pointer' : 'not-allowed', opacity: addMemberId ? 1 : 0.5, flexShrink: 0 }}
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {!filtersActive && !loading && (
        <div style={{ color: '#a5a5ba', fontSize: '14px', marginTop: '8px' }}>
          Use the dropdowns above to filter bookings.
        </div>
      )}

      {/* ── Room Capacity Warning Modal ── */}
      {showCapacityWarningModal && capacityWarningData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e1e2e', border: '1px solid #f97316', borderRadius: '8px', width: '100%', maxWidth: '580px', maxHeight: '80vh', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #32324d' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f97316', margin: 0 }}>⚠ Room Capacity Exceeded</h2>
              <p style={{ fontSize: '13px', color: '#8e8ea0', margin: '4px 0 0' }}>
                The following room types do not have enough available rooms to accommodate all bookings being allocated.
              </p>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {capacityWarningData.overCapacity.map((item, i) => (
                  <div key={i} style={{ background: '#181826', border: '1px solid #f97316', borderRadius: '6px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>{item.roomTypeName}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Total Rooms</div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>{item.totalRooms}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Already Used</div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#a5a5ba' }}>{item.existingCount}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Available</div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: item.available <= 0 ? '#ee5e52' : '#22c55e' }}>{item.available}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Allocating</div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#f97316' }}>{item.newAllocating}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#f97316' }}>
                      Over capacity by {item.newAllocating - item.available} room{item.newAllocating - item.available !== 1 ? 's' : ''}.
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '13px', color: '#c0c0cf', marginTop: '16px', marginBottom: 0 }}>
                Do you want to proceed anyway?
              </p>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #32324d', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => { setShowCapacityWarningModal(false); setCapacityWarningData(null); }}
                style={{ background: 'none', border: '1px solid #32324d', borderRadius: '6px', color: '#c0c0cf', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCapacityWarningConfirm}
                style={{ background: '#f97316', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: 'pointer' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Allocate Hotel Choice Preview Modal ── */}
      {showAllocatePreviewModal && allocatePreviewData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '8px', width: '100%', maxWidth: '620px', maxHeight: '80vh', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #32324d' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Confirm Allocation Changes</h2>
              <p style={{ fontSize: '13px', color: '#8e8ea0', margin: '4px 0 0' }}>Review the changes that will be made before saving.</p>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {/* Allocate section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Set to <strong style={{ color: '#5cb85c' }}>Allocated</strong> — hotel: <strong style={{ color: '#7b79ff' }}>{allocatePreviewData.hotelName}</strong> ({allocatePreviewData.toAllocate.length} booking{allocatePreviewData.toAllocate.length !== 1 ? 's' : ''})
                </div>
                {allocatePreviewData.toAllocate.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#a5a5ba', fontStyle: 'italic' }}>None</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {allocatePreviewData.toAllocate.map((b) => (
                      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181826', border: '1px solid #32324d', borderRadius: '4px', padding: '6px 12px', fontSize: '13px' }}>
                        <span style={{ color: '#fff' }}>{b.booking_reference_room || `#${b.id}`}</span>
                        <span style={{ color: '#a5a5ba', fontSize: '12px' }}>
                          {b.booking_status ?? '—'} → <strong style={{ color: '#5cb85c' }}>Allocated</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Other Option Allocated section */}
              <div>
                <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Set to <strong style={{ color: '#ee5e52' }}>Other Option Allocated</strong> ({allocatePreviewData.toOther.length} booking{allocatePreviewData.toOther.length !== 1 ? 's' : ''})
                </div>
                {allocatePreviewData.toOther.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#a5a5ba', fontStyle: 'italic' }}>None</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {allocatePreviewData.toOther.map((b) => (
                      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181826', border: '1px solid #32324d', borderRadius: '4px', padding: '6px 12px', fontSize: '13px' }}>
                        <span style={{ color: '#fff' }}>{b.booking_reference_room || `#${b.id}`}</span>
                        <span style={{ color: '#a5a5ba', fontSize: '12px' }}>
                          {b.booking_status ?? '—'} → <strong style={{ color: '#ee5e52' }}>Other Option Allocated</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #32324d', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => { setShowAllocatePreviewModal(false); setAllocatePreviewData(null); }}
                style={{ background: 'none', border: '1px solid #32324d', borderRadius: '6px', color: '#c0c0cf', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAllocateSave}
                style={{ background: '#4945ff', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: 'pointer' }}
              >
                Confirm &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unconfirmed Status Warning Modal ── */}
      {showUnconfirmedWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e1e2e', border: '1px solid #ee5e52', borderRadius: '8px', width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #32324d' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ee5e52', margin: 0 }}>⚠ Booking Not Confirmed</h2>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '14px', color: '#c0c0cf', margin: 0 }}>
                The current booking status is{' '}
                <strong style={{ color: '#fff' }}>{editForm?.booking_status ?? '—'}</strong>, not{' '}
                <strong style={{ color: '#fff' }}>Confirmed</strong>. Are you sure you want to send the confirmation email anyway?
              </p>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #32324d', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => { setShowUnconfirmedWarning(false); setPendingSavePayload(null); }}
                style={{ background: 'none', border: '1px solid #32324d', borderRadius: '6px', color: '#c0c0cf', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => executeSave(true)}
                style={{ background: '#ee5e52', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: 'pointer' }}
              >
                Send Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Confirmation Modal ── */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e1e2e', border: '1px solid #32324d', borderRadius: '8px', width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #32324d' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Send Confirmation</h2>
            </div>
            {/* Body */}
            <div style={{ padding: '20px 24px' }}>
              {confirmSendMsg !== 'Confirmation sent successfully.' && (
                <p style={{ fontSize: '14px', color: '#c0c0cf', margin: 0 }}>
                  Send Confirmation to{' '}
                  <strong style={{ color: '#fff' }}>{confirmSubmittedBy || '—'}</strong>{' '}
                  of their booking, reference{' '}
                  <strong style={{ color: '#fff' }}>{confirmSubmissionRef || '—'}</strong>?
                </p>
              )}
              {confirmSendMsg && (
                <div style={{ marginTop: '14px', fontSize: '13px', color: confirmSendMsg.startsWith('Error') ? '#ee5e52' : '#5cb85c' }}>
                  {confirmSendMsg}
                </div>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #32324d', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {confirmSendMsg === 'Confirmation sent successfully.' ? (
                <button
                  onClick={() => { setShowConfirmModal(false); setConfirmSendMsg(null); }}
                  style={{ background: '#4945ff', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: 'pointer' }}
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setShowConfirmModal(false); setConfirmSendMsg(null); }}
                    disabled={confirmSending}
                    style={{ background: 'none', border: '1px solid #32324d', borderRadius: '6px', color: '#c0c0cf', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: confirmSending ? 'not-allowed' : 'pointer', opacity: confirmSending ? 0.6 : 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendConfirmation}
                    disabled={confirmSending}
                    style={{ background: '#4945ff', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: confirmSending ? 'not-allowed' : 'pointer', opacity: confirmSending ? 0.7 : 1 }}
                  >
                    {confirmSending ? 'Sending…' : 'Confirm'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccommodationPage;
