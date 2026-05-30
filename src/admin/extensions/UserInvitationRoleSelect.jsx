import React, { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { SingleSelect, SingleSelectOption, Field } from '@strapi/design-system';

/**
 * UserInvitationRoleSelect
 *
 * Custom field component for the User Invitation content type.
 * Fetches the list of users-permissions roles directly from the
 * users-permissions API (bypassing the content-manager relation picker,
 * which cannot access plugin:: content types).
 *
 * Stores the selected role as a JSON object: { id: number, name: string }
 */
const UserInvitationRoleSelect = ({ name, value, onChange, disabled, error }) => {
  const { get } = useFetchClient();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    get('/users-permissions/roles')
      .then(({ data }) => {
        const fetched = (data?.roles || [])
          .map(r => ({ id: r.id, name: r.name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setRoles(fetched);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  // Parse the current value — may be a JSON string, an object, or null
  let selected = null;
  try {
    if (value && typeof value === 'string') {
      selected = JSON.parse(value);
    } else if (value && typeof value === 'object') {
      selected = value;
    }
  } catch {
    selected = null;
  }

  // SingleSelect expects a string value
  const selectedValue = selected?.id !== undefined ? String(selected.id) : undefined;

  const handleChange = (chosenIdStr) => {
    const chosenId = parseInt(chosenIdStr, 10);
    const chosenRole = roles.find(r => r.id === chosenId) || null;
    onChange({
      target: {
        name,
        value: chosenRole ? JSON.stringify(chosenRole) : null,
        type: 'json',
      },
    });
  };

  return (
    <Field.Root name={name} error={error}>
      <Field.Label>Select User Role</Field.Label>
      <SingleSelect
        placeholder="Select a role…"
        value={selectedValue}
        onChange={handleChange}
        disabled={disabled || loading || fetchError}
        error={error}
      >
        {fetchError ? (
          <SingleSelectOption value="">Failed to load roles</SingleSelectOption>
        ) : (
          roles.map(role => (
            <SingleSelectOption key={role.id} value={String(role.id)}>
              {role.name}
            </SingleSelectOption>
          ))
        )}
      </SingleSelect>
      <Field.Error />
    </Field.Root>
  );
};

export default UserInvitationRoleSelect;

