export function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  return Array.from(
    { length: lastDay },
    (_, index) => index + 1,
  );
}

export function isCurrentMonth(date) {
  const today = new Date();

  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth()
  );
}

export function isTodayInPlanningMonth(
  planningDate,
  day,
) {
  return (
    isCurrentMonth(planningDate) &&
    day === new Date().getDate()
  );
}

export function getISODate(
  planningDate,
  day,
) {
  const year =
    planningDate.getFullYear();

  const month = String(
    planningDate.getMonth() + 1,
  ).padStart(2, '0');

  const formattedDay = String(
    day,
  ).padStart(2, '0');

  return `${year}-${month}-${formattedDay}`;
}

export function getMonthLabel(
  planningDate,
) {
  return planningDate.toLocaleDateString(
    'fr-FR',
    {
      month: 'long',
      year: 'numeric',
    },
  );
}

export function getPlanningCellAppearance(
  status,
) {
  switch (status) {
    case 'dispo':
      return {
        label: 'Disponible',
        background: '#86efac',
        border: '#22c55e',
      };

    case 'indispo':
      return {
        label: 'Indisponible',
        background: '#fca5a5',
        border: '#ef4444',
      };

    case 'option':
      return {
        label: 'Option',
        background: '#fde68a',
        border: '#f59e0b',
      };

    case 'mission':
      return {
        label: 'En mission',
        background: '#93c5fd',
        border: '#2563eb',
      };

    default:
      return {
        label: 'Non renseigné',
        background: '#f1f5f9',
        border: '#cbd5e1',
      };
  }
}

export function getNotes(note) {
  if (!note) {
    return [];
  }

  return note
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getPlanningTooltip({
  fullName,
  day,
  monthLabel,
  availability,
}) {
  const appearance =
    getPlanningCellAppearance(
      availability?.status,
    );

  const lines = [
    fullName || 'Formateur',
    `${day} ${monthLabel}`,
    appearance.label,
  ];

  if (
    availability?.status ===
    'option'
  ) {
    lines.push(
      '',
      "Le formateur a accepté une proposition, mais l'OF ne l'a pas encore affecté. Il reste disponible.",
    );
  }

  if (
    availability?.status ===
    'mission'
  ) {
    lines.push(
      '',
      'Mission officiellement affectée : le formateur est indisponible.',
    );
  }

  const notes = getNotes(
    availability?.note,
  );

  if (notes.length > 0) {
    lines.push('', 'Notes :');

    for (const note of notes) {
      lines.push(`• ${note}`);
    }
  }

  return lines.join('\n');
}

export function planningGridStyle(
  dayCount,
) {
  return {
    display: 'grid',
    gridTemplateColumns:
      `repeat(${dayCount}, 17px)`,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  };
}
