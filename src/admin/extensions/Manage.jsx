import React, { useState } from 'react';
import ManageAccommodationPage from './manage/ManageAccommodationPage';
import DelegationsPage from './manage/DelegationsPage';
import VisaInvitationsPage from './manage/VisaInvitationsPage';
import ManageTravelPage from './manage/ManageTravelPage';
import ManageDepartureTravelPage from './manage/ManageDepartureTravelPage';
import HotelDashboardPage from './manage/HotelDashboardPage';

// ── Manage Landing Page ───────────────────────────────────────────────────────

const ManageLandingPage = ({ onNavigate }) => {
  const CARDS = [
    {
      id: 'accommodation',
      label: 'Accommodation',
      icon: '🏨',
      description: 'Manage athlete and official accommodation allocations.',
      subItems: [
        { id: 'manage-accommodation', label: 'Manage Bookings', description: 'View, allocate and confirm room bookings.' },
        { id: 'hotel-dashboard', label: 'Hotel Dashboard', description: 'Per-hotel occupancy stats and room breakdowns.' },
      ],
    },
    {
      id: 'delegations',
      label: 'Delegations',
      icon: '🏅',
      description: 'View and manage delegation member registrations.',
      navigateTo: 'delegations',
    },
    {
      id: 'visa-invitations',
      label: 'Visa Invitations',
      icon: '📄',
      description: 'Approve and issue visa invitation letters.',
      navigateTo: 'visa-invitations',
    },
    {
      id: 'travel',
      label: 'Travel',
      icon: '✈️',
      description: 'Review arrival and departure travel information.',
      subItems: [
        { id: 'travel', label: 'Travel', description: 'View all arrival and departure records.' },
        { id: 'departure-travel', label: 'Departure Travel', description: 'View departure records grouped by departure date.' },
      ],
    },
  ];

  const cardBase = {
    background: '#212134',
    border: '1px solid #32324d',
    borderRadius: '12px',
    padding: '28px',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, background 0.15s ease',
  };

  const subCardBase = {
    background: '#181826',
    border: '1px solid #32324d',
    borderRadius: '8px',
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, background 0.15s ease',
    flex: '1',
    minWidth: '160px',
  };

  const [hovered, setHovered] = React.useState(null);
  const [subHovered, setSubHovered] = React.useState(null);

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Manage</h1>
      <p style={{ color: '#a5a5ba', fontSize: '14px', marginBottom: '40px' }}>Select a section to get started.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {CARDS.map((card) => (
          <div
            key={card.id}
            style={{
              ...cardBase,
              borderColor: hovered === card.id && !card.subItems ? '#4945ff' : '#32324d',
              background: hovered === card.id && !card.subItems ? '#272740' : '#212134',
              cursor: card.subItems ? 'default' : 'pointer',
            }}
            onClick={card.navigateTo ? () => onNavigate(card.navigateTo) : undefined}
            onMouseEnter={() => setHovered(card.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>{card.label}</div>
            <div style={{ fontSize: '13px', color: '#a5a5ba', marginBottom: card.subItems ? '20px' : '0' }}>{card.description}</div>

            {card.subItems && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {card.subItems.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      ...subCardBase,
                      borderColor: subHovered === sub.id ? '#4945ff' : '#32324d',
                      background: subHovered === sub.id ? '#272740' : '#181826',
                    }}
                    onClick={(e) => { e.stopPropagation(); onNavigate(sub.id); }}
                    onMouseEnter={() => setSubHovered(sub.id)}
                    onMouseLeave={() => setSubHovered(null)}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#7b79ff', marginBottom: '4px' }}>{sub.label}</div>
                    <div style={{ fontSize: '12px', color: '#a5a5ba' }}>{sub.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Navigation structure ──────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'accommodation',
    label: 'Accommodation',
    items: [
      { id: 'manage-accommodation', label: 'Manage Bookings', component: ManageAccommodationPage },
      { id: 'hotel-dashboard', label: 'Hotel Dashboard', component: HotelDashboardPage },
    ],
  },
  {
    id: 'delegations',
    label: 'Delegations',
    items: [
      { id: 'delegations', label: 'Delegations', component: DelegationsPage },
    ],
  },
  {
    id: 'visa-invitations',
    label: 'Visa Invitations',
    items: [
      { id: 'visa-invitations', label: 'Visa Invitations', component: VisaInvitationsPage },
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    items: [
      { id: 'travel', label: 'Travel', component: ManageTravelPage },
      { id: 'departure-travel', label: 'Departure Travel', component: ManageDepartureTravelPage },
    ],
  },
];

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: (open) => ({
    width: open ? '240px' : '0px',
    minWidth: open ? '240px' : '0px',
    overflow: 'hidden',
    transition: 'width 0.2s ease, min-width 0.2s ease',
    backgroundColor: '#212134',
    borderRight: open ? '1px solid #32324d' : 'none',
    padding: open ? '24px 0' : '0',
    display: 'flex',
    flexDirection: 'column',
  }),
  sidebarTitle: {
    padding: '0 16px 16px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
  },
  sectionToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#c0c0cf',
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  navItem: (isActive) => ({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 16px 8px 28px',
    background: isActive ? '#4945ff20' : 'none',
    border: 'none',
    borderLeft: isActive ? '3px solid #4945ff' : '3px solid transparent',
    cursor: 'pointer',
    color: isActive ? '#7b79ff' : '#a5a5ba',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  }),
  content: {
    flex: 1,
    padding: '32px',
    overflow: 'auto',
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#a5a5ba',
    fontSize: '13px',
    padding: '0',
  },
  toggleIcon: {
    width: '20px',
    height: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '4px',
  },
  bar: {
    height: '2px',
    backgroundColor: '#a5a5ba',
    borderRadius: '2px',
  },
};

// ── Main component ────────────────────────────────────────────────────────────

const AccommodationManage = () => {
  const [activePage, setActivePage] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState(
    Object.fromEntries(SECTIONS.map((s) => [s.id, true]))
  );

  const toggleSection = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const ActiveComponent =
    SECTIONS.flatMap((s) => s.items).find((i) => i.id === activePage)?.component ?? null;

  const goHome = () => { setActivePage('landing'); setSidebarOpen(false); };

  return (
    <div style={styles.wrapper}>
      {/* ── Collapsible sidebar ── */}
      <nav style={styles.sidebar(sidebarOpen)}>
        <div style={styles.sidebarTitle}>Manage</div>

        <button
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#a5a5ba', fontSize: '13px', padding: '8px 16px 16px', whiteSpace: 'nowrap' }}
          onClick={goHome}
        >
          &#8592; Home
        </button>

        {SECTIONS.map((section) => (
          <div key={section.id}>
            <button style={styles.sectionToggle} onClick={() => toggleSection(section.id)}>
              <span>{section.label}</span>
              <span>{expanded[section.id] ? '▾' : '▸'}</span>
            </button>

            {expanded[section.id] &&
              section.items.map((item) => (
                <button
                  key={item.id}
                  style={styles.navItem(activePage === item.id)}
                  onClick={() => setActivePage(item.id)}
                >
                  {item.label}
                </button>
              ))}
          </div>
        ))}
      </nav>

      {/* ── Page content ── */}
      <div style={styles.content}>
        {/* Top bar */}
        {activePage !== 'landing' && (
          <button style={styles.toggleBtn} onClick={() => setSidebarOpen((o) => !o)}>
            <div style={styles.toggleIcon}>
              <div style={styles.bar} />
              <div style={styles.bar} />
              <div style={styles.bar} />
            </div>
            <span>{sidebarOpen ? 'Hide Menu' : 'Show Menu'}</span>
          </button>
        )}

        {activePage === 'landing' ? (
          <ManageLandingPage onNavigate={(id) => { setActivePage(id); setSidebarOpen(true); }} />
        ) : ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <p style={{ color: '#a5a5ba' }}>Select a page from the menu.</p>
        )}
      </div>
    </div>
  );
};

export default AccommodationManage;