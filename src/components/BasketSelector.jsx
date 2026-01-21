import React, { useCallback, useEffect, useState } from 'react';
import { fetchJSON } from '../lib/fetchJSON.js';
import { useLanguage } from '../context/LanguageContext';

/**
 * BasketSelector - Custom widget for selecting a basket
 * 
 * Refreshes basket list when dropdown is focused to show newly added baskets.
 * 
 * Props from RJSF:
 * - value: current basket ID
 * - onChange: callback to update the form data
 * - readonly: whether the field is readonly
 * - disabled: whether the field is disabled
 */
export default function BasketSelector({ value, onChange, readonly, disabled }) {
  const { t } = useLanguage();
  const [baskets, setBaskets] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load baskets function (can be called on demand)
  const loadBaskets = useCallback(() => {
    setLoading(true);
    setError('');
    fetchJSON('/api/v1/baskets')
      .then(data => {
        const items = data?.items || [];
        setBaskets(items);
      })
      .catch(err => {
        console.error('Error loading baskets:', err);
        setError(t('errorLoadingBaskets') || 'Chyba při načítání košíků');
      })
      .finally(() => setLoading(false));
  }, [t]);

  // Load baskets on mount
  useEffect(() => {
    loadBaskets();
  }, [loadBaskets]);

  // Handle basket selection
  const handleBasketSelect = (basketId) => {
    // Convert to number if it's a numeric string
    const numericId = basketId && !isNaN(basketId) ? parseInt(basketId, 10) : basketId;
    onChange(numericId || undefined);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Basket selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select
          value={value || ''}
          onChange={(e) => handleBasketSelect(e.target.value)}
          onFocus={loadBaskets}
          disabled={disabled || readonly}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            minWidth: 250,
            background: (disabled || readonly) ? '#f3f4f6' : 'white',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          <option value="">{t('selectBasket') || 'Vyberte košík'}</option>
          {baskets.map((basket) => (
            <option key={basket.id} value={basket.id}>
              {basket.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ 
          padding: '8px 12px', 
          background: '#fee2e2', 
          color: '#991b1b', 
          borderRadius: 4,
          fontSize: 13
        }}>
          {error}
        </div>
      )}

      {/* Display selected basket */}
      {value && (
        <div style={{ 
          padding: '8px 12px', 
          background: '#dcfce7', 
          color: '#166534', 
          borderRadius: 4,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>✓</span>
          <span>
            {t('selectedBasket') || 'Vybraný košík'}: <strong>{baskets.find(b => b.id === value)?.name || value}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
