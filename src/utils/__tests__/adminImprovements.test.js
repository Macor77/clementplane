import { describe, expect, it } from 'vitest';
import {
  buildImprovementPayload,
  filterImprovementItems,
} from '../adminImprovements';

const items = [
  {
    id: '1',
    title: 'Invitation classée en spam',
    description: 'Le message est arrivé dans les indésirables.',
    origin: 'Chéhine',
    category: 'bug',
    priority: 'high',
    status: 'to_do',
  },
  {
    id: '2',
    title: 'Simplifier le tableau de bord',
    description: 'Réduire le nombre de cartes.',
    origin: 'Test Vincent',
    category: 'improvement',
    priority: 'normal',
    status: 'completed',
  },
];

describe('registre Admin des améliorations', () => {
  it('affiche uniquement les éléments à traiter par défaut', () => {
    expect(filterImprovementItems(items, {
      status: 'to_do', category: 'all', priority: 'all', query: '',
    }).map((item) => item.id)).toEqual(['1']);
  });

  it('combine les filtres de statut, catégorie, priorité et recherche', () => {
    expect(filterImprovementItems(items, {
      status: 'all', category: 'bug', priority: 'high', query: 'chéhine',
    }).map((item) => item.id)).toEqual(['1']);
    expect(filterImprovementItems(items, {
      status: 'completed', category: 'all', priority: 'all', query: 'tableau',
    }).map((item) => item.id)).toEqual(['2']);
  });

  it('normalise les champs et applique les valeurs par défaut à la création', () => {
    expect(buildImprovementPayload({
      title: '  Corriger le mail  ',
      description: '  Vérifier la délivrabilité.  ',
      origin: '  Chéhine  ',
      category: 'bug',
    })).toEqual({
      title: 'Corriger le mail',
      description: 'Vérifier la délivrabilité.',
      origin: 'Chéhine',
      category: 'bug',
      priority: 'normal',
    });
  });

  it('refuse un titre ou une note explicative vide', () => {
    expect(() => buildImprovementPayload({ title: ' ', description: 'Note' }))
      .toThrow('Le titre est obligatoire.');
    expect(() => buildImprovementPayload({ title: 'Titre', description: ' ' }))
      .toThrow('La note explicative est obligatoire.');
  });
});
