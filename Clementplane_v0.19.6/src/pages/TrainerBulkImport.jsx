import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import EmailCopyToSenderOption from '../components/EmailCopyToSenderOption';

import { getCompetencyCatalog } from '../services/competencyCatalogService';
import { getEquipmentCatalog } from '../services/equipmentCatalogService';
import {
  analyzeTrainerImportFile,
  findTrainerImportMatches,
  executeTrainerBulkImport,
} from '../services/trainerImportService';
import {
  sendTrainerClaimInvitation,
  getTrainerInvitationHistory,
  getLatestSuccessfulInvitationByTrainer,
  isInvitationCoolingDown,
  formatInvitationRelativeLabel,
} from '../services/emailService';

const MODEL_URL =
  '/templates/Clementplane_Modele_Import_Formateurs_v1_1.xlsx';

function normalizeCatalogKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[-‐‑‒–—'’`´]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function SummaryCard({
  value,
  label,
  tone = 'default',
}) {
  const palette = {
    default: {
      background: '#f8fafc',
      border: '#e2e8f0',
      color: '#0f2747',
    },
    success: {
      background: '#f0fdf4',
      border: '#bbf7d0',
      color: '#15803d',
    },
    warning: {
      background: '#fff7ed',
      border: '#fed7aa',
      color: '#b45309',
    },
    danger: {
      background: '#fef2f2',
      border: '#fecaca',
      color: '#b42318',
    },
  };

  const colors = palette[tone] || palette.default;

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.background,
        borderRadius: 12,
        padding: '11px 14px',
      }}
    >
      <div
        style={{
          fontSize: 21,
          fontWeight: 800,
          color: colors.color,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 2,
          color: '#64748b',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}) {
  return (
    <div
      style={{
        border: '1px solid #dbe3ef',
        background: '#ffffff',
        borderRadius: 16,
        padding: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: 800,
          }}
        >
          {number}
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: 16,
            color: '#0f2747',
          }}
        >
          {title}
        </h2>
      </div>

      {children}
    </div>
  );
}


function MatchBadge({
  children,
  tone = 'default',
}) {
  const palette = {
    default: {
      background: '#f8fafc',
      border: '#e2e8f0',
      color: '#475569',
    },
    success: {
      background: '#f0fdf4',
      border: '#bbf7d0',
      color: '#15803d',
    },
    blue: {
      background: '#eff6ff',
      border: '#bfdbfe',
      color: '#1d4ed8',
    },
    warning: {
      background: '#fff7ed',
      border: '#fed7aa',
      color: '#b45309',
    },
  };

  const colors =
    palette[tone] ||
    palette.default;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content',
        border: `1px solid ${colors.border}`,
        background: colors.background,
        color: colors.color,
        borderRadius: 999,
        padding: '3px 7px',
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}



export default function TrainerBulkImport() {
  const navigate = useNavigate();
  const { currentOrganization } = useAuth();

  const [competencyCatalog, setCompetencyCatalog] =
    useState([]);
  const [equipmentCatalog, setEquipmentCatalog] =
    useState([]);
  const [catalogLoading, setCatalogLoading] =
    useState(true);
  const [catalogError, setCatalogError] =
    useState('');

  const [selectedFile, setSelectedFile] =
    useState(null);
  const [analysis, setAnalysis] =
    useState(null);
  const [analyzing, setAnalyzing] =
    useState(false);
  const [analysisError, setAnalysisError] =
    useState('');

  const [isDraggingFile, setIsDraggingFile] =
    useState(false);

  const analysisResultRef = useRef(null);

  const matchingResultRef = useRef(null);

  const [matching, setMatching] =
    useState(false);
  const [, setMatchingError] =
    useState('');
  const [candidatesByLine, setCandidatesByLine] =
    useState(null);
  const [matchDecisions, setMatchDecisions] =
    useState({});

  const catalogResultRef = useRef(null);
  const [catalogStepOpen, setCatalogStepOpen] =
    useState(false);
  const [catalogDecisions, setCatalogDecisions] =
    useState({});
  const [catalogCustomNames, setCatalogCustomNames] =
    useState({});

  const recapResultRef = useRef(null);
  const [recapOpen, setRecapOpen] = useState(false);
  const [duplicateConfirmations, setDuplicateConfirmations] =
    useState({});
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importClientToken, setImportClientToken] = useState(() =>
    crypto.randomUUID(),
  );

  const [bulkInvitationHistory, setBulkInvitationHistory] = useState([]);
  const [bulkInvitationSelection, setBulkInvitationSelection] = useState({});
  const [bulkInvitationSending, setBulkInvitationSending] = useState(false);
  const [bulkInvitationError, setBulkInvitationError] = useState('');
  const [bulkInvitationResults, setBulkInvitationResults] = useState({});
  const [bulkInvitationCopyToSender, setBulkInvitationCopyToSender] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCatalogs = async () => {
      setCatalogLoading(true);
      setCatalogError('');

      try {
        const [competencies, equipment] =
          await Promise.all([
            getCompetencyCatalog(),
            getEquipmentCatalog(),
          ]);

        if (!active) return;

        setCompetencyCatalog(competencies);
        setEquipmentCatalog(equipment);
      } catch (error) {
        console.error(
          'Impossible de charger les référentiels Clementplane :',
          error,
        );

        if (active) {
          setCatalogError(
            "Impossible de charger les référentiels Compétences et Matériel. Rechargez la page avant d'analyser un fichier.",
          );
        }
      } finally {
        if (active) {
          setCatalogLoading(false);
        }
      }
    };

    loadCatalogs();

    return () => {
      active = false;
    };
  }, []);

  const visibleRows = useMemo(
    () => analysis?.rows?.slice(0, 100) || [],
    [analysis],
  );

  const selectFile = (file) => {
    if (!file) return;

    const lowerName = file.name.toLowerCase();

    if (
      !lowerName.endsWith('.xlsx') &&
      !lowerName.endsWith('.csv')
    ) {
      setSelectedFile(null);
      setAnalysis(null);
      setAnalysisError(
        'Format non pris en charge. Utilisez un fichier .xlsx ou .csv.',
      );
      return;
    }

    setSelectedFile(file);
    setAnalysis(null);
    setAnalysisError('');
    setCandidatesByLine(null);
    setMatchDecisions({});
    setMatchingError('');
    setCatalogStepOpen(false);
    setCatalogDecisions({});
    setRecapOpen(false);
    setDuplicateConfirmations({});
    setImportError('');
    setImportResult(null);
    setImportClientToken(crypto.randomUUID());
    setBulkInvitationHistory([]);
    setBulkInvitationSelection({});
    setBulkInvitationError('');
    setBulkInvitationResults({});
  };


  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    selectFile(file);
  };


  const handleDragOver = (event) => {
    event.preventDefault();

    if (!catalogLoading) {
      setIsDraggingFile(true);
    }
  };


  const handleDragLeave = (event) => {
    event.preventDefault();

    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsDraggingFile(false);
  };


  const handleDrop = (event) => {
    event.preventDefault();
    setIsDraggingFile(false);

    if (catalogLoading) {
      return;
    }

    const file = event.dataTransfer?.files?.[0] || null;
    selectFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile || analyzing || catalogLoading) {
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);
    setAnalysisError('');
    setCandidatesByLine(null);
    setMatchDecisions({});
    setMatchingError('');
    setCatalogStepOpen(false);
    setCatalogDecisions({});

    try {
      const result =
        await analyzeTrainerImportFile({
          file: selectedFile,
          competencyCatalog,
          equipmentCatalog,
        });

      setAnalysis(result);

      window.setTimeout(() => {
        analysisResultRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 80);
    } catch (error) {
      console.error(
        "Impossible d'analyser le fichier d'import :",
        error,
      );

      setAnalysisError(
        error?.message ||
          "Impossible d'analyser le fichier pour le moment.",
      );
    } finally {
      setAnalyzing(false);
    }
  };


  const validRows = useMemo(
    () =>
      analysis?.rows?.filter(
        (row) => row.valid,
      ) || [],
    [analysis],
  );

  const invalidRows = useMemo(
    () =>
      analysis?.rows?.filter(
        (row) => !row.valid,
      ) || [],
    [analysis],
  );

  const matchingRows =
    candidatesByLine === null
      ? []
      : validRows.map((row) => ({
          row,
          candidates:
            candidatesByLine[row.lineNumber] || [],
        }));

  const rowsWithCandidates =
    matchingRows.filter(
      ({ candidates }) =>
        candidates.length > 0,
    );

  const rowsWithoutCandidates =
    matchingRows.filter(
      ({ candidates }) =>
        candidates.length === 0,
    );

  const pendingMatchDecisions =
    rowsWithCandidates.filter(
      ({ row }) =>
        !matchDecisions[row.lineNumber],
    ).length;


  const handleStartMatching =
    async () => {
      if (
        !analysis ||
        matching ||
        validRows.length === 0 ||
        !currentOrganization?.id
      ) {
        return;
      }

      setMatching(true);
      setMatchingError('');
      setCandidatesByLine(null);
      setMatchDecisions({});
      setCatalogStepOpen(false);
      setCatalogDecisions({});
      setRecapOpen(false);
      setDuplicateConfirmations({});

      try {
        const matches =
          await findTrainerImportMatches({
            organizationId:
              currentOrganization.id,
            rows: analysis.rows,
          });

        setCandidatesByLine(matches);

        const initialDecisions = {};

        validRows.forEach((row) => {
          const candidates =
            matches[row.lineNumber] || [];

          if (candidates.length === 0) {
            initialDecisions[row.lineNumber] =
              '__new__';
          }
        });

        setMatchDecisions(initialDecisions);

        window.setTimeout(() => {
          matchingResultRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 80);
      } catch (error) {
        console.error(
          'Rapprochement impossible :',
          error,
        );

        setMatchingError(
          error?.message ||
            "Impossible d'effectuer le rapprochement pour le moment.",
        );
      } finally {
        setMatching(false);
      }
    };


  const setMatchDecision =
    (lineNumber, decision) => {
      setMatchDecisions(
        (previous) => ({
          ...previous,
          [lineNumber]: decision,
        }),
      );
    };



  const rawCatalogIssues = validRows.flatMap((row) => [
    ...(row.unknownCompetencies || []).map((value) => ({
      lineNumber: row.lineNumber,
      trainerName: [row.firstName, row.lastName]
        .filter(Boolean)
        .join(' '),
      type: 'competency',
      typeLabel: 'Compétence',
      value,
      normalizedValue: value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[-‐‑‒–—'’`´]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      catalog: competencyCatalog,
    })),
    ...(row.unknownEquipment || []).map((value) => ({
      lineNumber: row.lineNumber,
      trainerName: [row.firstName, row.lastName]
        .filter(Boolean)
        .join(' '),
      type: 'equipment',
      typeLabel: 'Matériel',
      value,
      normalizedValue: value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[-‐‑‒–—'’`´]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      catalog: equipmentCatalog,
    })),
  ]);

  const groupedCatalogIssuesMap =
    rawCatalogIssues.reduce((map, issue) => {
      const key = `${issue.type}:${issue.normalizedValue}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          type: issue.type,
          typeLabel: issue.typeLabel,
          value: issue.value,
          catalog: issue.catalog,
          occurrences: [],
        });
      }

      map.get(key).occurrences.push({
        lineNumber: issue.lineNumber,
        trainerName: issue.trainerName,
      });

      return map;
    }, new Map());

  const catalogIssues = Array.from(
    groupedCatalogIssuesMap.values(),
  );

  const pendingCatalogDecisions = catalogIssues.filter(
    (issue) => {
      const decision = catalogDecisions[issue.key];

      if (!decision) return true;

      if (decision === '__create_custom__') {
        return !String(
          catalogCustomNames[issue.key] || '',
        ).trim();
      }

      return false;
    },
  ).length;

  const handleOpenCatalogStep = () => {
    if (pendingMatchDecisions > 0) return;

    const defaults = {};
    catalogIssues.forEach((issue) => {
      defaults[issue.key] =
        catalogDecisions[issue.key] || '';
    });

    setCatalogDecisions(defaults);
    setCatalogStepOpen(true);

    window.setTimeout(() => {
      catalogResultRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  };

  const setCatalogDecision = (key, value) => {
    setCatalogDecisions((previous) => ({
      ...previous,
      [key]: value,
    }));

    if (value !== '__create_custom__') {
      setCatalogCustomNames((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  };

  const setCatalogCustomName = (key, value) => {
    setCatalogCustomNames((previous) => ({
      ...previous,
      [key]: value,
    }));
  };


  const getSelectedCandidate = (row) => {
    const decision = matchDecisions[row.lineNumber];

    if (!decision || decision === '__new__') {
      return null;
    }

    return (candidatesByLine?.[row.lineNumber] || []).find(
      (candidate) => candidate.trainer_id === decision,
    ) || null;
  };


  const recapExistingRows = validRows.filter(
    (row) => Boolean(getSelectedCandidate(row)),
  );

  const recapNewRows = validRows.filter(
    (row) => !getSelectedCandidate(row),
  );

  const exactEmailDuplicateRows = recapNewRows.filter((row) =>
    (candidatesByLine?.[row.lineNumber] || []).some(
      (candidate) => candidate.email_match,
    ),
  );

  const forcedNewWarningRows = recapNewRows.filter((row) => {
    const candidates = candidatesByLine?.[row.lineNumber] || [];

    return (
      candidates.length > 0 &&
      !candidates.some((candidate) => candidate.email_match)
    );
  });

  const pendingDuplicateConfirmations = forcedNewWarningRows.filter(
    (row) => !duplicateConfirmations[row.lineNumber],
  ).length;

  const catalogRecap = catalogIssues.map((issue) => {
    const decision = catalogDecisions[issue.key];

    if (decision === '__ignore__') {
      return {
        ...issue,
        action: 'ignored',
        label: 'Ne sera pas importé',
      };
    }

    if (decision === '__create_same__') {
      return {
        ...issue,
        action: 'create',
        label: `Créer « ${issue.value} »`,
      };
    }

    if (decision === '__create_custom__') {
      const customName = String(
        catalogCustomNames[issue.key] || '',
      ).trim();

      return {
        ...issue,
        action: 'create',
        label: `Créer « ${customName} »`,
      };
    }

    if (decision?.startsWith('catalog:')) {
      const catalogId = decision.replace('catalog:', '');
      const match = issue.catalog.find(
        (item) => String(item.id) === catalogId,
      );

      return {
        ...issue,
        action: 'replace',
        label: `Remplacer par « ${match?.name || 'Valeur existante'} »`,
      };
    }

    return {
      ...issue,
      action: 'pending',
      label: 'Décision manquante',
    };
  });

  const catalogCreateCount = catalogRecap.filter(
    (item) => item.action === 'create',
  ).length;
  const catalogReplaceCount = catalogRecap.filter(
    (item) => item.action === 'replace',
  ).length;
  const catalogIgnoreCount = catalogRecap.filter(
    (item) => item.action === 'ignored',
  ).length;

  const recapHasBlockingIssue =
    exactEmailDuplicateRows.length > 0 ||
    pendingDuplicateConfirmations > 0;


  const handleOpenRecap = () => {
    if (pendingCatalogDecisions > 0) return;

    setRecapOpen(true);

    window.setTimeout(() => {
      recapResultRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  };


  const toggleDuplicateConfirmation = (lineNumber) => {
    setDuplicateConfirmations((previous) => ({
      ...previous,
      [lineNumber]: !previous[lineNumber],
    }));
  };


  const resolveImportedValues = (row, type) => {
    const recognized = type === 'competency'
      ? row.recognizedCompetencies || []
      : row.recognizedEquipment || [];
    const unknown = type === 'competency'
      ? row.unknownCompetencies || []
      : row.unknownEquipment || [];

    const values = recognized.map((item) => item.name);

    unknown.forEach((rawValue) => {
      const key = `${type}:${normalizeCatalogKey(rawValue)}`;
      const decision = catalogDecisions[key];
      if (!decision || decision === '__ignore__') return;

      if (decision === '__create_same__') {
        values.push(rawValue);
        return;
      }

      if (decision === '__create_custom__') {
        const custom = String(catalogCustomNames[key] || '').trim();
        if (custom) values.push(custom);
        return;
      }

      if (decision.startsWith('catalog:')) {
        const catalogId = decision.replace('catalog:', '');
        const catalog = type === 'competency'
          ? competencyCatalog
          : equipmentCatalog;
        const match = catalog.find((item) => String(item.id) === catalogId);
        if (match?.name) values.push(match.name);
      }
    });

    return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
  };


  const handleConfirmImport = async () => {
    if (
      importing ||
      importResult ||
      recapHasBlockingIssue ||
      pendingCatalogDecisions > 0 ||
      !currentOrganization?.id
    ) return;

    setImporting(true);
    setImportError('');

    try {
      const rows = validRows.map((row) => {
        const candidate = getSelectedCandidate(row);
        return {
          lineNumber: row.lineNumber,
          existingTrainerId: candidate?.trainer_id || null,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email || null,
          phone: row.phone || null,
          city: row.city || null,
          postalCode: row.postalCode || null,
          tariff: row.tariff,
          status: row.status || 'Standard',
          notes: row.notes || null,
          competencies: resolveImportedValues(row, 'competency'),
          equipment: resolveImportedValues(row, 'equipment'),
        };
      });

      const catalogActions = catalogRecap
        .filter((item) => item.action === 'create')
        .map((item) => ({
          type: item.type,
          action: 'create',
          name: item.action === 'create' && catalogDecisions[item.key] === '__create_custom__'
            ? String(catalogCustomNames[item.key] || '').trim()
            : item.value,
        }));

      const result = await executeTrainerBulkImport({
        organizationId: currentOrganization.id,
        clientToken: importClientToken,
        rows,
        catalogActions,
      });

      setImportResult(result);

      try {
        const history = await getTrainerInvitationHistory({
          organizationId: currentOrganization.id,
        });
        setBulkInvitationHistory(history);
      } catch (historyError) {
        console.error(
          "Impossible de charger l'historique des invitations après import :",
          historyError,
        );
      }
    } catch (error) {
      setImportError(error?.message || "Impossible d'effectuer l'import.");
    } finally {
      setImporting(false);
    }
  };

  const importedTrainerRows = useMemo(() => {
    if (!importResult?.details) return [];

    const latestByTrainer = getLatestSuccessfulInvitationByTrainer(
      bulkInvitationHistory,
    );

    return importResult.details.map((detail) => {
      const sourceRow = validRows.find(
        (row) => row.lineNumber === detail.lineNumber,
      );
      const latestInvitation = latestByTrainer[detail.trainerId] || null;
      const claimed = Boolean(detail.claimed);
      const email = sourceRow?.email || '';
      const recentInvitation = isInvitationCoolingDown(latestInvitation);
      const sendResult = bulkInvitationResults[detail.trainerId] || null;

      let situation = 'Peut être invité';
      let selectable = true;

      if (claimed) {
        situation = 'Déjà inscrit';
        selectable = false;
      } else if (!email) {
        situation = "Pas d’e-mail";
        selectable = false;
      } else if (sendResult?.status === 'sent') {
        situation = 'Invitation envoyée';
        selectable = false;
      } else if (recentInvitation) {
        situation = formatInvitationRelativeLabel(latestInvitation);
        selectable = false;
      }

      return {
        ...detail,
        firstName: sourceRow?.firstName || '',
        lastName: sourceRow?.lastName || '',
        email,
        situation,
        selectable,
        latestInvitation,
        sendResult,
      };
    });
  }, [
    importResult,
    validRows,
    bulkInvitationHistory,
    bulkInvitationResults,
  ]);

  const selectableInvitationRows = importedTrainerRows.filter(
    (row) => row.selectable,
  );

  const selectedInvitationRows = selectableInvitationRows.filter(
    (row) => bulkInvitationSelection[row.trainerId],
  );

  const allInvitableSelected =
    selectableInvitationRows.length > 0 &&
    selectedInvitationRows.length === selectableInvitationRows.length;

  const toggleBulkInvitation = (trainerId) => {
    setBulkInvitationSelection((previous) => ({
      ...previous,
      [trainerId]: !previous[trainerId],
    }));
  };

  const toggleAllBulkInvitations = () => {
    if (allInvitableSelected) {
      setBulkInvitationSelection({});
      return;
    }

    setBulkInvitationSelection(
      Object.fromEntries(
        selectableInvitationRows.map((row) => [row.trainerId, true]),
      ),
    );
  };

  const handleSendBulkInvitations = async () => {
    if (
      bulkInvitationSending ||
      selectedInvitationRows.length === 0 ||
      !currentOrganization?.id
    ) return;

    setBulkInvitationSending(true);
    setBulkInvitationError('');

    const nextResults = { ...bulkInvitationResults };

    for (const row of selectedInvitationRows) {
      try {
        await sendTrainerClaimInvitation({
          trainerId: row.trainerId,
          organizationId: currentOrganization.id,
          copyToSender: bulkInvitationCopyToSender,
        });
        nextResults[row.trainerId] = { status: 'sent' };
      } catch (error) {
        nextResults[row.trainerId] = {
          status: 'failed',
          message: error?.message || "Échec de l'envoi.",
        };
      }
    }

    setBulkInvitationResults(nextResults);
    setBulkInvitationSelection({});
    setBulkInvitationCopyToSender(false);

    try {
      const history = await getTrainerInvitationHistory({
        organizationId: currentOrganization.id,
      });
      setBulkInvitationHistory(history);
    } catch (error) {
      console.error("Impossible d'actualiser l'historique des invitations :", error);
    }

    const failedCount = Object.values(nextResults).filter(
      (result) => result?.status === 'failed',
    ).length;

    if (failedCount > 0) {
      setBulkInvitationError(
        `${failedCount} invitation(s) n'ont pas pu être envoyées. Les autres envois ont été conservés.`,
      );
    }

    setBulkInvitationSending(false);
  };

  const handleDownloadImportReport = () => {
    if (!importResult) return;

    const importedRows = importResult.details.map((detail) => {
      const sourceRow = validRows.find(
        (row) => row.lineNumber === detail.lineNumber,
      );

      let resultLabel = 'Importé';

      if (detail.action === 'created') {
        resultLabel = 'Créé';
      } else if (detail.action === 'attached') {
        resultLabel = 'Rattaché à un profil existant';
      } else if (detail.action === 'synchronized') {
        resultLabel = 'Synchronisé avec un profil existant';
      }

      const invitation = bulkInvitationResults[detail.trainerId];

      return {
        Prénom: sourceRow?.firstName || '',
        Nom: sourceRow?.lastName || '',
        'E-mail': sourceRow?.email || '',
        Résultat: resultLabel,
        Invitation:
          invitation?.status === 'sent'
            ? 'Invitation envoyée'
            : invitation?.status === 'failed'
              ? "Échec de l'invitation"
              : 'Non envoyée',
      };
    });

    const notImportedRows = invalidRows.map((row) => ({
      Ligne: row.lineNumber,
      Prénom: row.firstName || '',
      Nom: row.lastName || '',
      'E-mail': row.email || '',
      Motif:
        row.errors.length > 0
          ? row.errors.join(' ')
          : 'Ligne non importée.',
    }));

    const referenceRows = catalogRecap.map((item) => ({
      Type: item.typeLabel,
      'Valeur détectée': item.value,
      Occurrences: item.occurrences.length,
      Décision: item.label,
    }));

    const summaryRows = [
      ['Compte-rendu import Clementplane'],
      [
        'Date',
        new Date(
          importResult.completedAt || Date.now(),
        ).toLocaleString('fr-FR'),
      ],
      [
        'Organisme',
        currentOrganization?.name ||
          currentOrganization?.legal_name ||
          '',
      ],
      ['Fichier', selectedFile?.name || ''],
      [
        'Formateurs importés',
        importedRows.length,
      ],
      [
        'Formateurs non importés',
        notImportedRows.length,
      ],
      [
        'Valeurs ajoutées au référentiel (compétence/matériel)',
        importResult.catalogCreated || 0,
      ],
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(summaryRows),
      'Résumé',
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        importedRows.length > 0
          ? importedRows
          : [
              {
                Prénom: '',
                Nom: '',
                'E-mail': '',
                Résultat: 'Aucun formateur importé',
                Invitation: '',
              },
            ],
      ),
      'Importés',
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        notImportedRows.length > 0
          ? notImportedRows
          : [
              {
                Ligne: '',
                Prénom: '',
                Nom: '',
                'E-mail': '',
                Motif: 'Aucune ligne non importée',
              },
            ],
      ),
      'Non importés',
    );

    if (referenceRows.length > 0) {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(referenceRows),
        'Compétences-Matériel',
      );
    }

    const stamp = new Date()
      .toISOString()
      .slice(0, 10);

    XLSX.writeFile(
      workbook,
      `Clementplane_Compte-rendu_import_${stamp}.xlsx`,
    );
  };


  return (
    <div className="page-container">
      <div
        className="page-header"
        style={{
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div className="page-eyebrow">
            FORMATEURS
          </div>
          <h1 style={{ fontSize: 30, lineHeight: 1.2 }}>
            Importer des formateurs en masse
          </h1>
          <p
            style={{
              margin: '5px 0 0',
              color: '#64748b',
              maxWidth: 760,
              lineHeight: 1.45,
              fontSize: 14,
            }}
          >
            Utilisez le modèle Clementplane pour préparer votre fichier.
            L’analyse est effectuée avant toute création ou modification :
            rien n’est enregistré dans votre base à cette étape.
          </p>
        </div>

        <button
          type="button"
          className="button button--compact"
          onClick={() => navigate('/listing')}
        >
          Retour aux formateurs
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 16,
          maxWidth: 1050,
        }}
      >
        <Step
          number="1"
          title="Téléchargez le modèle Clementplane"
        >
          <p
            style={{
              color: '#64748b',
              lineHeight: 1.45,
              margin: '0 0 12px',
              fontSize: 14,
            }}
          >
            Le modèle contient les 12 colonnes attendues. Ne modifiez pas
            leurs intitulés et n’ajoutez pas de ligne d’exemple.
          </p>

          <a
            href={MODEL_URL}
            download="Clementplane_Modele_Import_Formateurs_v1_1.xlsx"
            className="button button--primary button--compact"
            style={{
              display: 'inline-flex',
              textDecoration: 'none',
            }}
          >
            Télécharger le modèle Excel
          </a>
        </Step>

        <Step
          number="2"
          title="Complétez votre fichier"
        >
          <div
            style={{
              display: 'grid',
              gap: 7,
              color: '#64748b',
              lineHeight: 1.45,
              fontSize: 14,
            }}
          >
            <div>
              <strong style={{ color: '#334155' }}>
                Prénom et Nom
              </strong>{' '}
              sont obligatoires.
            </div>

            <div>
              Pour plusieurs compétences ou matériels, utilisez un{' '}
              <strong style={{ color: '#334155' }}>
                point-virgule ;
              </strong>{' '}
              par exemple : <code>SST ; Incendie</code>.
            </div>

            <div>
              Les compétences et matériels sont comparés aux référentiels
              Clementplane. Une valeur inconnue sera signalée pour contrôle
              et ne créera jamais automatiquement une nouvelle référence.
            </div>
          </div>
        </Step>

        <Step
          number="3"
          title="Importez et contrôlez le fichier"
        >
          {catalogError ? (
            <div
              style={{
                marginBottom: 14,
                padding: 12,
                borderRadius: 10,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b42318',
              }}
            >
              {catalogError}
            </div>
          ) : null}

          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDraggingFile
                ? '2px dashed #2563eb'
                : '2px dashed #cbd5e1',
              background: isDraggingFile
                ? '#eff6ff'
                : '#f8fafc',
              borderRadius: 14,
              padding: '26px 20px',
              textAlign: 'center',
              transition: 'border-color 120ms ease, background 120ms ease',
            }}
          >
            <div
              style={{
                fontWeight: 800,
                color: '#0f2747',
                fontSize: 15,
              }}
            >
              Glissez-déposez votre fichier ici
            </div>

            <div
              style={{
                margin: '5px 0 14px',
                color: '#64748b',
                fontSize: 13,
              }}
            >
              Formats acceptés : Excel .xlsx ou CSV
            </div>

            <label
              className="button button--compact"
              style={{
                display: 'inline-flex',
                cursor: catalogLoading ? 'not-allowed' : 'pointer',
                opacity: catalogLoading ? 0.6 : 1,
              }}
            >
              Choisir un fichier
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
                disabled={catalogLoading}
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                }}
              />
            </label>

            {selectedFile ? (
              <div
                style={{
                  marginTop: 14,
                  color: '#334155',
                  fontSize: 13,
                }}
              >
                Fichier sélectionné :{' '}
                <strong>
                  {selectedFile.name}
                </strong>
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 14,
            }}
          >
            <button
              type="button"
              className="button button--primary button--compact"
              onClick={handleAnalyze}
              disabled={
                !selectedFile ||
                analyzing ||
                catalogLoading ||
                Boolean(catalogError)
              }
            >
              {analyzing
                ? 'Analyse en cours…'
                : 'Analyser le fichier'}
            </button>
          </div>

          {analysisError ? (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 10,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b42318',
              }}
            >
              {analysisError}
            </div>
          ) : null}
        </Step>

        {analysis ? (
          <div
            ref={analysisResultRef}
            style={{
              scrollMarginTop: 20,
              border: '1px solid #dbe3ef',
              background: '#ffffff',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  className="page-eyebrow"
                  style={{ fontSize: 10 }}
                >
                  PRÉVISUALISATION
                </div>
                <h2
                  style={{
                    margin: '3px 0 2px',
                    fontSize: 17,
                    color: '#0f2747',
                  }}
                >
                  Contrôle du fichier
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  Aucune donnée n’a encore été enregistrée.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                <MatchBadge tone="blue">
                  {analysis.summary.total} analysée(s)
                </MatchBadge>
                <MatchBadge tone="success">
                  {analysis.summary.valid} valide(s)
                </MatchBadge>
                <MatchBadge
                  tone={
                    analysis.summary.errors > 0
                      ? 'warning'
                      : 'success'
                  }
                >
                  {analysis.summary.errors} erreur(s)
                </MatchBadge>
                <MatchBadge
                  tone={
                    analysis.summary.warnings > 0
                      ? 'warning'
                      : 'success'
                  }
                >
                  {analysis.summary.warnings} à vérifier
                </MatchBadge>
              </div>
            </div>

            {(analysis.summary.unknownCompetencies > 0 ||
              analysis.summary.unknownEquipment > 0) ? (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  border: '1px solid #fed7aa',
                  borderRadius: 8,
                  background: '#fff7ed',
                  color: '#9a3412',
                  fontSize: 11.5,
                  lineHeight: 1.4,
                }}
              >
                Référentiels à contrôler :{' '}
                <strong>
                  {analysis.summary.unknownCompetencies}
                </strong>{' '}
                compétence(s) et{' '}
                <strong>
                  {analysis.summary.unknownEquipment}
                </strong>{' '}
                matériel(s) non reconnu(s).
              </div>
            ) : null}

            {invalidRows.length > 0 ? (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b42318',
                  fontSize: 11.5,
                  lineHeight: 1.4,
                }}
              >
                {invalidRows.length} ligne(s) seront exclues du rapprochement.
                Les {validRows.length} ligne(s) valide(s) peuvent continuer.
              </div>
            ) : null}

            <div
              style={{
                marginTop: 10,
                border: '1px solid #e2e8f0',
                borderRadius: 9,
                overflow: 'hidden',
              }}
            >
              {visibleRows.map((row, index) => (
                <div
                  key={row.lineNumber}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '40px minmax(145px, 1.1fr) minmax(160px, 1.3fr) 90px 100px minmax(220px, 1.8fr)',
                    gap: 8,
                    alignItems: 'center',
                    padding: '7px 9px',
                    borderTop: index ? '1px solid #edf1f5' : 'none',
                    fontSize: 11,
                    background:
                      row.errors.length > 0
                        ? '#fffafa'
                        : '#ffffff',
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>
                    {row.lineNumber}
                  </span>

                  <strong
                    style={{
                      color: '#0f2747',
                      fontSize: 11.5,
                    }}
                  >
                    {[row.firstName, row.lastName]
                      .filter(Boolean)
                      .join(' ') || '—'}
                  </strong>

                  <span
                    style={{
                      color: '#64748b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.email || 'Sans e-mail'}
                  </span>

                  <span style={{ color: '#64748b' }}>
                    {row.city || '—'}
                  </span>

                  <span style={{ color: '#64748b' }}>
                    {row.status}
                  </span>

                  <div>
                    {row.errors.length === 0 &&
                    row.warnings.length === 0 ? (
                      <span
                        style={{
                          color: '#15803d',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Conforme
                      </span>
                    ) : (
                      <div
                        style={{
                          display: 'grid',
                          gap: 2,
                        }}
                      >
                        {row.errors.map((message) => (
                          <span
                            key={`error-${message}`}
                            style={{
                              color: '#b42318',
                              fontSize: 10.5,
                            }}
                          >
                            Erreur : {message}
                          </span>
                        ))}

                        {row.warnings.map((message) => (
                          <span
                            key={`warning-${message}`}
                            style={{
                              color: '#b45309',
                              fontSize: 10.5,
                            }}
                          >
                            À vérifier : {message}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {analysis.rows.length > 100 ? (
              <div
                style={{
                  marginTop: 7,
                  color: '#64748b',
                  fontSize: 10.5,
                }}
              >
                Aperçu limité aux 100 premières lignes sur{' '}
                {analysis.rows.length}. Toutes les lignes ont néanmoins été analysées.
              </div>
            ) : null}

            <div
              style={{
                marginTop: 10,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="button button--primary button--compact"
                onClick={handleStartMatching}
                disabled={
                  matching ||
                  validRows.length === 0 ||
                  !currentOrganization?.id
                }
              >
                {matching
                  ? 'Rapprochement en cours…'
                  : 'Continuer vers le rapprochement'}
              </button>
            </div>
          </div>
        ) : null}

        {candidatesByLine !== null ? (
          <div
            ref={matchingResultRef}
            style={{
              scrollMarginTop: 20,
              border: '1px solid #dbe3ef',
              background: '#ffffff',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  className="page-eyebrow"
                  style={{ fontSize: 10 }}
                >
                  RAPPROCHEMENT
                </div>
                <h2
                  style={{
                    margin: '3px 0 2px',
                    fontSize: 17,
                    color: '#0f2747',
                  }}
                >
                  Vérifiez uniquement les correspondances
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  Les nouveaux profils sont déjà classés. Une action n’est demandée
                  que lorsqu’un profil existant a été trouvé.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  fontSize: 11,
                }}
              >
                <MatchBadge tone="blue">
                  {validRows.length} analysé(s)
                </MatchBadge>
                <MatchBadge tone={rowsWithCandidates.length ? 'warning' : 'success'}>
                  {rowsWithCandidates.length} à vérifier
                </MatchBadge>
                <MatchBadge tone="success">
                  {rowsWithoutCandidates.length} nouveau(x)
                </MatchBadge>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 9,
                overflow: 'hidden',
              }}
            >
              {matchingRows.map(({ row, candidates }, index) => {
                const decision = matchDecisions[row.lineNumber];
                const trainerName = [row.firstName, row.lastName]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div
                    key={row.lineNumber}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(170px, 1.1fr) minmax(300px, 2fr)',
                      gap: 12,
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderTop: index ? '1px solid #edf1f5' : 'none',
                      background: candidates.length ? '#fff' : '#fbfdfb',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 7,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <strong
                          style={{
                            color: '#0f2747',
                            fontSize: 12.5,
                          }}
                        >
                          {trainerName}
                        </strong>
                        <span
                          style={{
                            color: '#94a3b8',
                            fontSize: 10,
                          }}
                        >
                          L.{row.lineNumber}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 1,
                          color: '#64748b',
                          fontSize: 10.5,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {row.email || 'Sans e-mail'}
                        {row.city ? ` · ${row.city}` : ''}
                      </div>
                    </div>

                    {candidates.length === 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            color: '#15803d',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          ✓ Nouveau formateur
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          gap: 7,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        {candidates.map((candidate) => (
                          <label
                            key={candidate.trainer_id}
                            style={{
                              display: 'inline-flex',
                              gap: 5,
                              alignItems: 'center',
                              border:
                                decision === candidate.trainer_id
                                  ? '1px solid #2563eb'
                                  : '1px solid #dbe3ef',
                              background:
                                decision === candidate.trainer_id
                                  ? '#eff6ff'
                                  : '#fff',
                              borderRadius: 7,
                              padding: '5px 7px',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            <input
                              type="radio"
                              checked={decision === candidate.trainer_id}
                              onChange={() =>
                                setMatchDecision(
                                  row.lineNumber,
                                  candidate.trainer_id,
                                )
                              }
                              style={{ margin: 0 }}
                            />
                            <strong>
                              {[candidate.prenom, candidate.nom]
                                .filter(Boolean)
                                .join(' ')}
                            </strong>
                            {candidate.already_in_network ? (
                              <span style={{ color: '#2563eb' }}>
                                · déjà dans votre liste
                              </span>
                            ) : null}
                            {candidate.claimed ? (
                              <span style={{ color: '#15803d' }}>
                                · revendiqué
                              </span>
                            ) : null}
                          </label>
                        ))}

                        <label
                          style={{
                            display: 'inline-flex',
                            gap: 5,
                            alignItems: 'center',
                            border:
                              decision === '__new__'
                                ? '1px solid #2563eb'
                                : '1px solid #dbe3ef',
                            background:
                              decision === '__new__'
                                ? '#eff6ff'
                                : '#fff',
                            borderRadius: 7,
                            padding: '5px 7px',
                            cursor: 'pointer',
                            fontSize: 11,
                            color: '#475569',
                          }}
                        >
                          <input
                            type="radio"
                            checked={decision === '__new__'}
                            onChange={() =>
                              setMatchDecision(
                                row.lineNumber,
                                '__new__',
                              )
                            }
                            style={{ margin: 0 }}
                          />
                          Aucun — créer nouveau
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  color: pendingMatchDecisions ? '#b45309' : '#15803d',
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                {pendingMatchDecisions
                  ? `${pendingMatchDecisions} correspondance(s) à confirmer`
                  : `✓ ${validRows.length}/${validRows.length} lignes vérifiées`}
              </div>

              <button
                type="button"
                className="button button--primary button--compact"
                disabled={pendingMatchDecisions > 0}
                onClick={handleOpenCatalogStep}
              >
                Continuer vers compétences et matériel
              </button>
            </div>
          </div>
        ) : null}

        {catalogStepOpen ? (
          <div
            ref={catalogResultRef}
            style={{
              scrollMarginTop: 20,
              border: '1px solid #dbe3ef',
              background: '#ffffff',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div className="page-eyebrow" style={{ fontSize: 10 }}>
              COMPÉTENCES & MATÉRIEL
            </div>
            <h2
              style={{
                margin: '3px 0 2px',
                fontSize: 17,
                color: '#0f2747',
              }}
            >
              Contrôlez uniquement les valeurs inconnues
            </h2>
            <p
              style={{
                margin: 0,
                color: '#64748b',
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              Les valeurs déjà reconnues sont validées automatiquement.
              Pour une valeur inconnue, vous pouvez l’ajouter au référentiel
              Clementplane, la renommer avant de l’ajouter, la rapprocher d’une
              valeur existante ou l’ignorer. Une même valeur n’apparaît qu’une
              seule fois : votre choix s’appliquera à tous les formateurs concernés.
            </p>

            {catalogIssues.length === 0 ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  background: '#f0fdf4',
                  color: '#15803d',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                ✓ Toutes les compétences et tous les matériels sont reconnus.
              </div>
            ) : (
              <div
                style={{
                  marginTop: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 9,
                  overflow: 'hidden',
                }}
              >
                {catalogIssues.map((issue, index) => (
                  <div
                    key={issue.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '110px minmax(190px, 1fr) 120px minmax(280px, 1.4fr)',
                      gap: 10,
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderTop: index ? '1px solid #edf1f5' : 'none',
                    }}
                  >
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 10.5,
                        fontWeight: 700,
                      }}
                    >
                      {issue.typeLabel}
                    </div>

                    <div
                      style={{
                        color: '#b45309',
                        fontSize: 11.5,
                        fontWeight: 700,
                      }}
                    >
                      « {issue.value} »
                    </div>

                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 10.5,
                      }}
                      title={issue.occurrences
                        .map(
                          (item) =>
                            `${item.trainerName} (ligne ${item.lineNumber})`,
                        )
                        .join('\\n')}
                    >
                      {issue.occurrences.length} occurrence(s)
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gap: 6,
                      }}
                    >
                      <select
                        value={catalogDecisions[issue.key] || ''}
                        onChange={(event) =>
                          setCatalogDecision(
                            issue.key,
                            event.target.value,
                          )
                        }
                        style={{
                          width: '100%',
                          minHeight: 31,
                          border: '1px solid #cbd5e1',
                          borderRadius: 7,
                          padding: '4px 7px',
                          background: '#fff',
                          color: '#334155',
                          fontSize: 11,
                        }}
                      >
                        <option value="">
                          Choisir une seule décision pour toutes les occurrences…
                        </option>
                        <option value="__create_same__">
                          Ajouter « {issue.value} » au référentiel Clementplane
                        </option>
                        <option value="__create_custom__">
                          Ajouter au référentiel sous un autre nom…
                        </option>
                        <option value="__ignore__">
                          Ne pas importer cette valeur
                        </option>
                        {issue.catalog.map((item) => (
                          <option
                            key={item.id}
                            value={`catalog:${item.id}`}
                          >
                            Remplacer partout par : {item.name}
                          </option>
                        ))}
                      </select>

                      {catalogDecisions[issue.key] ===
                      '__create_custom__' ? (
                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type="text"
                            value={
                              catalogCustomNames[issue.key] || ''
                            }
                            onChange={(event) =>
                              setCatalogCustomName(
                                issue.key,
                                event.target.value,
                              )
                            }
                            placeholder={`Nouveau nom pour « ${issue.value} »`}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              minHeight: 31,
                              border: '1px solid #cbd5e1',
                              borderRadius: 7,
                              padding: '4px 8px',
                              background: '#fff',
                              color: '#334155',
                              fontSize: 11,
                            }}
                          />
                          <span
                            style={{
                              color: '#64748b',
                              fontSize: 10,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            appliqué à {issue.occurrences.length} occurrence(s)
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  color: pendingCatalogDecisions ? '#b45309' : '#15803d',
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                {pendingCatalogDecisions
                  ? `${pendingCatalogDecisions} valeur(s) restent à traiter`
                  : '✓ Compétences et matériel vérifiés'}
              </div>

              <button
                type="button"
                className="button button--primary button--compact"
                disabled={pendingCatalogDecisions > 0}
                onClick={handleOpenRecap}
                title={
                  pendingCatalogDecisions
                    ? 'Traitez d’abord toutes les valeurs inconnues.'
                    : ''
                }
              >
                Continuer vers le récapitulatif
              </button>
            </div>
          </div>
        ) : null}

        {recapOpen ? (
          <div
            ref={recapResultRef}
            style={{
              scrollMarginTop: 20,
              border: '1px solid #dbe3ef',
              background: '#ffffff',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div className="page-eyebrow" style={{ fontSize: 10 }}>
                  RÉCAPITULATIF AVANT IMPORT
                </div>
                <h2
                  style={{
                    margin: '3px 0 2px',
                    fontSize: 17,
                    color: '#0f2747',
                  }}
                >
                  Vérifiez ce qui sera enregistré
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  Clementplane n’a encore rien modifié. Ce résumé présente les
                  opérations prévues avant la validation définitive.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                <MatchBadge tone="success">
                  {recapNewRows.length} nouveau(x)
                </MatchBadge>
                <MatchBadge tone="blue">
                  {recapExistingRows.length} profil(s) existant(s)
                </MatchBadge>
                <MatchBadge tone={invalidRows.length ? 'warning' : 'success'}>
                  {invalidRows.length} exclu(s)
                </MatchBadge>
              </div>
            </div>

            {exactEmailDuplicateRows.length > 0 ? (
              <div
                style={{
                  marginTop: 12,
                  padding: '9px 10px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b42318',
                  fontSize: 11.5,
                  lineHeight: 1.45,
                }}
              >
                <strong>Création bloquée :</strong>{' '}
                {exactEmailDuplicateRows.length} ligne(s) ont été définies comme
                « nouveau formateur » alors qu’un profil existant possède exactement
                la même adresse e-mail. Clementplane empêchera la création d’un doublon.
              </div>
            ) : null}

            {forcedNewWarningRows.length > 0 ? (
              <div
                style={{
                  marginTop: 10,
                  border: '1px solid #fed7aa',
                  borderRadius: 9,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '7px 9px',
                    background: '#fff7ed',
                    color: '#9a3412',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  Doublons potentiels à confirmer
                </div>

                {forcedNewWarningRows.map((row, index) => (
                  <label
                    key={row.lineNumber}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '22px minmax(150px, .8fr) 1fr',
                      gap: 8,
                      alignItems: 'center',
                      padding: '7px 9px',
                      borderTop: index ? '1px solid #fde7c7' : 'none',
                      background: '#fffdf9',
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(
                        duplicateConfirmations[row.lineNumber],
                      )}
                      onChange={() =>
                        toggleDuplicateConfirmation(row.lineNumber)
                      }
                    />

                    <strong style={{ color: '#0f2747' }}>
                      {[row.firstName, row.lastName]
                        .filter(Boolean)
                        .join(' ')}
                    </strong>

                    <span style={{ color: '#64748b' }}>
                      Je confirme qu’il s’agit d’une autre personne et souhaite
                      créer une nouvelle fiche malgré la correspondance proposée.
                    </span>
                  </label>
                ))}
              </div>
            ) : null}

            <div
              style={{
                marginTop: 12,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 8,
              }}
            >
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 9,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800 }}>
                  FORMATEURS
                </div>
                <div style={{ marginTop: 5, fontSize: 11.5, color: '#334155', lineHeight: 1.55 }}>
                  <div>Créer : <strong>{recapNewRows.length}</strong></div>
                  <div>Rattacher / synchroniser : <strong>{recapExistingRows.length}</strong></div>
                  <div>Ne pas importer : <strong>{invalidRows.length}</strong></div>
                </div>
              </div>

              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 9,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800 }}>
                  RÉFÉRENTIELS
                </div>
                <div style={{ marginTop: 5, fontSize: 11.5, color: '#334155', lineHeight: 1.55 }}>
                  <div>Créer : <strong>{catalogCreateCount}</strong></div>
                  <div>Rapprocher : <strong>{catalogReplaceCount}</strong></div>
                  <div>Ignorer : <strong>{catalogIgnoreCount}</strong></div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 9,
                overflow: 'hidden',
              }}
            >
              {validRows.map((row, index) => {
                const candidate = getSelectedCandidate(row);
                const isNew = !candidate;
                const blockedByEmail = exactEmailDuplicateRows.some(
                  (item) => item.lineNumber === row.lineNumber,
                );

                return (
                  <div
                    key={row.lineNumber}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '42px minmax(160px, 1fr) minmax(210px, 1.4fr)',
                      gap: 8,
                      alignItems: 'center',
                      padding: '7px 9px',
                      borderTop: index ? '1px solid #edf1f5' : 'none',
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: '#94a3b8' }}>
                      L.{row.lineNumber}
                    </span>

                    <strong style={{ color: '#0f2747' }}>
                      {[row.firstName, row.lastName]
                        .filter(Boolean)
                        .join(' ')}
                    </strong>

                    <span
                      style={{
                        color: blockedByEmail
                          ? '#b42318'
                          : isNew
                            ? '#15803d'
                            : '#2563eb',
                        fontWeight: 700,
                      }}
                    >
                      {blockedByEmail
                        ? 'Création bloquée — e-mail déjà utilisé'
                        : isNew
                          ? 'Créer un nouveau formateur'
                          : candidate.already_in_network
                            ? `Synchroniser avec ${candidate.prenom} ${candidate.nom} (déjà dans votre listing)`
                            : `Rattacher à ${candidate.prenom} ${candidate.nom}`}
                    </span>
                  </div>
                );
              })}

              {invalidRows.map((row) => (
                <div
                  key={`invalid-${row.lineNumber}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '42px minmax(160px, 1fr) minmax(210px, 1.4fr)',
                    gap: 8,
                    alignItems: 'center',
                    padding: '7px 9px',
                    borderTop: '1px solid #edf1f5',
                    background: '#fffafa',
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>
                    L.{row.lineNumber}
                  </span>
                  <strong style={{ color: '#0f2747' }}>
                    {[row.firstName, row.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Ligne incomplète'}
                  </strong>
                  <span style={{ color: '#b42318', fontWeight: 700 }}>
                    Non importée — {row.errors.join(' ')}
                  </span>
                </div>
              ))}
            </div>

            {catalogRecap.length > 0 ? (
              <div
                style={{
                  marginTop: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 9,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '7px 9px',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: 10.5,
                    fontWeight: 800,
                  }}
                >
                  DÉCISIONS COMPÉTENCES & MATÉRIEL
                </div>

                {catalogRecap.map((item, index) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px minmax(170px, .8fr) minmax(220px, 1.2fr)',
                      gap: 8,
                      alignItems: 'center',
                      padding: '7px 9px',
                      borderTop: index ? '1px solid #edf1f5' : 'none',
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: '#64748b' }}>
                      {item.typeLabel}
                    </span>
                    <strong style={{ color: '#0f2747' }}>
                      {item.value} · {item.occurrences.length} occurrence(s)
                    </strong>
                    <span
                      style={{
                        color:
                          item.action === 'ignored'
                            ? '#64748b'
                            : item.action === 'create'
                              ? '#15803d'
                              : '#2563eb',
                        fontWeight: 700,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  color: recapHasBlockingIssue ? '#b42318' : '#15803d',
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                {exactEmailDuplicateRows.length > 0
                  ? `${exactEmailDuplicateRows.length} doublon(s) par e-mail doivent être corrigés.`
                  : pendingDuplicateConfirmations > 0
                    ? `${pendingDuplicateConfirmations} confirmation(s) anti-doublon restent à valider.`
                    : '✓ Récapitulatif prêt pour la validation finale.'}
              </div>

              <button
                type="button"
                className="button button--primary button--compact"
                disabled={recapHasBlockingIssue || importing || Boolean(importResult)}
                onClick={handleConfirmImport}
                title={
                  recapHasBlockingIssue
                    ? 'Corrigez ou confirmez les risques de doublon avant de poursuivre.'
                    : ''
                }
              >
                {importing ? 'Import en cours…' : importResult ? 'Import terminé' : 'Confirmer l’import'}
              </button>
            </div>

            {importError ? (
              <div style={{ marginTop: 10, padding: '9px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b42318', fontSize: 11.5 }}>
                <strong>Import non effectué.</strong> {importError}
              </div>
            ) : null}

            {importResult ? (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ color: '#15803d', fontWeight: 800, fontSize: 14 }}>
                  ✓ Import terminé avec succès
                </div>
                <div style={{ marginTop: 5, color: '#334155', fontSize: 11.5, lineHeight: 1.6 }}>
                  <strong>{importResult.created || 0}</strong>{' '}
                  {(importResult.created || 0) > 1 ? 'nouveaux formateurs créés' : 'nouveau formateur créé'} ·{' '}
                  <strong>{(importResult.attached || 0) + (importResult.synchronized || 0)}</strong>{' '}
                  {((importResult.attached || 0) + (importResult.synchronized || 0)) > 1
                    ? 'profils synchronisés'
                    : 'profil synchronisé'} ·{' '}
                  <strong>{importResult.catalogCreated || 0}</strong>{' '}
                  {(importResult.catalogCreated || 0) > 1
                    ? 'valeurs ajoutées au référentiel'
                    : 'valeur ajoutée au référentiel'}{' '}
                  (compétence/matériel) ·{' '}
                  <strong>{invalidRows.length}</strong>{' '}
                  {invalidRows.length > 1 ? 'lignes non importées' : 'ligne non importée'}.
                </div>
                <div style={{ marginTop: 7, color: '#64748b', fontSize: 10.5 }}>
                  L’import est verrouillé pour cette exécution : un double-clic ou une nouvelle tentative avec le même jeton ne peut pas recréer les données.
                </div>
                <div style={{ marginTop: 9, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="button button--compact"
                    onClick={handleDownloadImportReport}
                  >
                    Télécharger le compte-rendu Excel
                  </button>
                </div>
              </div>
            ) : null}

            {importResult ? (
              <div
                style={{
                  marginTop: 12,
                  border: '1px solid #dbe3ef',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#ffffff',
                }}
              >
                <div style={{ padding: '12px 12px 9px' }}>
                  <div style={{ color: '#0f2747', fontSize: 14, fontWeight: 800 }}>
                    Inviter les formateurs à rejoindre Clementplane
                  </div>
                  <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 11.5, lineHeight: 1.5 }}>
                    Vos formateurs ont bien été ajoutés. Vous pouvez continuer à gérer vous-même leurs disponibilités, missions et informations.
                  </p>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 11.5, lineHeight: 1.5 }}>
                    En les invitant, ils pourront <strong>renseigner et mettre à jour eux-mêmes leurs disponibilités</strong>, ce qui vous permet de disposer d’un planning plus fiable et plus à jour.
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px minmax(110px,.7fr) minmax(120px,.8fr) minmax(190px,1.3fr) minmax(120px,.8fr)',
                      gap: 8,
                      alignItems: 'center',
                      padding: '7px 10px',
                      background: '#f8fafc',
                      color: '#64748b',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allInvitableSelected}
                      disabled={selectableInvitationRows.length === 0}
                      onChange={toggleAllBulkInvitations}
                      aria-label="Sélectionner tous les formateurs invitables"
                    />
                    <span>PRÉNOM</span>
                    <span>NOM</span>
                    <span>E-MAIL</span>
                    <span>SITUATION</span>
                  </div>

                  {importedTrainerRows.map((row) => (
                    <div
                      key={row.trainerId}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px minmax(110px,.7fr) minmax(120px,.8fr) minmax(190px,1.3fr) minmax(120px,.8fr)',
                        gap: 8,
                        alignItems: 'center',
                        padding: '7px 10px',
                        borderTop: '1px solid #edf1f5',
                        fontSize: 11,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(bulkInvitationSelection[row.trainerId])}
                        disabled={!row.selectable || bulkInvitationSending}
                        onChange={() => toggleBulkInvitation(row.trainerId)}
                        aria-label={`Inviter ${row.firstName} ${row.lastName}`}
                      />
                      <strong style={{ color: '#0f2747' }}>{row.firstName || '—'}</strong>
                      <strong style={{ color: '#0f2747' }}>{row.lastName || '—'}</strong>
                      <span style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.email || '—'}
                      </span>
                      <span
                        style={{
                          color: row.selectable
                            ? '#2563eb'
                            : row.sendResult?.status === 'failed'
                              ? '#b42318'
                              : '#64748b',
                          fontWeight: 700,
                        }}
                        title={row.sendResult?.message || ''}
                      >
                        {row.sendResult?.status === 'failed'
                          ? "Échec de l'envoi"
                          : row.situation}
                      </span>
                    </div>
                  ))}
                </div>

                {bulkInvitationError ? (
                  <div style={{ margin: '9px 10px 0', padding: '8px 9px', borderRadius: 7, background: '#fef2f2', border: '1px solid #fecaca', color: '#b42318', fontSize: 11 }}>
                    {bulkInvitationError}
                  </div>
                ) : null}

                <div style={{ padding: '0 10px 10px' }}>
                  <EmailCopyToSenderOption
                    checked={bulkInvitationCopyToSender}
                    onChange={setBulkInvitationCopyToSender}
                    disabled={bulkInvitationSending || selectedInvitationRows.length === 0}
                    multiple
                    compact
                  />
                </div>

                <div style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontSize: 10.5 }}>
                    {selectedInvitationRows.length} formateur(s) sélectionné(s)
                  </span>
                  <button
                    type="button"
                    className="button button--primary button--compact"
                    disabled={bulkInvitationSending || selectedInvitationRows.length === 0}
                    onClick={handleSendBulkInvitations}
                  >
                    {bulkInvitationSending
                      ? 'Envoi des invitations…'
                      : `Envoyer ${selectedInvitationRows.length} invitation(s)`}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
