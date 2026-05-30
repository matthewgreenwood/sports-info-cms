import React, { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

const SegmentCheckboxes = ({ name, value, onChange, disabled, error }) => {
  const { get } = useFetchClient();
  const [segments, setSegments] = useState(['All']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/users-permissions/roles')
      .then(({ data }) => {
        const fetched = (data?.roles || []).map(r => r.name).filter(Boolean).sort();
        setSegments(['All', ...fetched]);
      })
      .catch(() => {
        setSegments(['All']);
      })
      .finally(() => setLoading(false));
  }, []);

  let selected = [];
  try {
    if (Array.isArray(value)) {
      selected = value;
    } else if (typeof value === 'string' && value) {
      selected = JSON.parse(value);
    }
  } catch {
    selected = [];
  }

  const handleChange = (segment, checked) => {
    let updated;
    if (segment === 'All') {
      // Selecting "All" clears all specific selections
      updated = checked ? ['All'] : [];
    } else {
      // Selecting a specific role deselects "All"
      const withoutAll = selected.filter(s => s !== 'All');
      updated = checked
        ? [...withoutAll, segment]
        : withoutAll.filter(s => s !== segment);
    }
    onChange({ target: { name, value: updated, type: 'json' } });
  };

  if (loading) {
    return <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>Loading roles…</p>;
  }

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        {segments.map(segment => (
          <label
            key={segment}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              fontSize: '14px',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={selected.includes(segment)}
              onChange={e => handleChange(segment, e.target.checked)}
              disabled={disabled}
              style={{
                width: '16px',
                height: '16px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                accentColor: '#4945ff',
              }}
            />
            {segment}
          </label>
        ))}
      </div>
      {error && (
        <p style={{ color: '#d02b20', fontSize: '12px', marginTop: '6px' }}>{error}</p>
      )}
    </div>
  );
};

export default SegmentCheckboxes;
