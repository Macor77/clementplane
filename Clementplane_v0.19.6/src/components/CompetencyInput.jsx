import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  addCompetencyToCatalog,
  getCompetencyCatalog,
} from '../services/competencyCatalogService';

function clean(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function key(value) {
  return clean(value).toLocaleLowerCase('fr');
}

export default function CompetencyInput({
  label = 'Compétences',
  values = [],
  onChange,
  placeholder = 'Rechercher ou ajouter une compétence…',
  disabled = false,
}) {
  const [catalog, setCatalog] = useState([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const blurTimerRef = useRef(null);

  useEffect(() => {
    let active = true;

    getCompetencyCatalog()
      .then((rows) => {
        if (active) setCatalog(rows);
      })
      .catch((loadError) => {
        console.error('Chargement du référentiel de compétences impossible :', loadError);
      });

    return () => {
      active = false;
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const selectedKeys = useMemo(
    () => new Set(values.map(key)),
    [values],
  );

  const matches = useMemo(() => {
    const search = key(input);

    return catalog
      .filter((item) => !selectedKeys.has(key(item.name)))
      .filter((item) => !search || key(item.name).includes(search))
      .slice(0, 8);
  }, [catalog, input, selectedKeys]);

  const exactCatalogMatch = catalog.find(
    (item) => key(item.name) === key(input),
  );

  const addExisting = (name) => {
    const cleaned = clean(name);
    if (!cleaned || selectedKeys.has(key(cleaned))) {
      setInput('');
      setOpen(false);
      return;
    }

    onChange([...values, cleaned]);
    setInput('');
    setOpen(false);
    setError('');
  };

  const addNew = async () => {
    const cleaned = clean(input);
    if (!cleaned || busy) return;

    if (exactCatalogMatch) {
      addExisting(exactCatalogMatch.name);
      return;
    }

    setBusy(true);
    setError('');

    try {
      const created = await addCompetencyToCatalog(cleaned);
      const canonicalName = created?.name || cleaned;

      setCatalog((current) => {
        if (current.some((item) => key(item.name) === key(canonicalName))) {
          return current;
        }
        return [...current, created || { name: canonicalName }];
      });

      addExisting(canonicalName);
    } catch (createError) {
      console.error('Création de la compétence impossible :', createError);
      setError("Impossible d'ajouter cette compétence au référentiel.");
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (index) => {
    if (disabled) return;
    onChange(values.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
      event.preventDefault();

      if (matches.length === 1 && input.trim()) {
        addExisting(matches[0].name);
      } else if (exactCatalogMatch) {
        addExisting(exactCatalogMatch.name);
      } else if (input.trim()) {
        addNew();
      }
    } else if (
      event.key === 'Backspace' &&
      !input &&
      values.length > 0
    ) {
      removeAt(values.length - 1);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 6, position: 'relative' }}>
      {label ? (
        <label style={{ fontSize: 14, fontWeight: 600, color: '#344054' }}>
          {label}
        </label>
      ) : null}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          minHeight: 42,
          padding: 6,
          alignItems: 'center',
          border: '1px solid #d0d5dd',
          borderRadius: 8,
          background: disabled ? '#f2f4f7' : '#ffffff',
        }}
        onClick={() => {
          if (!disabled) inputRef.current?.focus();
        }}
      >
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              borderRadius: 12,
              background: '#eef2ff',
              fontSize: 13,
            }}
          >
            {value}

            {!disabled ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeAt(index);
                }}
                aria-label={`Supprimer ${value}`}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            ) : null}
          </span>
        ))}

        <input
          ref={inputRef}
          value={input}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimerRef.current = setTimeout(() => setOpen(false), 150);
          }}
          onChange={(event) => {
            setInput(event.target.value);
            setOpen(true);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? '' : placeholder}
          style={{
            flex: 1,
            minWidth: 180,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            fontSize: 14,
            padding: '6px 4px',
          }}
        />
      </div>

      {error ? (
        <span style={{ fontSize: 12, color: '#b42318' }}>{error}</span>
      ) : null}

      {!disabled && open && (input.trim() || matches.length > 0) ? (
        <div
          style={{
            position: 'absolute',
            zIndex: 30,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            overflow: 'hidden',
            border: '1px solid #e4e7ec',
            borderRadius: 8,
            background: '#ffffff',
            boxShadow: '0 8px 24px rgba(16, 24, 40, 0.12)',
          }}
        >
          {matches.map((item) => (
            <button
              key={item.id || item.name}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => addExisting(item.name)}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                borderBottom: '1px solid #f2f4f7',
                background: '#ffffff',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {item.name}
            </button>
          ))}

          {input.trim() && !exactCatalogMatch ? (
            <button
              type="button"
              disabled={busy}
              onMouseDown={(event) => event.preventDefault()}
              onClick={addNew}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                background: '#f9fafb',
                textAlign: 'left',
                cursor: busy ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
              }}
            >
              {busy
                ? 'Ajout en cours…'
                : `+ Ajouter « ${clean(input)} » au référentiel`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
