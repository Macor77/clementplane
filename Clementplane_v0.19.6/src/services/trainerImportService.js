import Papa from 'papaparse';
import { supabase } from '../lib/supabaseClient';
import { readSheet } from 'read-excel-file/browser';

export const IMPORT_HEADERS = [
  'Prénom*',
  'Nom*',
  'E-mail',
  'Téléphone',
  'Adresse',
  'Code postal',
  'Ville',
  'Tarif (€)',
  'Statut',
  'Compétences',
  'Matériel',
  'Notes internes',
];

const ALLOWED_STATUSES = new Set([
  'Premium',
  'Standard',
  'Inactif',
  'Exclu',
]);

const MAX_ROWS = 1000;

function asText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function normalizeCatalogValue(value) {
  return asText(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[-‐‑‒–—'’`´]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitMultiValue(value) {
  return asText(value)
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEmail(value) {
  return asText(value).toLowerCase();
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeStatus(value) {
  const raw = asText(value);

  if (!raw) return 'Standard';

  const normalized = normalizeCatalogValue(raw);

  const match = [...ALLOWED_STATUSES].find(
    (status) => normalizeCatalogValue(status) === normalized,
  );

  return match || raw;
}

function parseTariff(value) {
  const raw = asText(value);

  if (!raw) {
    return {
      value: null,
      valid: true,
    };
  }

  const normalized = raw
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace('€', '');

  const number = Number(normalized);

  return {
    value: Number.isFinite(number) ? number : null,
    valid: Number.isFinite(number) && number >= 0,
  };
}

function findHeaderRow(rows) {
  for (let index = 0; index < Math.min(rows.length, 30); index += 1) {
    const row = rows[index] || [];

    const candidate = IMPORT_HEADERS.every(
      (header, columnIndex) =>
        asText(row[columnIndex]) === header,
    );

    if (candidate) {
      return index;
    }
  }

  return -1;
}

function rowIsEmpty(row) {
  return row.every((value) => asText(value) === '');
}

function buildCatalogMap(catalog = []) {
  const map = new Map();

  for (const item of catalog) {
    const key = normalizeCatalogValue(
      item?.normalized_name || item?.name,
    );

    if (key && !map.has(key)) {
      map.set(key, item);
    }
  }

  return map;
}

function analyzeRows({
  rawRows,
  competencyCatalog,
  equipmentCatalog,
}) {
  const headerRowIndex = findHeaderRow(rawRows);

  if (headerRowIndex < 0) {
    throw new Error(
      "Le fichier ne correspond pas au modèle Clementplane. Les 12 intitulés de colonnes n'ont pas été retrouvés.",
    );
  }

  const dataRows = rawRows
    .slice(headerRowIndex + 1)
    .filter((row) => !rowIsEmpty(row));

  if (dataRows.length === 0) {
    throw new Error(
      "Le fichier ne contient aucun formateur à analyser.",
    );
  }

  if (dataRows.length > MAX_ROWS) {
    throw new Error(
      `Le fichier contient ${dataRows.length} lignes. La version actuelle accepte au maximum ${MAX_ROWS} formateurs par import.`,
    );
  }

  const competencyMap = buildCatalogMap(competencyCatalog);
  const equipmentMap = buildCatalogMap(equipmentCatalog);

  const rows = dataRows.map((row, rowIndex) => {
    const lineNumber = headerRowIndex + rowIndex + 2;

    const firstName = asText(row[0]);
    const lastName = asText(row[1]);
    const email = normalizeEmail(row[2]);
    const phone = asText(row[3]);
    const address = asText(row[4]);
    const postalCode = asText(row[5]);
    const city = asText(row[6]);
    const tariff = parseTariff(row[7]);
    const status = normalizeStatus(row[8]);
    const competencies = splitMultiValue(row[9]);
    const equipment = splitMultiValue(row[10]);
    const notes = asText(row[11]);

    const errors = [];
    const warnings = [];

    if (!firstName) {
      errors.push('Prénom obligatoire.');
    }

    if (!lastName) {
      errors.push('Nom obligatoire.');
    }

    if (!isValidEmail(email)) {
      errors.push("Adresse e-mail invalide.");
    }

    if (!tariff.valid) {
      errors.push('Tarif invalide.');
    }

    if (!ALLOWED_STATUSES.has(status)) {
      errors.push(
        'Statut non reconnu. Valeurs autorisées : Premium, Standard, Inactif, Exclu.',
      );
    }

    const recognizedCompetencies = [];
    const unknownCompetencies = [];

    for (const value of competencies) {
      const match = competencyMap.get(
        normalizeCatalogValue(value),
      );

      if (match) {
        recognizedCompetencies.push(match);
      } else {
        unknownCompetencies.push(value);
      }
    }

    const recognizedEquipment = [];
    const unknownEquipment = [];

    for (const value of equipment) {
      const match = equipmentMap.get(
        normalizeCatalogValue(value),
      );

      if (match) {
        recognizedEquipment.push(match);
      } else {
        unknownEquipment.push(value);
      }
    }

    if (unknownCompetencies.length > 0) {
      warnings.push(
        `Compétence(s) à vérifier : ${unknownCompetencies.join(', ')}.`,
      );
    }

    if (unknownEquipment.length > 0) {
      warnings.push(
        `Matériel à vérifier : ${unknownEquipment.join(', ')}.`,
      );
    }

    if (!email) {
      warnings.push(
        "Aucune adresse e-mail : ce formateur ne pourra pas être invité à rejoindre Clementplane tant qu'une adresse n'aura pas été renseignée.",
      );
    }

    return {
      lineNumber,
      firstName,
      lastName,
      email,
      phone,
      address,
      postalCode,
      city,
      tariff: tariff.value,
      status,
      competencies,
      equipment,
      notes,
      recognizedCompetencies,
      unknownCompetencies,
      recognizedEquipment,
      unknownEquipment,
      errors,
      warnings,
      valid: errors.length === 0,
    };
  });

  const duplicateEmails = new Map();

  rows.forEach((row) => {
    if (!row.email) return;

    const existing = duplicateEmails.get(row.email) || [];
    existing.push(row.lineNumber);
    duplicateEmails.set(row.email, existing);
  });

  rows.forEach((row) => {
    if (!row.email) return;

    const lines = duplicateEmails.get(row.email) || [];

    if (lines.length > 1) {
      row.warnings.push(
        `Cette adresse e-mail apparaît plusieurs fois dans le fichier (lignes ${lines.join(', ')}).`,
      );
    }
  });

  return {
    rows,
    summary: {
      total: rows.length,
      valid: rows.filter((row) => row.valid).length,
      errors: rows.filter((row) => row.errors.length > 0).length,
      warnings: rows.filter((row) => row.warnings.length > 0).length,
      unknownCompetencies: rows.reduce(
        (total, row) => total + row.unknownCompetencies.length,
        0,
      ),
      unknownEquipment: rows.reduce(
        (total, row) => total + row.unknownEquipment.length,
        0,
      ),
    },
  };
}

async function readCsvFile(file) {
  const result = await new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: false,
      complete: resolve,
      error: reject,
    });
  });

  return result.data || [];
}

async function readExcelFile(file) {
  return readSheet(file, {
    sheet: 1,
    trim: true,
  });
}

export async function analyzeTrainerImportFile({
  file,
  competencyCatalog = [],
  equipmentCatalog = [],
}) {
  if (!file) {
    throw new Error('Sélectionnez un fichier à analyser.');
  }

  const lowerName = file.name.toLowerCase();

  let rawRows;

  if (lowerName.endsWith('.csv')) {
    rawRows = await readCsvFile(file);
  } else if (lowerName.endsWith('.xlsx')) {
    rawRows = await readExcelFile(file);
  } else {
    throw new Error(
      'Format non pris en charge. Utilisez le modèle Excel .xlsx ou un fichier .csv respectant les mêmes colonnes.',
    );
  }

  return analyzeRows({
    rawRows,
    competencyCatalog,
    equipmentCatalog,
  });
}


export function getMatchStrength(candidate) {
  const score = Number(candidate?.match_score || 0);

  if (score >= 95) {
    return {
      label: 'Correspondance très forte',
      tone: 'strong',
    };
  }

  if (score >= 82) {
    return {
      label: 'Correspondance forte',
      tone: 'medium',
    };
  }

  return {
    label: 'Identité identique trouvée',
    tone: 'light',
  };
}


export function getMatchEvidence(candidate) {
  const evidence = [];

  if (candidate?.email_match) {
    evidence.push('e-mail identique');
  }

  if (candidate?.name_match) {
    evidence.push('prénom et nom identiques');
  }

  if (candidate?.phone_match) {
    evidence.push('téléphone cohérent');
  }

  if (candidate?.location_match) {
    evidence.push('localisation cohérente');
  }

  return evidence;
}


export async function findTrainerImportMatches({
  organizationId,
  rows,
}) {
  if (!organizationId) {
    throw new Error(
      "L'organisation est obligatoire pour effectuer le rapprochement.",
    );
  }

  const validRows = (rows || []).filter(
    (row) => row?.valid,
  );

  if (validRows.length === 0) {
    return {};
  }

  const payload = validRows.map((row) => ({
    import_index: row.lineNumber,
    first_name: row.firstName,
    last_name: row.lastName,
    email: row.email,
    phone: row.phone,
    postal_code: row.postalCode,
    city: row.city,
  }));

  const { data, error } = await supabase.rpc(
    'match_trainer_import_candidates',
    {
      p_organization_id: organizationId,
      p_rows: payload,
    },
  );

  if (error) {
    console.error(
      'Erreur de rapprochement des formateurs importés :',
      error,
    );

    throw new Error(
      "Impossible d'effectuer le rapprochement avec la base Clementplane.",
    );
  }

  const candidatesByLine = {};

  for (const candidate of data || []) {
    const key = candidate.import_index;

    if (!candidatesByLine[key]) {
      candidatesByLine[key] = [];
    }

    candidatesByLine[key].push(candidate);
  }

  return candidatesByLine;
}


export async function executeTrainerBulkImport({
  organizationId,
  clientToken,
  rows,
  catalogActions = [],
}) {
  if (!organizationId) {
    throw new Error("L'organisation est obligatoire pour importer les formateurs.");
  }

  if (!clientToken) {
    throw new Error("Le jeton de sécurité de l'import est manquant.");
  }

  const { data, error } = await supabase.rpc(
    'execute_trainer_bulk_import',
    {
      p_organization_id: organizationId,
      p_client_token: clientToken,
      p_rows: rows || [],
      p_catalog_actions: catalogActions || [],
    },
  );

  if (error) {
    console.error('Erreur pendant l’import en masse :', error);

    if (String(error.message || '').includes('DUPLICATE_EMAIL_LINE_')) {
      const line = String(error.message).match(/DUPLICATE_EMAIL_LINE_(\d+)/)?.[1];
      throw new Error(
        `Import interrompu : l’adresse e-mail de la ligne ${line || '?'} est désormais utilisée par un profil existant. Relancez l’analyse du fichier.`,
      );
    }

    throw new Error(
      "L'import n'a pas été enregistré. Aucune modification partielle n'a été conservée.",
    );
  }

  return data;
}
