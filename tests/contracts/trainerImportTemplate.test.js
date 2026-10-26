import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';

describe('Trainer import template download', () => {
  it('links to an existing Excel workbook with the required import columns', () => {
    const page = fs.readFileSync('src/pages/TrainerBulkImport.jsx', 'utf8');
    const url = page.match(/const MODEL_URL\s*=\s*['"]([^'"]+)['"]/)?.[1];
    expect(url).toBeTruthy();
    const file = path.join('public', url);
    expect(fs.existsSync(file), `Download target missing: ${url}`).toBe(true);
    const bytes = fs.readFileSync(file);
    expect(bytes.subarray(0, 2).toString()).toBe('PK');
    const workbook = XLSX.read(bytes, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
    expect(rows).toContainEqual([
      'Prénom*', 'Nom*', 'E-mail', 'Téléphone', 'Adresse', 'Code postal',
      'Ville', 'Tarif (€)', 'Statut', 'Compétences', 'Matériel', 'Notes internes',
    ]);
  });
});
