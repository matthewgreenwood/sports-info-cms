import React from 'react';

export const unique = (arr) => [...new Set(arr.filter(Boolean))].sort();

export const getCurrencySymbol = (code) => {
  if (!code) return '';
  try {
    return (0).toLocaleString('en', { style: 'currency', currency: code.toUpperCase(), minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/[\d,\.\s]/g, '').trim();
  } catch {
    return code;
  }
};

export const Field = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#8e8ea0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#fff', wordBreak: 'break-word' }}>{String(value)}</div>
    </div>
  );
};

export const STATUS_SYMBOL = {
  'Allocated':             '●',
  'Pending':               '◉',
  'Confirmed':             '✓',
  'Declined':              '✗',
  'Waiting List':          '?',
  'Other Option Allocated':'⊗',
  'Redundant':             '—',
  'Cancelled':             '⊖',
};

export const selectStyle = {
  background: '#1e1e2e',
  border: '1px solid #32324d',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '13px',
  padding: '7px 10px',
  minWidth: '200px',
  cursor: 'pointer',
};
