import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ActivityReport from '../../components/trainer/ActivityReport';
import { getRetainedReportMission } from '../../services/trainerActivityService';
export default function RetainedActivityReport() {
  const { id } = useParams(), { trainerProfile } = useAuth();
  const [mission, setMission] = useState(null), [error, setError] = useState('');
  useEffect(() => { let active = true; getRetainedReportMission(id, trainerProfile?.id).then(m => { if (active) setMission(m); }).catch(() => { if (active) setError('Bilan introuvable ou inaccessible.'); }); return () => { active = false; }; }, [id, trainerProfile?.id]);
  return <div className="page-container"><Link to="/formateur/statistiques">← Mes statistiques</Link><h1>Bilan conservé</h1><p>Les réalisations restent consultables après une modification de votre affectation.</p>{error && <p role="alert">{error}</p>}{mission && <ActivityReport key={id} mission={mission} origin={mission.origin} />}</div>;
}
