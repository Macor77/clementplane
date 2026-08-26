import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  createMyAvailabilityContact,
  deleteMyAvailabilityContact,
  getMyAvailabilityContacts,
  updateMyAvailabilityContact,
} from '../../services/trainerAvailabilityContactsService';

import {
  getMyAvailabilitySharePreview,
  getSharedDayState,
  getPublicSharedDayState,
} from '../../services/trainerAvailabilityShareService';

import {
  sendTrainerAvailabilityShareEmail,
} from '../../services/emailService';

import { useAuth } from '../../context/AuthContext';
import { getMyTrainerProfile } from '../../services/trainerProfileService';


const EMPTY_FORM = {
  organizationName: '',
  contactName: '',
  email: '',
  phone: '',
};


function formatShareDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(new Date(value));
}


function formatSharedMonths(months = []) {
  if (!Array.isArray(months) || months.length === 0) {
    return '';
  }

  return months
    .map((value) =>
      monthLabelFromKey(value),
    )
    .join(', ');
}


function getDeliveryStatusPresentation(lastShare) {
  if (!lastShare?.sentAt) {
    return null;
  }

  const status =
    String(lastShare.status || '');

  if (status === 'delivered') {
    return {
      label: 'Délivré',
      color: '#15803d',
      background: '#dcfce7',
    };
  }

  if (
    [
      'failed',
      'soft_bounce',
      'hard_bounce',
      'blocked',
      'invalid',
    ].includes(status)
  ) {
    return {
      label: 'Non délivré',
      color: '#b42318',
      background: '#fee2e2',
    };
  }

  return {
    label: 'En cours de livraison',
    color: '#a16207',
    background: '#fef3c7',
  };
}


function pad(value) {
  return String(value).padStart(2, '0');
}


function toISODate(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
}


function monthKey(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
  ].join('-');
}


function monthDateFromKey(value) {
  const [
    year,
    month,
  ] = String(value)
    .split('-')
    .map(Number);

  return new Date(
    year,
    month - 1,
    1,
  );
}


function monthLabelFromKey(value) {
  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      month: 'long',
      year: 'numeric',
    },
  ).format(
    monthDateFromKey(value),
  );
}


function getMonthRangeFromKeys(keys) {
  if (!keys.length) {
    return null;
  }

  const ordered =
    [...keys].sort();

  const first =
    monthDateFromKey(
      ordered[0],
    );

  const last =
    monthDateFromKey(
      ordered[
        ordered.length - 1
      ],
    );

  return {
    startDay:
      toISODate(
        new Date(
          first.getFullYear(),
          first.getMonth(),
          1,
        ),
      ),

    endDay:
      toISODate(
        new Date(
          last.getFullYear(),
          last.getMonth() + 1,
          0,
        ),
      ),
  };
}


function getMonthMatrix(monthKeyValue) {
  const refDate =
    monthDateFromKey(
      monthKeyValue,
    );

  const year =
    refDate.getFullYear();

  const month =
    refDate.getMonth();

  const first =
    new Date(
      year,
      month,
      1,
    );

  const last =
    new Date(
      year,
      month + 1,
      0,
    );

  const start =
    new Date(first);

  const startOffset =
    (first.getDay() + 6) % 7;

  start.setDate(
    first.getDate() -
      startOffset,
  );

  const end =
    new Date(last);

  const endOffset =
    (last.getDay() + 6) % 7;

  end.setDate(
    last.getDate() +
      (6 - endOffset),
  );

  const days = [];

  const cursor =
    new Date(start);

  while (cursor <= end) {
    days.push(
      new Date(cursor),
    );

    cursor.setDate(
      cursor.getDate() + 1,
    );
  }

  const weeks = [];

  for (
    let index = 0;
    index < days.length;
    index += 7
  ) {
    weeks.push(
      days.slice(
        index,
        index + 7,
      ),
    );
  }

  return weeks;
}


function StatusBadge({
  children,
  tone = 'neutral',
}) {
  const palette = {
    success: {
      background: '#dcfce7',
      color: '#15803d',
    },

    info: {
      background: '#dbeafe',
      color: '#1d4ed8',
    },

    neutral: {
      background: '#f1f5f9',
      color: '#64748b',
    },
  };

  const colors =
    palette[tone] ||
    palette.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        ...colors,
      }}
    >
      {children}
    </span>
  );
}


function SharedDay({
  date,
  currentMonth,
  state,
}) {
  const inMonth =
    date.getMonth() ===
    currentMonth;

  if (!inMonth) {
    return (
      <div
        style={{
          minHeight: 66,
          borderRadius: 10,
          background: '#f8fafc',
          opacity: 0.42,
        }}
      />
    );
  }


  const palettes = {
    available: {
      background: '#f0fdf4',
      border: '#86efac',
      color: '#15803d',
    },

    unavailable: {
      background: '#fef2f2',
      border: '#fecaca',
      color: '#b42318',
    },

    option: {
      background: '#fffbeb',
      border: '#fde68a',
      color: '#a16207',
    },

    mission: {
      background: '#eff6ff',
      border: '#bfdbfe',
      color: '#1d4ed8',
    },

    unknown: {
      background: '#f8fafc',
      border: '#e2e8f0',
      color: '#64748b',
    },
  };


  const palette =
    palettes[state.tone] ||
    palettes.unknown;


  return (
    <div
      style={{
        minHeight: 66,
        border:
          `1px solid ${palette.border}`,
        borderRadius: 10,
        padding: 7,
        background:
          palette.background,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#475569',
        }}
      >
        {date.getDate()}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          lineHeight: 1.25,
          fontWeight: 800,
          color: palette.color,
        }}
      >
        {state.label}
      </div>

      {state.otherOptionsCount > 0 ? (
        <div
          style={{
            marginTop: 4,
            fontSize: 9.5,
            lineHeight: 1.3,
            color: '#854d0e',
            fontWeight: 700,
          }}
        >
          ⚠️{' '}
          {state.otherOptionsCount === 1
            ? "1 autre organisme s'est positionné"
            : `${state.otherOptionsCount} autres organismes se sont positionnés`}
        </div>
      ) : null}
    </div>
  );
}



function publicMonthTitle(monthKey) {
  const [year, month] =
    String(monthKey || '')
      .split('-')
      .map(Number);

  if (!year || !month) {
    return '';
  }

  const label =
    new Intl.DateTimeFormat(
      'fr-FR',
      {
        month: 'long',
        year: 'numeric',
      },
    ).format(
      new Date(
        year,
        month - 1,
        1,
      ),
    );

  return (
    label.charAt(0).toUpperCase() +
    label.slice(1)
  );
}


function buildPublicShareText({
  trainerName,
  monthKey,
  skills = [],
}) {
  const month =
    publicMonthTitle(
      monthKey,
    );

  const selectedSkills =
    Array.isArray(skills)
      ? skills.filter(Boolean)
      : [];

  const skillsLine =
    selectedSkills.length > 0
      ? `🎓 J'interviens notamment en : ${selectedSkills.join(' · ')}`
      : '';

  return [
    `📅 Mes disponibilités pour ${month}`,
    '',
    'Mes disponibilités évoluent. Mon planning aussi.',
    `Retrouvez ci-dessous mes créneaux disponibles pour ${month}.`,
    skillsLine,
    '',
    'Je partage désormais mon planning simplement avec mes organismes partenaires grâce à Formaplane.',
    '',
    'Formaplane — La plateforme qui connecte formateurs et organismes de formation.',
    trainerName
      ? `— ${trainerName}`
      : '',
  ]
    .filter(
      (line) =>
        line !== null &&
        line !== undefined,
    )
    .join('\n');
}


function getPublicCalendarDays(monthKey) {
  const [year, month] =
    String(monthKey || '')
      .split('-')
      .map(Number);

  if (!year || !month) {
    return [];
  }

  const first =
    new Date(
      year,
      month - 1,
      1,
    );

  const daysInMonth =
    new Date(
      year,
      month,
      0,
    ).getDate();

  const leading =
    (first.getDay() + 6) %
    7;

  const cells = [];

  for (
    let index = 0;
    index < leading;
    index += 1
  ) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day += 1
  ) {
    const iso =
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    cells.push({
      day,
      iso,
    });
  }

  while (
    cells.length % 7 !== 0
  ) {
    cells.push(null);
  }

  return cells;
}


function roundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius,
) {
  const r =
    Math.min(
      radius,
      width / 2,
      height / 2,
    );

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(
    x + width,
    y,
    x + width,
    y + height,
    r,
  );
  ctx.arcTo(
    x + width,
    y + height,
    x,
    y + height,
    r,
  );
  ctx.arcTo(
    x,
    y + height,
    x,
    y,
    r,
  );
  ctx.arcTo(
    x,
    y,
    x + width,
    y,
    r,
  );
  ctx.closePath();
}


function wrapCanvasText(
  ctx,
  text,
  maxWidth,
) {
  const words =
    String(text || '')
      .split(/\s+/)
      .filter(Boolean);

  const lines = [];
  let current = '';

  words.forEach(
    (word) => {
      const candidate =
        current
          ? `${current} ${word}`
          : word;

      if (
        ctx.measureText(
          candidate,
        ).width >
          maxWidth &&
        current
      ) {
        lines.push(
          current,
        );
        current = word;
      } else {
        current =
          candidate;
      }
    },
  );

  if (current) {
    lines.push(current);
  }

  return lines;
}


async function loadBrandImage() {
  return new Promise(
    (resolve) => {
      const image =
        new Image();

      image.onload =
        () =>
          resolve(image);

      image.onerror =
        () =>
          resolve(null);

      image.src =
        '/brand/formaplane-logo.svg';
    },
  );
}


async function createPublicAvailabilityImage({
  trainerName,
  monthKey,
  declaredByDay,
  commitmentsByDay,
  skills = [],
}) {
  const width = 1080;
  const height = 1350;

  const canvas =
    document.createElement(
      'canvas',
    );

  canvas.width = width;
  canvas.height = height;

  const ctx =
    canvas.getContext(
      '2d',
    );

  ctx.fillStyle =
    '#f4f7fb';
  ctx.fillRect(
    0,
    0,
    width,
    height,
  );

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      width,
      0,
    );

  gradient.addColorStop(
    0,
    '#123b72',
  );
  gradient.addColorStop(
    1,
    '#2563eb',
  );

  ctx.fillStyle =
    gradient;
  ctx.fillRect(
    0,
    0,
    width,
    250,
  );

  const logo =
    await loadBrandImage();

  if (logo) {
    ctx.drawImage(
      logo,
      70,
      54,
      270,
      76,
    );
  } else {
    ctx.fillStyle =
      '#ffffff';
    ctx.font =
      '800 42px Arial';
    ctx.fillText(
      'Formaplane',
      70,
      105,
    );
  }

  ctx.fillStyle =
    '#dbeafe';
  ctx.font =
    '700 22px Arial';
  ctx.fillText(
    'MES DISPONIBILITÉS',
    70,
    175,
  );

  ctx.fillStyle =
    '#ffffff';
  ctx.font =
    '800 42px Arial';
  ctx.fillText(
    publicMonthTitle(
      monthKey,
    ),
    70,
    225,
  );

  roundedRect(
    ctx,
    55,
    285,
    970,
    820,
    28,
  );
  ctx.fillStyle =
    '#ffffff';
  ctx.fill();

  ctx.fillStyle =
    '#0f2747';
  ctx.font =
    '800 34px Arial';
  ctx.fillText(
    trainerName ||
      'Formateur',
    90,
    350,
  );

  ctx.fillStyle =
    '#64748b';
  ctx.font =
    '500 20px Arial';
  ctx.fillText(
    'Voici mes disponibilités pour le mois.',
    90,
    385,
  );

  const selectedSkills =
    Array.isArray(skills)
      ? skills
          .filter(Boolean)
          .slice(0, 4)
      : [];

  if (selectedSkills.length > 0) {
    let chipX = 90;
    let chipY = 415;

    ctx.font =
      '700 15px Arial';

    selectedSkills.forEach(
      (skill) => {
        const label =
          String(skill);

        const chipWidth =
          Math.min(
            260,
            ctx.measureText(
              label,
            ).width + 30,
          );

        if (
          chipX +
            chipWidth >
          990
        ) {
          chipX = 90;
          chipY += 42;
        }

        roundedRect(
          ctx,
          chipX,
          chipY,
          chipWidth,
          32,
          16,
        );

        ctx.fillStyle =
          '#eff6ff';
        ctx.fill();

        ctx.strokeStyle =
          '#bfdbfe';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle =
          '#1d4ed8';
        ctx.textAlign =
          'center';

        ctx.fillText(
          label,
          chipX +
            chipWidth / 2,
          chipY + 21,
        );

        chipX +=
          chipWidth + 9;
      },
    );
  }

  const weekdays =
    [
      'LUN',
      'MAR',
      'MER',
      'JEU',
      'VEN',
      'SAM',
      'DIM',
    ];

  const gridX = 88;
  const gridY =
    selectedSkills.length > 0
      ? 500
      : 435;
  const cellGap = 9;
  const cellWidth = 122;
  const cellHeight = 91;

  ctx.font =
    '800 16px Arial';
  ctx.textAlign =
    'center';

  weekdays.forEach(
    (label, index) => {
      ctx.fillStyle =
        '#64748b';
      ctx.fillText(
        label,
        gridX +
          index *
            (cellWidth +
              cellGap) +
          cellWidth / 2,
        gridY,
      );
    },
  );

  const cells =
    getPublicCalendarDays(
      monthKey,
    );

  const palette = {
    available: {
      background:
        '#dcfce7',
      border:
        '#86efac',
      text:
        '#15803d',
    },
    unavailable: {
      background:
        '#fee2e2',
      border:
        '#fecaca',
      text:
        '#b42318',
    },
    unknown: {
      background:
        '#f1f5f9',
      border:
        '#e2e8f0',
      text:
        '#64748b',
    },
  };

  cells.forEach(
    (cell, index) => {
      if (!cell) {
        return;
      }

      const column =
        index % 7;
      const row =
        Math.floor(
          index / 7,
        );

      const x =
        gridX +
        column *
          (cellWidth +
            cellGap);

      const y =
        gridY +
        28 +
        row *
          (cellHeight +
            cellGap);

      const state =
        getPublicSharedDayState({
          day:
            cell.iso,
          declaredByDay,
          commitmentsByDay,
        });

      const colors =
        palette[
          state.key
        ] ||
        palette.unknown;

      roundedRect(
        ctx,
        x,
        y,
        cellWidth,
        cellHeight,
        14,
      );

      ctx.fillStyle =
        colors.background;
      ctx.fill();

      ctx.strokeStyle =
        colors.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign =
        'left';
      ctx.fillStyle =
        '#475569';
      ctx.font =
        '800 18px Arial';
      ctx.fillText(
        String(
          cell.day,
        ),
        x + 12,
        y + 25,
      );

      ctx.fillStyle =
        colors.text;
      ctx.font =
        '800 14px Arial';

      const lines =
        wrapCanvasText(
          ctx,
          state.label,
          cellWidth -
            24,
        );

      lines
        .slice(0, 2)
        .forEach(
          (
            line,
            lineIndex,
          ) => {
            ctx.fillText(
              line,
              x + 12,
              y +
                54 +
                lineIndex *
                  17,
            );
          },
        );
    },
  );

  ctx.textAlign =
    'left';

  const legendY =
    1055;

  [
    [
      '#15803d',
      'Disponible',
    ],
    [
      '#b42318',
      'Indisponible',
    ],
    [
      '#64748b',
      'Non renseigné',
    ],
  ].forEach(
    (
      [
        color,
        label,
      ],
      index,
    ) => {
      const x =
        100 +
        index * 285;

      ctx.fillStyle =
        color;
      ctx.beginPath();
      ctx.arc(
        x,
        legendY,
        7,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      ctx.fillStyle =
        '#475569';
      ctx.font =
        '700 16px Arial';
      ctx.fillText(
        label,
        x + 16,
        legendY + 5,
      );
    },
  );

  ctx.fillStyle =
    '#0f2747';
  ctx.font =
    '800 27px Arial';

  const hookLines =
    wrapCanvasText(
      ctx,
      'Mes disponibilités évoluent. Mon planning aussi.',
      880,
    );

  hookLines.forEach(
    (
      line,
      index,
    ) => {
      ctx.fillText(
        line,
        90,
        1170 +
          index * 34,
      );
    },
  );

  ctx.fillStyle =
    '#2563eb';
  ctx.font =
    '700 19px Arial';
  ctx.fillText(
    'Je les partage simplement avec Formaplane.',
    90,
    1245,
  );

  ctx.fillStyle =
    '#64748b';
  ctx.font =
    '600 16px Arial';
  ctx.fillText(
    'Formaplane — La plateforme qui connecte formateurs et organismes de formation.',
    90,
    1290,
  );

  return canvas;
}


function pdfBinaryFromCanvases(canvases) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let length = 0;

  const pushText = (text) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    length += bytes.length;
  };

  const pushBytes = (bytes) => {
    chunks.push(bytes);
    length += bytes.length;
  };

  pushText('%PDF-1.4\n%Formaplane\n');

  const objectCount = 2 + canvases.length * 3;
  const pageObjectIds = canvases.map((_, index) => 3 + index * 3);

  const startObject = (id) => {
    offsets[id] = length;
    pushText(`${id} 0 obj\n`);
  };

  startObject(1);
  pushText('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  startObject(2);
  pushText(`<< /Type /Pages /Count ${canvases.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] >>\nendobj\n`);

  canvases.forEach((canvas, index) => {
    const pageId = 3 + index * 3;
    const imageId = pageId + 1;
    const contentId = pageId + 2;
    const base64 = canvas.toDataURL('image/jpeg', 0.98).split(',')[1];
    const binary = atob(base64);
    const imageBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      imageBytes[i] = binary.charCodeAt(i);
    }

    startObject(pageId);
    pushText(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`);

    startObject(imageId);
    pushText(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`);
    pushBytes(imageBytes);
    pushText('\nendstream\nendobj\n');

    const content = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im${index + 1} Do Q`;
    const contentBytes = encoder.encode(content);
    startObject(contentId);
    pushText(`<< /Length ${contentBytes.length} >>\nstream\n`);
    pushBytes(contentBytes);
    pushText('\nendstream\nendobj\n');
  });

  const xrefOffset = length;
  pushText(`xref\n0 ${objectCount + 1}\n`);
  pushText('0000000000 65535 f \n');
  for (let id = 1; id <= objectCount; id += 1) {
    pushText(`${String(offsets[id] || 0).padStart(10, '0')} 00000 n \n`);
  }
  pushText(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks, { type: 'application/pdf' });
}


function createAvailabilityPdfPage({
  trainerName,
  recipientName,
  recipientOrganizationId,
  monthKeyValue,
  availabilityByDay,
  commitmentsByDay,
  skills = [],
  trainerMessage = '',
}) {
  const canvas = document.createElement('canvas');
  // A4 à ~300 dpi : le PDF reste net à l'écran et à l'impression.
  canvas.width = 2480;
  canvas.height = 3508;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1240, 1754);

  ctx.fillStyle = '#eff6ff';
  ctx.fillRect(0, 0, canvas.width, 330);

  ctx.fillStyle = '#2563eb';
  ctx.font = '800 38px Arial';
  ctx.fillText('FORMAPLANE', 80, 90);

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 54px Arial';
  ctx.fillText('Mes disponibilités', 80, 180);

  ctx.fillStyle = '#334155';
  ctx.font = '700 28px Arial';
  ctx.fillText(trainerName || 'Formateur', 80, 235);

  ctx.fillStyle = '#64748b';
  ctx.font = '600 22px Arial';
  ctx.fillText(monthLabelFromKey(monthKeyValue), 80, 280);

  if (recipientName) {
    ctx.fillStyle = '#1d4ed8';
    ctx.font = '700 18px Arial';
    ctx.fillText(`Préparé pour ${recipientName}`, 80, 315);
  }

  if (skills.length > 0) {
    const skillText = skills.slice(0, 5).join(' • ');
    ctx.fillStyle = '#475569';
    ctx.font = '600 16px Arial';
    ctx.fillText(skillText.slice(0, 115), 80, 345);
  }

  const normalizedTrainerMessage = String(trainerMessage || '').trim();
  if (normalizedTrainerMessage) {
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#dbeafe';
    ctx.lineWidth = 2;
    ctx.fillRect(80, 370, 1080, 82);
    ctx.strokeRect(80, 370, 1080, 82);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '800 15px Arial';
    ctx.fillText('MESSAGE DU FORMATEUR', 102, 396);
    ctx.fillStyle = '#334155';
    ctx.font = '500 16px Arial';
    const messageLines = wrapCanvasText(ctx, normalizedTrainerMessage, 1015).slice(0, 2);
    messageLines.forEach((line, index) => {
      ctx.fillText(line, 102, 423 + index * 20);
    });
  }

  const matrix = getMonthMatrix(monthKeyValue);
  const days = matrix.flat();
  const ref = monthDateFromKey(monthKeyValue);
  const currentMonth = ref.getMonth();
  const weekLabels = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
  const gridX = 80;
  const gridY = normalizedTrainerMessage ? 505 : 425;
  const cellW = 154;
  const cellH = normalizedTrainerMessage ? 142 : 152;

  ctx.font = '800 18px Arial';
  ctx.textAlign = 'center';
  weekLabels.forEach((label, index) => {
    ctx.fillStyle = '#475569';
    ctx.fillText(label, gridX + index * cellW + cellW / 2, gridY - 26);
  });

  days.forEach((date, index) => {
    const col = index % 7;
    const row = Math.floor(index / 7);
    const x = gridX + col * cellW;
    const y = gridY + row * cellH;
    const inMonth = date.getMonth() === currentMonth;
    const day = toISODate(date);
    const state = getSharedDayState({
      day,
      availabilityByDay,
      commitmentsByDay,
      recipientOrganizationId: recipientOrganizationId || null,
    });

    ctx.fillStyle = inMonth ? '#ffffff' : '#f8fafc';
    ctx.fillRect(x, y, cellW - 4, cellH - 4);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellW - 4, cellH - 4);

    ctx.textAlign = 'left';
    ctx.fillStyle = inMonth ? '#0f172a' : '#94a3b8';
    ctx.font = '800 24px Arial';
    ctx.fillText(String(date.getDate()), x + 14, y + 34);

    if (inMonth) {
      let background = '#f1f5f9';
      let foreground = '#64748b';
      if (state.key === 'available') {
        background = '#dcfce7';
        foreground = '#15803d';
      } else if (state.key === 'unavailable') {
        background = '#fee2e2';
        foreground = '#b42318';
      } else if (state.key === 'option_with_recipient') {
        background = '#fef3c7';
        foreground = '#a16207';
      } else if (state.key === 'mission_with_recipient') {
        background = '#dbeafe';
        foreground = '#1d4ed8';
      }
      ctx.fillStyle = background;
      ctx.fillRect(x + 10, y + 58, cellW - 24, 58);
      ctx.textAlign = 'center';
      ctx.fillStyle = foreground;
      ctx.font = '800 13px Arial';
      let pdfLabel = state.otherOptionsCount > 0 && state.key === 'available'
        ? 'Disponible*'
        : state.label;
      if (state.key === 'mission_with_recipient') pdfLabel = 'Mission avec vous';
      if (state.key === 'option_with_recipient') pdfLabel = 'Option avec vous';
      const labelLines = wrapCanvasText(ctx, pdfLabel, cellW - 38).slice(0, 2);
      labelLines.forEach((line, lineIndex) => {
        ctx.fillText(line, x + (cellW - 4) / 2, y + 86 + lineIndex * 17);
      });
    }
  });

  const footerY = 1435;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(80, footerY, 1080, 178);
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 21px Arial';
  ctx.fillText('Disponibilités indicatives', 105, footerY + 38);
  ctx.fillStyle = '#64748b';
  ctx.font = '500 17px Arial';
  ctx.fillText('Merci de confirmer directement avec le formateur avant toute programmation.', 105, footerY + 72);
  ctx.font = '500 14px Arial';
  ctx.fillText('* Une ou plusieurs autres demandes peuvent être en cours, sans révéler l’organisme concerné.', 105, footerY + 104);
  ctx.fillStyle = '#2563eb';
  ctx.font = '700 17px Arial';
  ctx.fillText('Disponibilités gérées avec Formaplane - formaplane.fr', 105, footerY + 142);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 15px Arial';
  ctx.fillText(
    `Document généré le ${new Intl.DateTimeFormat('fr-FR').format(new Date())}`,
    1160,
    1705,
  );

  return canvas;
}


export default function TrainerAvailabilityShare() {
  const navigate = useNavigate();
  const contactManagementEnabledHere = false;

  const {
    profile,
    trainerProfile,
  } = useAuth();

  const publicTrainerName =
    [trainerProfile?.prenom, trainerProfile?.nom]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'Formateur';

  const [
    contacts,
    setContacts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM,
  );

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    contactToDelete,
    setContactToDelete,
  ] = useState(null);

  const [
    shareIntroOpen,
    setShareIntroOpen,
  ] = useState(true);

  const contactFormRef = useRef(null);
  const organizationNameInputRef = useRef(null);


  const monthChoices =
    useMemo(() => {
      const current =
        new Date();

      return Array.from(
        {
          length: 6,
        },
        (
          _,
          index,
        ) => {
          const date =
            new Date(
              current.getFullYear(),
              current.getMonth() +
                index,
              1,
            );

          return {
            key:
              monthKey(date),

            label:
              new Intl.DateTimeFormat(
                'fr-FR',
                {
                  month: 'long',
                  year: 'numeric',
                },
              ).format(
                date,
              ),
          };
        },
      );
    }, []);


  const [
    selectedMonths,
    setSelectedMonths,
  ] = useState(
    () => [
      monthKey(
        new Date(),
      ),
    ],
  );


  const [
    previewContactId,
    setPreviewContactId,
  ] = useState('');

  const [
    pdfContactId,
    setPdfContactId,
  ] = useState('');


  const [
    previewData,
    setPreviewData,
  ] = useState(null);

  const [
    previewLoading,
    setPreviewLoading,
  ] = useState(false);

  const [
    previewError,
    setPreviewError,
  ] = useState('');


  const [
    selectedContactIds,
    setSelectedContactIds,
  ] = useState([]);

  const [
    sendingShare,
    setSendingShare,
  ] = useState(false);

  const [
    sendConfirmOpen,
    setSendConfirmOpen,
  ] = useState(false);

  const [
    sendMessage,
    setSendMessage,
  ] = useState('');

  const [
    sendError,
    setSendError,
  ] = useState('');

  const [
    copyToSender,
    setCopyToSender,
  ] = useState(false);

  const [
    pdfLoading,
    setPdfLoading,
  ] = useState(false);

  const [
    pdfMessage,
    setPdfMessage,
  ] = useState('');

  const [
    pdfError,
    setPdfError,
  ] = useState('');


  const [
    commonShareMessage,
    setCommonShareMessage,
  ] = useState('');

  const [
    customizeMessages,
    setCustomizeMessages,
  ] = useState(false);

  const [
    customMessagesByContact,
    setCustomMessagesByContact,
  ] = useState({});


  const [
    publicShareMonth,
    setPublicShareMonth,
  ] = useState(
    () => monthKey(new Date()),
  );

  const [
    publicShareLoading,
    setPublicShareLoading,
  ] = useState(false);

  const [
    publicShareMessage,
    setPublicShareMessage,
  ] = useState('');

  const [
    publicShareError,
    setPublicShareError,
  ] = useState('');


  const [
    publicSkills,
    setPublicSkills,
  ] = useState([]);

  const [
    selectedPublicSkills,
    setSelectedPublicSkills,
  ] = useState([]);

  const [
    publicPostText,
    setPublicPostText,
  ] = useState('');

  const [
    publicPostTextDirty,
    setPublicPostTextDirty,
  ] = useState(false);


  const previewContact =
    useMemo(
      () =>
        contacts.find(
          (contact) =>
            contact.id ===
            previewContactId,
        ) || null,
      [
        contacts,
        previewContactId,
      ],
    );

  const pdfContact =
    useMemo(
      () =>
        contacts.find(
          (contact) =>
            contact.id ===
            pdfContactId,
        ) || null,
      [contacts, pdfContactId],
    );


  const loadContacts =
    useCallback(async () => {
      setLoading(true);
      setError('');

      try {
        const rows =
          await getMyAvailabilityContacts();

        setContacts(
          rows,
        );

        setSelectedContactIds(
          (current) =>
            current.filter(
              (contactId) =>
                rows.some(
                  (contact) =>
                    contact.id === contactId &&
                    contact?.last_share?.canShare !== false,
                ),
            ),
        );

        setPreviewContactId(
          (current) =>
            current ||
            rows?.[0]?.id ||
            '',
        );

        setPdfContactId(
          (current) =>
            current ||
            rows?.[0]?.id ||
            '',
        );
      } catch (loadError) {
        setError(
          loadError?.message ||
            "Impossible de charger votre carnet d'organismes.",
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadContacts();
  }, [loadContacts]);


  useEffect(() => {
    let active = true;

    async function loadPublicProfile() {
      try {
        const trainer =
          await getMyTrainerProfile();

        if (!active) {
          return;
        }

        const skills =
          Array.isArray(
            trainer?.competences,
          )
            ? trainer.competences
            : Array.isArray(
                trainer?.skills,
              )
              ? trainer.skills
              : [];

        setPublicSkills(
          skills.filter(Boolean),
        );
      } catch (profileError) {
        console.error(
          'Chargement des compétences impossible :',
          profileError,
        );
      }
    }

    loadPublicProfile();

    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    if (
      publicPostTextDirty
    ) {
      return;
    }

    setPublicPostText(
      buildPublicShareText({
        trainerName:
          publicTrainerName,
        monthKey:
          publicShareMonth,
        skills:
          selectedPublicSkills,
      }),
    );
  }, [
    publicPostTextDirty,
    publicTrainerName,
    publicShareMonth,
    selectedPublicSkills,
  ]);


  const loadPreview =
    useCallback(async () => {
      if (
        !previewContact ||
        selectedMonths.length === 0
      ) {
        setPreviewData(null);
        return;
      }

      const range =
        getMonthRangeFromKeys(
          selectedMonths,
        );

      if (!range) {
        setPreviewData(null);
        return;
      }

      setPreviewLoading(true);
      setPreviewError('');

      try {
        const data =
          await getMyAvailabilitySharePreview({
            ...range,
            organizationId:
              previewContact.organization_id,
          });

        setPreviewData(data);
      } catch (loadError) {
        console.error(
          'Préparation de l’aperçu impossible :',
          loadError,
        );

        setPreviewError(
          "Impossible de préparer l'aperçu de vos disponibilités.",
        );
      } finally {
        setPreviewLoading(false);
      }
    }, [
      previewContact,
      selectedMonths,
    ]);


  useEffect(() => {
    loadPreview();
  }, [loadPreview]);


  const resetForm = () => {
    setForm(
      EMPTY_FORM,
    );

    setEditingId(null);
    setError('');
  };


  const change = (event) => {
    setForm(
      (previous) => ({
        ...previous,
        [
          event.target.name
        ]:
          event.target.value,
      }),
    );

    setError('');
    setMessage('');
  };


  const sortContacts =
    (rows) =>
      [...rows].sort(
        (
          first,
          second,
        ) =>
          String(
            first.organization_name ||
              '',
          ).localeCompare(
            String(
              second.organization_name ||
                '',
            ),
            'fr',
          ),
      );


  const submit = async (
    event,
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        const updated =
          await updateMyAvailabilityContact({
            contactId:
              editingId,
            ...form,
          });

        setContacts(
          (rows) =>
            sortContacts(
              rows.map(
                (row) =>
                  row.id ===
                  editingId
                    ? updated
                    : row,
              ),
            ),
        );

        setMessage(
          'Le contact a bien été modifié.',
        );
      } else {
        const created =
          await createMyAvailabilityContact(
            form,
          );

        setContacts(
          (rows) =>
            sortContacts([
              ...rows,
              created,
            ]),
        );

        setPreviewContactId(
          (current) =>
            current ||
            created.id,
        );

        setMessage(
          "L'organisme a bien été ajouté à votre carnet.",
        );
      }

      setForm(
        EMPTY_FORM,
      );

      setEditingId(null);
    } catch (saveError) {
      setError(
        saveError?.message ||
          "Impossible d'enregistrer ce contact.",
      );
    } finally {
      setSaving(false);
    }
  };


  const edit = (
    contact,
  ) => {
    setEditingId(
      contact.id,
    );

    setForm({
      organizationName:
        contact.organization_name ||
        '',

      contactName:
        contact.contact_name ||
        '',

      email:
        contact.email || '',

      phone:
        contact.phone || '',
    });

    setError('');
    setMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };


  const askDelete = (
    contact,
  ) => {
    if (deletingId) {
      return;
    }

    setContactToDelete(
      contact,
    );

    setError('');
    setMessage('');
  };


  const cancelDelete =
    () => {
      if (deletingId) {
        return;
      }

      setContactToDelete(
        null,
      );
    };


  const confirmDelete =
    async () => {
      const contact =
        contactToDelete;

      if (
        !contact?.id ||
        deletingId
      ) {
        return;
      }

      setDeletingId(
        contact.id,
      );

      setError('');
      setMessage('');

      try {
        await deleteMyAvailabilityContact(
          contact.id,
        );

        setContacts(
          (rows) =>
            rows.filter(
              (row) =>
                row.id !==
                contact.id,
            ),
        );


        setSelectedContactIds(
          (current) =>
            current.filter(
              (id) =>
                id !==
                contact.id,
            ),
        );

        if (
          previewContactId ===
          contact.id
        ) {
          const replacement =
            contacts.find(
              (row) =>
                row.id !==
                contact.id,
            );

          setPreviewContactId(
            replacement?.id ||
            '',
          );
        }

        if (pdfContactId === contact.id) {
          const replacement = contacts.find((row) => row.id !== contact.id);
          setPdfContactId(replacement?.id || '');
        }

        if (
          editingId ===
          contact.id
        ) {
          resetForm();
        }

        setContactToDelete(
          null,
        );

        setMessage(
          'Le contact a bien été supprimé.',
        );
      } catch (deleteError) {
        setError(
          deleteError?.message ||
            'Impossible de supprimer ce contact.',
        );
      } finally {
        setDeletingId(
          null,
        );
      }
    };


  const toggleRecipient =
    (contactId) => {
      setSendMessage('');
      setSendError('');

      const contact = contacts.find(
        (row) => row.id === contactId,
      );

      if (contact?.last_share?.canShare === false) {
        setSendError(
          contact.last_share.nextShareAt
            ? `Un nouvel envoi à ${contact.organization_name} sera possible le ${formatShareDate(contact.last_share.nextShareAt)}.`
            : `Un nouvel envoi à ${contact.organization_name} n'est pas encore autorisé.`,
        );
        return;
      }

      setSelectedContactIds(
        (current) =>
          current.includes(contactId)
            ? current.filter(
                (id) =>
                  id !== contactId,
              )
            : [
                ...current,
                contactId,
              ],
      );
    };


  const selectedContacts =
    contacts.filter(
      (contact) =>
        selectedContactIds.includes(
          contact.id,
        ),
    );


  const openSendConfirmation =
    () => {
      setSendMessage('');
      setSendError('');

      if (
        selectedContactIds.length ===
        0
      ) {
        setSendError(
          'Sélectionnez au moins un contact destinataire.',
        );
        return;
      }

      const blockedContact = selectedContacts.find(
        (contact) => contact?.last_share?.canShare === false,
      );

      if (blockedContact) {
        setSendError(
          blockedContact.last_share?.nextShareAt
            ? `Un nouvel envoi à ${blockedContact.organization_name} sera possible le ${formatShareDate(blockedContact.last_share.nextShareAt)}.`
            : `Un nouvel envoi à ${blockedContact.organization_name} n'est pas encore autorisé.`,
        );
        return;
      }

      if (
        selectedMonths.length ===
        0
      ) {
        setSendError(
          'Sélectionnez au moins un mois à partager.',
        );
        return;
      }

      setSendConfirmOpen(
        true,
      );
    };


  const confirmSendShare =
    async () => {
      if (sendingShare) {
        return;
      }

      setSendingShare(true);
      setSendError('');
      setSendMessage('');

      let sentCount = 0;
      const failures = [];

      try {
        for (
          const contact of
          selectedContacts
        ) {
          try {
            const customMessage =
              customizeMessages
                ? String(
                    customMessagesByContact[
                      contact.id
                    ] || '',
                  ).trim()
                : '';

            await sendTrainerAvailabilityShareEmail({
              contactId:
                contact.id,
              months:
                selectedMonths
                  .slice()
                  .sort(),
              message:
                customMessage ||
                commonShareMessage.trim(),
              copyToSender,
            });

            sentCount += 1;
          } catch (
            contactError
          ) {
            failures.push(
              `${contact.organization_name} : ${
                contactError?.message ||
                "échec de l'envoi"
              }`,
            );
          }
        }

        setSendConfirmOpen(
          false,
        );

        if (
          sentCount > 0
        ) {
          setSendMessage(
            `${sentCount} e-mail${
              sentCount > 1
                ? 's'
                : ''
            } transmis au service d'envoi. Le statut de livraison sera mis à jour dès le retour de Brevo.`,
          );
        }

        if (
          failures.length > 0
        ) {
          setSendError(
            failures.join(' · '),
          );
        }

        await loadContacts();
      } finally {
        setSendingShare(false);
      }
    };


  const downloadAvailabilityPdf =
    async () => {
      if (pdfLoading) {
        return;
      }

      setPdfLoading(true);
      setPdfMessage('');
      setPdfError('');

      try {
        if (selectedMonths.length === 0) {
          throw new Error('Sélectionnez au moins un mois à intégrer au PDF.');
        }

        const orderedMonths = selectedMonths.slice().sort();
        const range = getMonthRangeFromKeys(orderedMonths);
        if (!range) {
          throw new Error('La période sélectionnée est invalide.');
        }

        if (!pdfContact) {
          throw new Error('Sélectionnez un organisme pour préparer le PDF.');
        }

        const data = await getMyAvailabilitySharePreview({
          ...range,
          organizationId: pdfContact.organization_id || null,
        });

        const canvases = orderedMonths.map((month) =>
          createAvailabilityPdfPage({
            trainerName: publicTrainerName,
            recipientName: pdfContact.organization_name || '',
            recipientOrganizationId: pdfContact.organization_id || null,
            monthKeyValue: month,
            availabilityByDay: data.availabilityByDay || {},
            commitmentsByDay: data.commitmentsByDay || {},
            skills: publicSkills,
            trainerMessage:
              customizeMessages && String(customMessagesByContact[pdfContact.id] || '').trim()
                ? String(customMessagesByContact[pdfContact.id] || '').trim()
                : commonShareMessage.trim(),
          }),
        );

        const blob = pdfBinaryFromCanvases(canvases);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `formaplane-disponibilites-${orderedMonths[0]}${orderedMonths.length > 1 ? `-a-${orderedMonths[orderedMonths.length - 1]}` : ''}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);

        setPdfMessage(
          `PDF personnalisé pour ${pdfContact.organization_name} généré. Vous pouvez l'envoyer librement depuis votre propre messagerie.`,
        );
      } catch (downloadError) {
        console.error('Erreur génération PDF :', downloadError);
        setPdfError(
          downloadError?.message ||
            'Impossible de générer le PDF de vos disponibilités.',
        );
      } finally {
        setPdfLoading(false);
      }
    };


  const togglePublicSkill =
    (skill) => {
      setSelectedPublicSkills(
        (current) => {
          if (
            current.includes(
              skill,
            )
          ) {
            return current.filter(
              (item) =>
                item !== skill,
            );
          }

          if (
            current.length >=
            4
          ) {
            setPublicShareError(
              'Vous pouvez mettre en avant jusqu’à 4 compétences sur le visuel.',
            );

            return current;
          }

          setPublicShareError(
            '',
          );

          return [
            ...current,
            skill,
          ];
        },
      );
    };


  const resetPublicPostText =
    () => {
      setPublicPostTextDirty(
        false,
      );

      setPublicPostText(
        buildPublicShareText({
          trainerName:
            publicTrainerName,
          monthKey:
            publicShareMonth,
          skills:
            selectedPublicSkills,
        }),
      );
    };


  const getPublicShareData =
    async () => {
      if (
        !publicShareMonth
      ) {
        throw new Error(
          'Sélectionnez un mois.',
        );
      }

      const range =
        getMonthRangeFromKeys([
          publicShareMonth,
        ]);

      if (!range) {
        throw new Error(
          'Le mois sélectionné est invalide.',
        );
      }

      const data =
        await getMyAvailabilitySharePreview({
          ...range,
          organizationId: null,
        });

      return {
        trainerName:
          publicTrainerName,
        availabilityByDay:
          data.availabilityByDay || {},
        commitmentsByDay:
          data.commitmentsByDay || {},
      };
    };


  const downloadPublicShareVisual =
    async () => {
      setPublicShareLoading(
        true,
      );
      setPublicShareMessage(
        '',
      );
      setPublicShareError(
        '',
      );

      try {
        const data =
          await getPublicShareData();

        const canvas =
          await createPublicAvailabilityImage({
            trainerName:
              data.trainerName ||
              '',
            monthKey:
              publicShareMonth,
            declaredByDay:
              data.availabilityByDay ||
              {},
            commitmentsByDay:
              data.commitmentsByDay ||
              {},
            skills:
              selectedPublicSkills,
          });

        const link =
          document.createElement(
            'a',
          );

        link.download =
          `formaplane-disponibilites-${publicShareMonth}.png`;

        link.href =
          canvas.toDataURL(
            'image/png',
          );

        link.click();

        setPublicShareMessage(
          'Le visuel est prêt.',
        );
      } catch (
        shareError
      ) {
        console.error(
          'Erreur génération visuel public :',
          shareError,
        );

        setPublicShareError(
          shareError?.message ||
            'Impossible de générer le visuel.',
        );
      } finally {
        setPublicShareLoading(
          false,
        );
      }
    };


  const copyPublicShareText =
    async () => {
      setPublicShareMessage(
        '',
      );
      setPublicShareError(
        '',
      );

      try {
        await getPublicShareData();

        await navigator.clipboard.writeText(
          publicPostText,
        );

        setPublicShareMessage(
          'Texte de publication copié.',
        );
      } catch (
        shareError
      ) {
        setPublicShareError(
          shareError?.message ||
            'Impossible de copier le texte.',
        );
      }
    };


  const nativePublicShare =
    async () => {
      setPublicShareLoading(
        true,
      );
      setPublicShareMessage(
        '',
      );
      setPublicShareError(
        '',
      );

      try {
        const data =
          await getPublicShareData();

        const canvas =
          await createPublicAvailabilityImage({
            trainerName:
              data.trainerName ||
              '',
            monthKey:
              publicShareMonth,
            declaredByDay:
              data.availabilityByDay ||
              {},
            commitmentsByDay:
              data.commitmentsByDay ||
              {},
            skills:
              selectedPublicSkills,
          });

        const blob =
          await new Promise(
            (resolve) =>
              canvas.toBlob(
                resolve,
                'image/png',
              ),
          );

        const file =
          new File(
            [
              blob,
            ],
            `formaplane-disponibilites-${publicShareMonth}.png`,
            {
              type:
                'image/png',
            },
          );

        const text =
          publicPostText;

        if (
          navigator.share &&
          (
            !navigator.canShare ||
            navigator.canShare({
              files: [
                file,
              ],
            })
          )
        ) {
          await navigator.share({
            title:
              'Mes disponibilités Formaplane',
            text,
            files: [
              file,
            ],
          });

          setPublicShareMessage(
            'Partage ouvert.',
          );
          return;
        }

        await navigator.clipboard.writeText(
          text,
        );

        setPublicShareMessage(
          "Le partage direct n'est pas disponible sur cet appareil. Le texte a été copié ; téléchargez aussi le visuel.",
        );
      } catch (
        shareError
      ) {
        if (
          shareError?.name ===
          'AbortError'
        ) {
          return;
        }

        setPublicShareError(
          shareError?.message ||
            'Impossible de préparer le partage.',
        );
      } finally {
        setPublicShareLoading(
          false,
        );
      }
    };


  const toggleMonth =
    (key) => {
      setPreviewError('');

      setSelectedMonths(
        (current) => {
          if (
            current.includes(
              key,
            )
          ) {
            if (
              current.length ===
              1
            ) {
              return current;
            }

            return current.filter(
              (item) =>
                item !== key,
            );
          }

          return [
            ...current,
            key,
          ].sort();
        },
      );
    };


  const unknownDaysCount =
    useMemo(() => {
      if (!previewData) {
        return 0;
      }

      let count = 0;

      for (
        const selectedMonth of
        selectedMonths
      ) {
        const matrix =
          getMonthMatrix(
            selectedMonth,
          );

        const currentMonth =
          monthDateFromKey(
            selectedMonth,
          ).getMonth();

        for (
          const week of matrix
        ) {
          for (
            const date of week
          ) {
            if (
              date.getMonth() !==
              currentMonth
            ) {
              continue;
            }

            const state =
              getSharedDayState({
                day:
                  toISODate(
                    date,
                  ),

                ...previewData,
              });

            if (
              state.key ===
              'unknown'
            ) {
              count += 1;
            }
          }
        }
      }

      return count;
    }, [
      previewData,
      selectedMonths,
    ]);


  const continueToShare = () => {
    setShareIntroOpen(false);
  };

  const inviteOrganization = () => {
    setShareIntroOpen(false);
    navigate('/formateur/mes-of?ajouter=1');
  };


  return (
    <div className="page-container trainer-share-page">
      {shareIntroOpen ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              continueToShare();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            background: 'rgba(15, 23, 42, 0.58)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trainer-share-intro-title"
            style={{
              width: 'min(100%, 560px)',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 18,
              boxShadow: '0 24px 70px rgba(15, 23, 42, 0.30)',
              padding: '22px',
            }}
          >
            <p
              className="page-eyebrow"
              style={{ marginTop: 0 }}
            >
              VOS DISPONIBILITÉS SUR FORMAPLANE
            </p>

            <h2
              id="trainer-share-intro-title"
              style={{
                margin: '6px 0 10px',
                fontSize: 'clamp(20px, 5vw, 26px)',
                lineHeight: 1.2,
              }}
            >
              Le plus simple ? Invitez vos OF sur Formaplane !
            </h2>

            <p
              style={{
                margin: 0,
                color: '#475569',
                lineHeight: 1.6,
                fontSize: 14,
              }}
            >
              Lorsqu’un organisme partenaire utilise Formaplane, il peut consulter directement vos disponibilités à jour.
            </p>

            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                borderRadius: 12,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e3a8a',
                fontWeight: 700,
                lineHeight: 1.5,
                fontSize: 13,
              }}
            >
              Vous n’avez plus besoin de lui renvoyer votre planning à chaque modification : vos OF consultent vos disponibilités quand ils en ont besoin.
            </div>

            <div
              style={{
                display: 'grid',
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                className="button"
                onClick={inviteOrganization}
                style={{
                  minHeight: 46,
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                Inviter un organisme
              </button>

              <button
                type="button"
                className="button button--soft"
                onClick={continueToShare}
                style={{
                  minHeight: 44,
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                Continuer vers le partage
              </button>
            </div>

            <p
              style={{
                margin: '14px 0 0',
                textAlign: 'center',
                color: '#64748b',
                fontSize: 11,
                lineHeight: 1.45,
              }}
            >
              L’e-mail et le PDF restent disponibles si votre organisme ne souhaite pas encore utiliser Formaplane.
            </p>
          </div>
        </div>
      ) : null}

      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            PARTAGE DES DISPONIBILITÉS
          </p>

          <h1>
            Partager mes disponibilités
          </h1>

          <p>
            Votre liste d’OF est synchronisée avec « Mes OF ». Choisissez ici les destinataires et les mois à partager.
          </p>
        </div>
      </div>


      <div className="panel-card">
        <h2>
          Mes OF utilisés pour le partage
        </h2>

        <p>
          Cette liste provient de « Mes OF ». Gérez vos organismes depuis la page dédiée ; la liste ci-dessous se met à jour automatiquement.
        </p>

        <button
          type="button"
          className="button button--soft"
          onClick={() => navigate('/formateur/mes-of')}
          style={{ marginTop: 10 }}
        >
          Gérer Mes OF
        </button>

        {contactManagementEnabledHere ? (
        <form
          ref={contactFormRef}
          onSubmit={
            submit
          }
          style={{
            marginTop: 14,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            <label
              style={{
                display: 'grid',
                gap: 5,
                fontWeight: 700,
              }}
            >
              Organisme de formation
              <input
                ref={organizationNameInputRef}
                name="organizationName"
                value={
                  form.organizationName
                }
                onChange={
                  change
                }
                placeholder="Ex. Alter Prévention"
                required
              />
            </label>

            <label
              style={{
                display: 'grid',
                gap: 5,
                fontWeight: 700,
              }}
            >
              Nom du contact
              <input
                name="contactName"
                value={
                  form.contactName
                }
                onChange={
                  change
                }
                placeholder="Ex. Sophie Martin"
              />
            </label>

            <label
              style={{
                display: 'grid',
                gap: 5,
                fontWeight: 700,
              }}
            >
              Adresse e-mail
              <input
                type="email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  change
                }
                placeholder="contact@organisme.fr"
                required
              />
            </label>

            <label
              style={{
                display: 'grid',
                gap: 5,
                fontWeight: 700,
              }}
            >
              Téléphone
              <input
                type="tel"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  change
                }
                placeholder="Optionnel"
              />
            </label>
          </div>


          {error ? (
            <div
              style={{
                marginTop: 14,
                color: '#b42318',
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}


          {message ? (
            <div
              style={{
                marginTop: 14,
                color: '#15803d',
                fontWeight: 700,
              }}
            >
              {message}
            </div>
          ) : null}


          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 12,
            }}
          >
            <button
              className="button"
              type="submit"
              disabled={
                saving
              }
            >
              {saving
                ? 'Enregistrement…'
                : editingId
                  ? 'Enregistrer les modifications'
                  : "Ajouter l'organisme"}
            </button>

            {editingId ? (
              <button
                className="button button--soft"
                type="button"
                onClick={
                  resetForm
                }
              >
                Annuler
              </button>
            ) : null}
          </div>
        </form>
        ) : null}
      </div>


      <div
        className="panel-card"
        style={{
          marginTop: 14,
        }}
      >
        <h2
          style={{
            marginBottom: 4,
          }}
        >
          Mes OF disponibles pour le partage
        </h2>

        <p
          style={{
            margin: 0,
          }}
        >
          {contacts.length}{' '}
          contact
          {contacts.length >
          1
            ? 's'
            : ''}
        </p>


        {contacts.length > 0 ? (
          <div
            style={{
              marginTop: 8,
            }}
          >
            <button
              type="button"
              className="button button--soft"
              onClick={
                loadContacts
              }
              style={{
                padding: '6px 10px',
                fontSize: 11,
              }}
            >
              Actualiser les statuts de livraison
            </button>
          </div>
        ) : null}


        {loading ? (
          <p
            style={{
              marginTop: 12,
            }}
          >
            Chargement du carnet…
          </p>
        ) : null}


        {!loading &&
        contacts.length ===
          0 ? (
          <div
            style={{
              marginTop: 12,
              padding: 18,
              border:
                '1px dashed #cbd5e1',
              borderRadius: 12,
              background:
                '#f8fafc',
              color: '#64748b',
            }}
          >
            Votre liste est vide. Ajoutez votre premier organisme depuis « Mes OF ».
          </div>
        ) : null}


        {!loading &&
        contacts.length >
          0 ? (
          <div
            style={{
              display: 'grid',
              gap: 8,
              marginTop: 8,
            }}
          >
            {contacts.map(
              (contact) => (
                <div
                  key={
                    contact.id
                  }
                  className="trainer-share-contact-card"
                  style={{
                    border:
                      '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '7px 9px',
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'flex-start',
                    gap: 7,
                    flexWrap:
                      'wrap',
                    background: '#fff',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 5,
                        flexWrap:
                          'wrap',
                      }}
                    >
                      <strong>
                        {
                          contact.organization_name
                        }
                      </strong>

                      <StatusBadge
                        tone={
                          contact.organization_id
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {contact.organization_id
                          ? 'Inscrit sur Formaplane'
                          : 'Non inscrit'}
                      </StatusBadge>

                      {contact.organization_id ? (
                        <StatusBadge
                          tone={
                            contact.is_referenced
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {contact.is_referenced
                            ? 'Vous êtes dans son réseau'
                            : 'Pas encore dans son réseau'}
                        </StatusBadge>
                      ) : null}
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        color: '#64748b',
                        fontSize: 11,
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      {contact.contact_name ? (
                        <span style={{ color: '#475569', fontWeight: 700 }}>
                          {contact.contact_name}
                        </span>
                      ) : null}
                      <span>{contact.email}</span>
                      {contact.phone ? <span>· {contact.phone}</span> : null}
                    </div>


                    {contact.last_share?.sentAt ? (() => {
                      const delivery =
                        getDeliveryStatusPresentation(
                          contact.last_share,
                        );

                      return (
                        <div
                          style={{
                            marginTop: 5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            flexWrap: 'wrap',
                            fontSize: 11,
                            color: '#64748b',
                          }}
                        >
                          <span>
                            Dernier partage :{' '}
                            <strong>
                              {formatShareDate(
                                contact.last_share.sentAt,
                              )}
                            </strong>
                            {contact.last_share.months?.length
                              ? ` · ${formatSharedMonths(
                                  contact.last_share.months,
                                )}`
                              : ''}
                          </span>

                          {delivery ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                padding: '3px 7px',
                                borderRadius: 999,
                                fontWeight: 800,
                                color: delivery.color,
                                background: delivery.background,
                              }}
                            >
                              {delivery.label}
                            </span>
                          ) : null}
                        </div>
                      );
                    })() : null}

                    {contact.last_share?.canShare === false ? (
                      <>
                        <div
                          className="trainer-share-blocked-message trainer-share-blocked-message--desktop"
                          style={{
                            marginTop: 5,
                            padding: '5px 7px',
                            borderRadius: 7,
                            background: '#fff7ed',
                            border: '1px solid #fed7aa',
                            color: '#9a3412',
                            fontSize: 11,
                            fontWeight: 700,
                            lineHeight: 1.45,
                          }}
                        >
                          Nouvel envoi via Formaplane possible le{' '}
                          {formatShareDate(contact.last_share.nextShareAt)}.{' '}
                          PDF disponible à tout moment. Vous pouvez aussi suggérer à cet OF de se connecter à Formaplane pour consulter vos disponibilités en temps réel et en permanence.
                        </div>

                        <details className="trainer-share-blocked-message trainer-share-blocked-message--mobile">
                          <summary>
                            Nouvel envoi possible le {formatShareDate(contact.last_share.nextShareAt)} · Voir pourquoi
                          </summary>
                          <p>
                            Le PDF reste disponible à tout moment. Si vous souhaitez prévenir cet organisme avant cette date, contactez-le directement : vos disponibilités sont mises à jour et consultables en permanence sur Formaplane.
                          </p>
                        </details>
                      </>
                    ) : null}
                  </div>

                  {contactManagementEnabledHere ? (
                  <div
                    className="trainer-share-contact-actions"
                    style={{
                      display: 'flex',
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      className="button button--soft"
                      type="button"
                      style={{ padding: '5px 8px', fontSize: 10 }}
                      onClick={() =>
                        edit(
                          contact,
                        )
                      }
                    >
                      Modifier
                    </button>

                    <button
                      className="button button--soft"
                      type="button"
                      disabled={
                        deletingId ===
                        contact.id
                      }
                      onClick={() =>
                        askDelete(
                          contact,
                        )
                      }
                      style={{
                        color: '#b42318',
                        padding: '5px 8px',
                        fontSize: 10,
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                  ) : null}
                </div>
              ),
            )}
          </div>
        ) : null}
      </div>


      <div
        className="panel-card"
        style={{
          marginTop: 14,
        }}
      >
        <p className="page-eyebrow">
          PRÉPARER LE PARTAGE
        </p>

        <h2>
          Choisir les mois et prévisualiser
        </h2>

        <p>
          L'aperçu est personnalisé pour l'organisme sélectionné. Une mission ou une option avec cet organisme est donc identifiée sans révéler l'activité avec vos autres partenaires.
        </p>


        {contacts.length ===
        0 ? (
          <div
            style={{
              marginTop: 12,
              padding: 18,
              border:
                '1px dashed #cbd5e1',
              borderRadius: 12,
              background:
                '#f8fafc',
              color: '#64748b',
            }}
          >
            Ajoutez au moins un organisme à votre carnet pour préparer un partage.
          </div>
        ) : (
          <>
            <div
              style={{
                marginTop: 14,
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                Destinataires
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 7,
                }}
              >
                {contacts.map(
                  (contact) => {
                    const selected =
                      selectedContactIds.includes(
                        contact.id,
                      );
                    const blocked =
                      contact?.last_share?.canShare === false;

                    return (
                      <label
                        key={
                          contact.id
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 9px',
                          borderRadius: 9,
                          border: selected
                            ? '1px solid #93c5fd'
                            : '1px solid #e2e8f0',
                          background: selected
                            ? '#eff6ff'
                            : '#ffffff',
                          cursor: blocked ? 'not-allowed' : 'pointer',
                          fontSize: 11,
                          fontWeight: 700,
                          color: blocked ? '#94a3b8' : '#334155',
                          opacity: blocked ? 0.8 : 1,
                        }}
                        title={
                          blocked && contact.last_share?.nextShareAt
                            ? `Nouvel envoi possible le ${formatShareDate(contact.last_share.nextShareAt)}`
                            : undefined
                        }
                      >
                        <input
                          type="checkbox"
                          checked={
                            selected
                          }
                          disabled={blocked}
                          onChange={() =>
                            toggleRecipient(
                              contact.id,
                            )
                          }
                        />

                        {
                          contact.organization_name
                        }
                        {blocked ? (
                          <span style={{ fontWeight: 600 }}>
                            · jusqu'au {formatShareDate(contact.last_share?.nextShareAt)}
                          </span>
                        ) : null}
                      </label>
                    );
                  },
                )}
              </div>

              <p
                style={{
                  margin: '6px 0 0',
                  color: '#64748b',
                  fontSize: 11,
                }}
              >
                Chaque organisme recevra un e-mail individuel avec un planning personnalisé.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(240px, 1fr) minmax(300px, 2fr)',
                gap: 14,
                marginTop: 14,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'grid',
                    gap: 7,
                    fontWeight: 700,
                  }}
                >
                  Aperçu pour
                  <select
                    value={
                      previewContactId
                    }
                    onChange={(
                      event,
                    ) =>
                      setPreviewContactId(
                        event.target.value,
                      )
                    }
                  >
                    {contacts.map(
                      (contact) => (
                        <option
                          key={
                            contact.id
                          }
                          value={
                            contact.id
                          }
                        >
                          {
                            contact.organization_name
                          }
                          {contact.contact_name
                            ? ` — ${contact.contact_name}`
                            : ''}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>


              <div>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 5,
                  }}
                >
                  Mois à partager
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 5,
                  }}
                >
                  {monthChoices.map(
                    (choice) => {
                      const selected =
                        selectedMonths.includes(
                          choice.key,
                        );

                      return (
                        <button
                          key={
                            choice.key
                          }
                          className={
                            selected
                              ? 'button'
                              : 'button button--soft'
                          }
                          type="button"
                          onClick={() =>
                            toggleMonth(
                              choice.key,
                            )
                          }
                          style={{
                            textTransform:
                              'capitalize',
                          }}
                        >
                          {
                            choice.label
                          }
                        </button>
                      );
                    },
                  )}
                </div>

                <p
                  style={{
                    margin:
                      '6px 0 0',
                    fontSize: 12,
                    color:
                      '#64748b',
                  }}
                >
                  Vous pouvez sélectionner plusieurs mois. Au moins un mois doit rester sélectionné.
                </p>
              </div>
            </div>


            <div
              style={{
                marginTop: 14,
                padding:
                  '10px 12px',
                borderRadius: 12,
                background:
                  '#f8fafc',
                border:
                  '1px solid #e2e8f0',
                fontSize: 13,
                lineHeight: 1.55,
                color: '#475569',
              }}
            >
              <strong>
                Confidentialité :
              </strong>{' '}
              les missions effectuées pour un autre organisme apparaissent uniquement comme « Indisponible ». Les options des autres organismes ne sont jamais identifiées nominativement.
            </div>


            {previewError ? (
              <div
                style={{
                  marginTop: 16,
                  color: '#b42318',
                  fontWeight: 700,
                }}
              >
                {
                  previewError
                }
              </div>
            ) : null}


            {previewLoading ? (
              <p
                style={{
                  marginTop: 12,
                }}
              >
                Préparation de l'aperçu…
              </p>
            ) : null}


            {!previewLoading &&
            previewData ? (
              <>
                {unknownDaysCount >
                0 ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding:
                        '10px 12px',
                      borderRadius: 10,
                      border:
                        '1px solid #fde68a',
                      background:
                        '#fffbeb',
                      color:
                        '#854d0e',
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    ⚠️{' '}
                    <strong>
                      {unknownDaysCount}{' '}
                      jour
                      {unknownDaysCount >
                      1
                        ? 's'
                        : ''}{' '}
                      non renseigné
                      {unknownDaysCount >
                      1
                        ? 's'
                        : ''}
                    </strong>{' '}
                    sur la période sélectionnée. Ils restent visibles dans cet aperçu afin d'éviter de présenter une disponibilité qui n'a pas été déclarée.
                  </div>
                ) : null}


                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginTop: 12,
                    padding:
                      '12px 0',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      color:
                        '#15803d',
                    }}
                  >
                    ● Disponible
                  </span>

                  <span
                    style={{
                      color:
                        '#a16207',
                    }}
                  >
                    ● Option avec votre organisme
                  </span>

                  <span
                    style={{
                      color:
                        '#1d4ed8',
                    }}
                  >
                    ● Mission avec votre organisme
                  </span>

                  <span
                    style={{
                      color:
                        '#b42318',
                    }}
                  >
                    ● Indisponible
                  </span>

                  <span
                    style={{
                      color:
                        '#64748b',
                    }}
                  >
                    ● Non renseigné
                  </span>
                </div>


                <div
                  style={{
                    display: 'grid',
                    gap: 18,
                    marginTop: 6,
                  }}
                >
                  {selectedMonths
                    .slice()
                    .sort()
                    .map(
                      (
                        selectedMonth,
                      ) => {
                        const monthDate =
                          monthDateFromKey(
                            selectedMonth,
                          );

                        const currentMonth =
                          monthDate.getMonth();

                        const matrix =
                          getMonthMatrix(
                            selectedMonth,
                          );

                        return (
                          <section
                            key={
                              selectedMonth
                            }
                            style={{
                              border:
                                '1px solid #e2e8f0',
                              borderRadius:
                                14,
                              padding: 12,
                              background:
                                '#ffffff',
                            }}
                          >
                            <h3
                              style={{
                                margin:
                                  '0 0 10px',
                                textTransform:
                                  'capitalize',
                              }}
                            >
                              {monthLabelFromKey(
                                selectedMonth,
                              )}
                            </h3>

                            <div
                              style={{
                                display:
                                  'grid',
                                gridTemplateColumns:
                                  'repeat(7, minmax(0, 1fr))',
                                gap: 5,
                              }}
                            >
                              {[
                                'Lun',
                                'Mar',
                                'Mer',
                                'Jeu',
                                'Ven',
                                'Sam',
                                'Dim',
                              ].map(
                                (
                                  label,
                                ) => (
                                  <div
                                    key={
                                      label
                                    }
                                    style={{
                                      textAlign:
                                        'center',
                                      color:
                                        '#64748b',
                                      fontWeight:
                                        800,
                                      fontSize:
                                        11,
                                      padding:
                                        '2px 0',
                                    }}
                                  >
                                    {
                                      label
                                    }
                                  </div>
                                ),
                              )}


                              {matrix.flat().map(
                                (
                                  date,
                                  index,
                                ) => {
                                  const iso =
                                    toISODate(
                                      date,
                                    );

                                  const state =
                                    getSharedDayState({
                                      day:
                                        iso,
                                      ...previewData,
                                    });

                                  return (
                                    <SharedDay
                                      key={`${iso}-${index}`}
                                      date={
                                        date
                                      }
                                      currentMonth={
                                        currentMonth
                                      }
                                      state={
                                        state
                                      }
                                    />
                                  );
                                },
                              )}
                            </div>
                          </section>
                        );
                      },
                    )}
                </div>


                <div
                  style={{
                    marginTop: 12,
                    padding:
                      '14px 16px',
                    borderRadius: 12,
                    border:
                      '1px solid #dbeafe',
                    background:
                      '#f8fbff',
                    color:
                      '#475569',
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  <strong>
                    Aperçu personnalisé pour{' '}
                    {
                      previewContact?.organization_name
                    }.
                  </strong>{' '}
                  Lors de l'envoi à plusieurs organismes, Formaplane générera automatiquement la version adaptée à chaque destinataire.
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      marginBottom: 5,
                    }}
                  >
                    Ajouter un commentaire au partage
                    <span
                      style={{
                        marginLeft: 5,
                        color: '#94a3b8',
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    >
                      (facultatif)
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: 11,
                      lineHeight: 1.45,
                      color: '#64748b',
                    }}
                  >
                    Ce message sera ajouté dans le corps de l'e-mail et dans le PDF personnalisé.
                  </p>

                  <textarea
                    value={
                      commonShareMessage
                    }
                    onChange={(
                      event,
                    ) =>
                      setCommonShareMessage(
                        event.target.value,
                      )
                    }
                    maxLength={1500}
                    rows={3}
                    placeholder="Ex. Je suis particulièrement disponible sur la deuxième quinzaine du mois. N'hésitez pas à me contacter."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginTop: 5,
                      fontSize: 10,
                      color: '#94a3b8',
                    }}
                  >
                    <span>
                      Message commun à tous les destinataires
                    </span>
                    <span>
                      {commonShareMessage.length}/1500
                    </span>
                  </div>

                  {selectedContactIds.length > 0 ? (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        marginTop: 10,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          customizeMessages
                        }
                        onChange={(
                          event,
                        ) =>
                          setCustomizeMessages(
                            event.target.checked,
                          )
                        }
                      />
                      Personnaliser le message pour certains destinataires
                    </label>
                  ) : null}

                  {customizeMessages &&
                  selectedContacts.length >
                    0 ? (
                    <div
                      style={{
                        display: 'grid',
                        gap: 9,
                        marginTop: 10,
                      }}
                    >
                      {selectedContacts.map(
                        (contact) => (
                          <div
                            key={
                              contact.id
                            }
                            style={{
                              padding: 10,
                              border:
                                '1px solid #e2e8f0',
                              borderRadius: 9,
                              background:
                                '#f8fafc',
                            }}
                          >
                            <label
                              style={{
                                display:
                                  'grid',
                                gap: 5,
                                fontSize:
                                  11,
                                fontWeight:
                                  800,
                                color:
                                  '#334155',
                              }}
                            >
                              {
                                contact.organization_name
                              }
                              <textarea
                                value={
                                  customMessagesByContact[
                                    contact.id
                                  ] || ''
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setCustomMessagesByContact(
                                    (
                                      current,
                                    ) => ({
                                      ...current,
                                      [
                                        contact.id
                                      ]:
                                        event
                                          .target
                                          .value,
                                    }),
                                  )
                                }
                                maxLength={
                                  1500
                                }
                                rows={2}
                                placeholder={
                                  commonShareMessage
                                    ? 'Laissez vide pour utiliser le message commun.'
                                    : 'Message spécifique à cet organisme.'
                                }
                                style={{
                                  width:
                                    '100%',
                                  boxSizing:
                                    'border-box',
                                  resize:
                                    'vertical',
                                  background:
                                    '#ffffff',
                                }}
                              />
                            </label>

                            <div
                              style={{
                                marginTop:
                                  4,
                                textAlign:
                                  'right',
                                fontSize:
                                  9,
                                color:
                                  '#94a3b8',
                              }}
                            >
                              {String(
                                customMessagesByContact[
                                  contact.id
                                ] || '',
                              ).length}
                              /1500
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>


                <div
                  style={{
                    marginTop: 12,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1px solid #dbeafe',
                      background: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <strong>1. Envoyer par e-mail avec Formaplane</strong>
                        <div style={{ marginTop: 3, fontSize: 11, color: '#64748b' }}>
                          {selectedContactIds.length} destinataire{selectedContactIds.length > 1 ? 's' : ''} · {selectedMonths.length} mois sélectionné{selectedMonths.length > 1 ? 's' : ''}
                        </div>
                      </div>

                      <button
                        className="button"
                        type="button"
                        onClick={openSendConfirmation}
                        disabled={sendingShare || selectedContactIds.length === 0}
                      >
                        Envoyer via Formaplane
                      </button>
                    </div>

                    {sendMessage ? (
                      <div style={{ marginTop: 9, color: '#15803d', fontSize: 11, fontWeight: 700 }}>
                        {sendMessage}
                      </div>
                    ) : null}

                    {sendError ? (
                      <div style={{ marginTop: 9, color: '#b42318', fontSize: 11, fontWeight: 700 }}>
                        {sendError}
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>2. Télécharger un PDF personnalisé</div>
                    <p style={{ margin: '4px 0 10px', fontSize: 11, color: '#64748b', lineHeight: 1.45 }}>
                      Le PDF reste disponible à tout moment, même pendant le délai de 20 jours. Vous pouvez ensuite l'envoyer vous-même depuis votre propre messagerie.
                    </p>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#475569' }}>
                        PDF pour
                        <select
                          value={pdfContactId}
                          onChange={(event) => setPdfContactId(event.target.value)}
                          style={{ minWidth: 180 }}
                        >
                          {contacts.map((contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.organization_name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        className="button button--soft"
                        type="button"
                        onClick={downloadAvailabilityPdf}
                        disabled={pdfLoading || selectedMonths.length === 0 || !pdfContactId}
                      >
                        {pdfLoading ? 'Génération du PDF…' : 'Télécharger le PDF'}
                      </button>
                    </div>

                    {pdfMessage ? (
                      <div style={{ marginTop: 9, color: '#15803d', fontSize: 11, fontWeight: 700 }}>
                        {pdfMessage}
                      </div>
                    ) : null}

                    {pdfError ? (
                      <div style={{ marginTop: 9, color: '#b42318', fontSize: 11, fontWeight: 700 }}>
                        {pdfError}
                      </div>
                    ) : null}
                  </div>
                </div>

              </>
            ) : null}
          </>
        )}
      </div>


      <section
        className="card"
        style={{
          marginTop: 14,
        }}
      >
        <p
          className="page-eyebrow"
          style={{
            marginTop: 0,
          }}
        >
          PARTAGE PUBLIC
        </p>

        <h2
          style={{
            marginBottom: 6,
          }}
        >
          3. Partager sur les réseaux sociaux
        </h2>

        <p
          style={{
            margin:
              '0 0 12px',
            color:
              '#64748b',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          Créez un visuel professionnel de vos disponibilités à publier sur LinkedIn, Facebook, Instagram, TikTok ou ailleurs. Aucune information sur les organismes ou les options en cours n'est affichée publiquement.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(180px, 260px) 1fr',
            gap: 14,
            alignItems: 'end',
          }}
        >
          <label
            style={{
              display: 'grid',
              gap: 5,
              fontSize: 11,
              fontWeight: 800,
              color: '#334155',
            }}
          >
            Mois à partager
            <input
              type="month"
              value={
                publicShareMonth
              }
              onChange={(
                event,
              ) =>
                setPublicShareMonth(
                  event.target.value,
                )
              }
            />
          </label>

          <div
            style={{
              padding:
                '10px 12px',
              borderRadius: 10,
              background:
                '#f8fbff',
              border:
                '1px solid #dbeafe',
              color:
                '#475569',
              fontSize: 11,
              lineHeight: 1.45,
            }}
          >
            <strong>
              Mes disponibilités évoluent. Mon planning aussi.
            </strong>{' '}
            Je les partage simplement avec Formaplane.
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              marginBottom: 5,
              fontSize: 11,
              color: '#334155',
            }}
          >
            Compétences à mettre en avant
          </div>

          {publicSkills.length > 0 ? (
            <>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 7,
                }}
              >
                {publicSkills.map(
                  (skill) => {
                    const selected =
                      selectedPublicSkills.includes(
                        skill,
                      );

                    return (
                      <label
                        key={
                          skill
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 8px',
                          borderRadius: 9,
                          border: selected
                            ? '1px solid #93c5fd'
                            : '1px solid #e2e8f0',
                          background: selected
                            ? '#eff6ff'
                            : '#ffffff',
                          cursor: 'pointer',
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: '#334155',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            selected
                          }
                          onChange={() =>
                            togglePublicSkill(
                              skill,
                            )
                          }
                        />
                        {
                          skill
                        }
                      </label>
                    );
                  },
                )}
              </div>

              <div
                style={{
                  marginTop: 5,
                  fontSize: 9.5,
                  color: '#94a3b8',
                }}
              >
                Jusqu'à 4 compétences peuvent apparaître sur le visuel. Votre sélection concerne uniquement cette publication.
              </div>
            </>
          ) : (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 9,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: 10.5,
                color: '#64748b',
              }}
            >
              Aucune compétence n'est renseignée sur votre profil Formaplane.
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 5,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 11,
                color: '#334155',
              }}
            >
              Texte de la publication
            </div>

            <button
              type="button"
              className="button button--soft"
              onClick={
                resetPublicPostText
              }
              style={{
                padding: '5px 8px',
                fontSize: 9.5,
              }}
            >
              Réinitialiser le texte proposé
            </button>
          </div>

          <textarea
            value={
              publicPostText
            }
            onChange={(
              event,
            ) => {
              setPublicPostText(
                event.target.value,
              );
              setPublicPostTextDirty(
                true,
              );
              setPublicShareMessage(
                '',
              );
              setPublicShareError(
                '',
              );
            }}
            rows={7}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontSize: 11,
              lineHeight: 1.5,
            }}
          />

          <div
            style={{
              marginTop: 4,
              fontSize: 9.5,
              color: '#94a3b8',
            }}
          >
            Formaplane propose un texte de départ, mais vous pouvez le modifier librement avant de le copier ou de le partager.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 12,
          }}
        >
          <button
            type="button"
            className="button"
            onClick={
              downloadPublicShareVisual
            }
            disabled={
              publicShareLoading
            }
          >
            {publicShareLoading
              ? 'Préparation…'
              : 'Télécharger le visuel'}
          </button>

          <button
            type="button"
            className="button button--soft"
            onClick={
              copyPublicShareText
            }
            disabled={
              publicShareLoading
            }
          >
            Copier le texte de publication
          </button>

          {'share' in navigator ? (
            <button
              type="button"
              className="button button--soft"
              onClick={
                nativePublicShare
              }
              disabled={
                publicShareLoading
              }
            >
              Partager
            </button>
          ) : null}
        </div>

        <p
          style={{
            margin:
              '10px 0 0',
            color:
              '#94a3b8',
            fontSize: 10,
            lineHeight: 1.45,
          }}
        >
          Les missions confirmées apparaissent comme indisponibles. Les options posées par des organismes restent privées et ne sont jamais mentionnées sur le visuel public.
        </p>

        {publicShareMessage ? (
          <div
            style={{
              marginTop: 8,
              color:
                '#15803d',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {
              publicShareMessage
            }
          </div>
        ) : null}

        {publicShareError ? (
          <div
            style={{
              marginTop: 8,
              color:
                '#b42318',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {
              publicShareError
            }
          </div>
        ) : null}
      </section>


      {sendConfirmOpen ? (
        <div
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
                event.currentTarget &&
              !sendingShare
            ) {
              setSendConfirmOpen(
                false,
              );
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
            background:
              'rgba(15, 23, 42, 0.55)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="send-share-title"
            style={{
              width:
                'min(100%, 500px)',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow:
                '0 24px 70px rgba(15, 23, 42, 0.28)',
              padding: 22,
            }}
          >
            <p
              className="page-eyebrow"
              style={{
                marginTop: 0,
              }}
            >
              PARTAGE DES DISPONIBILITÉS
            </p>

            <h2
              id="send-share-title"
              style={{
                marginTop: 6,
              }}
            >
              Envoyer vos disponibilités ?
            </h2>

            <p
              style={{
                color: '#475569',
                lineHeight: 1.55,
                fontSize: 13,
              }}
            >
              Formaplane va envoyer un e-mail individuel à{' '}
              <strong>
                {selectedContacts.length}{' '}
                contact
                {selectedContacts.length > 1
                  ? 's'
                  : ''}
              </strong>
              . Chaque organisme recevra uniquement la version du planning qui lui est destinée.
            </p>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: 11,
                lineHeight: 1.55,
                color: '#64748b',
              }}
            >
              <div>
                <strong>
                  Destinataires :
                </strong>{' '}
                {selectedContacts
                  .map(
                    (contact) =>
                      contact.organization_name,
                  )
                  .join(', ')}
              </div>

              <div
                style={{
                  marginTop: 4,
                }}
              >
                <strong>
                  Mois :
                </strong>{' '}
                {formatSharedMonths(
                  selectedMonths
                    .slice()
                    .sort(),
                )}
              </div>

              {commonShareMessage.trim() ||
              (
                customizeMessages &&
                selectedContacts.some(
                  (contact) =>
                    String(
                      customMessagesByContact[
                        contact.id
                      ] || '',
                    ).trim(),
                )
              ) ? (
                <div
                  style={{
                    marginTop: 4,
                  }}
                >
                  <strong>
                    Message :
                  </strong>{' '}
                  ajouté au partage
                  {customizeMessages
                    ? ' (personnalisé selon le destinataire si renseigné)'
                    : ''}
                </div>
              ) : null}
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 9,
                marginTop: 16,
                padding: '11px 12px',
                borderRadius: 10,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e3a8a',
                fontSize: 12,
                lineHeight: 1.45,
                cursor: sendingShare ? 'default' : 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={copyToSender}
                disabled={sendingShare}
                onChange={(event) => setCopyToSender(event.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                <strong>Recevoir une copie de cet e-mail</strong>
                <br />
                La copie sera envoyée à l'adresse e-mail de votre compte Formaplane. Elle fait partie du même partage et ne crée pas un second délai de 20 jours.
              </span>
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 9,
                flexWrap: 'wrap',
                marginTop: 18,
              }}
            >
              <button
                className="button button--soft"
                type="button"
                onClick={() =>
                  setSendConfirmOpen(
                    false,
                  )
                }
                disabled={
                  sendingShare
                }
              >
                Annuler
              </button>

              <button
                className="button"
                type="button"
                onClick={
                  confirmSendShare
                }
                disabled={
                  sendingShare
                }
              >
                {sendingShare
                  ? 'Envoi…'
                  : 'Confirmer l’envoi'}
              </button>
            </div>
          </div>
        </div>
      ) : null}


      {contactToDelete ? (
        <div
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cancelDelete();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems:
              'center',
            padding: 20,
            background:
              'rgba(15, 23, 42, 0.55)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-contact-title"
            style={{
              width:
                'min(100%, 480px)',
              background:
                '#ffffff',
              borderRadius: 16,
              boxShadow:
                '0 24px 70px rgba(15, 23, 42, 0.28)',
              padding: 24,
            }}
          >
            <p
              className="page-eyebrow"
              style={{
                marginTop: 0,
              }}
            >
              CARNET D'ORGANISMES
            </p>

            <h2
              id="delete-contact-title"
              style={{
                marginTop: 6,
              }}
            >
              Supprimer ce contact ?
            </h2>

            <p
              style={{
                color: '#475569',
                lineHeight: 1.55,
              }}
            >
              <strong>
                {
                  contactToDelete.organization_name
                }
              </strong>{' '}
              sera retiré de votre carnet. Cette action ne supprime aucun compte Formaplane et ne modifie pas votre éventuel référencement auprès de cet organisme.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: 10,
                flexWrap:
                  'wrap',
                marginTop: 22,
              }}
            >
              <button
                className="button button--soft"
                type="button"
                onClick={
                  cancelDelete
                }
                disabled={
                  Boolean(
                    deletingId,
                  )
                }
              >
                Annuler
              </button>

              <button
                className="button"
                type="button"
                onClick={
                  confirmDelete
                }
                disabled={
                  Boolean(
                    deletingId,
                  )
                }
                style={{
                  background:
                    '#b42318',
                }}
              >
                {deletingId
                  ? 'Suppression…'
                  : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
