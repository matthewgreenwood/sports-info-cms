import React, { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

const NewsRoleCheckboxes = ({ name, value, onChange, disabled, error }) => {
  const { get } = useFetchClient();
  const [roles, setRoles] = useState(['All']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/users-permissions/roles')
      .then(({ data }) => {
        const fetched = (data?.roles || []).map(r => r.name).filter(Boolean).sort();
        setRoles(['All', ...fetched]);
      })
      .catch(() => {
        // Fall back to "All" only if the fetch fails
        setRoles(['All']);
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

  const handleChange = (role, checked) => {
    let updated;
    if (role === 'All') {
      // Selecting "All" clears all specific role selections
      updated = checked ? ['All'] : [];
    } else {
      // Selecting a specific role deselects "All"
      const withoutAll = selected.filter(s => s !== 'All');
      updated = checked
        ? [...withoutAll, role]
        : withoutAll.filter(s => s !== role);
    }
    onChange({ target: { name, value: updated, type: 'json' } });
  };

  if (loading) {
    return <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>Loading roles…</p>;
  }

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        {roles.map(role => (
          <label
            key={role}
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
              checked={selected.includes(role)}
              onChange={e => handleChange(role, e.target.checked)}
              disabled={disabled}
              style={{
                width: '16px',
                height: '16px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                accentColor: '#4945ff',
              }}
            />
            {role}
          </label>
        ))}
      </div>
      {error && (
        <p style={{ color: '#d02b20', fontSize: '12px', marginTop: '6px' }}>{error}</p>
      )}
    </div>
  );
};

export default NewsRoleCheckboxes;
