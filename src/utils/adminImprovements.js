const validCategories = new Set(['bug', 'improvement', 'idea', 'other']);
const validPriorities = new Set(['low', 'normal', 'high', 'blocking']);

export function buildImprovementPayload(values) {
  const title = values.title?.trim() || '';
  const description = values.description?.trim() || '';
  if (!title) throw new Error('Le titre est obligatoire.');
  if (!description) throw new Error('La note explicative est obligatoire.');

  return {
    title,
    description,
    origin: values.origin?.trim() || null,
    category: validCategories.has(values.category) ? values.category : 'other',
    priority: validPriorities.has(values.priority) ? values.priority : 'normal',
  };
}

export function filterImprovementItems(items, filters) {
  const query = (filters.query || '').trim().toLocaleLowerCase('fr');
  return items.filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.category !== 'all' && item.category !== filters.category) return false;
    if (filters.priority !== 'all' && item.priority !== filters.priority) return false;
    if (!query) return true;
    return `${item.title} ${item.description} ${item.origin || ''}`
      .toLocaleLowerCase('fr')
      .includes(query);
  });
}
