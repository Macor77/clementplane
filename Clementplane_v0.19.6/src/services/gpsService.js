import { geocodeTrainer, hasValidCoords, sleep } from "./geocodingService";
import { updateFormateurGps } from "./formateursService";

export async function completeMissingGps({
  formateurs,
  onProgress,
  onCoordsFound,
}) {
  const missing = formateurs.filter(
    (formateur) => !hasValidCoords(formateur.latitude, formateur.longitude)
  );

  let updatedCount = 0;
  let notFoundCount = 0;
  const notFound = [];

  for (let i = 0; i < missing.length; i += 1) {
    const formateur = missing[i];

    onProgress?.(
      `Géocodage en cours : ${i + 1} / ${missing.length} — ${
        formateur.prenom || ""
      } ${formateur.nom || ""}`
    );

    try {
      const coords = await geocodeTrainer(formateur);

      if (!coords || !hasValidCoords(coords.latitude, coords.longitude)) {
        notFoundCount += 1;
        notFound.push(`${formateur.prenom || ""} ${formateur.nom || ""}`.trim());
      } else {
        await updateFormateurGps(formateur.id, coords.latitude, coords.longitude);

        updatedCount += 1;
        onCoordsFound?.(formateur.id, coords);
      }
    } catch (error) {
      console.error("Erreur géocodage ou MAJ GPS :", formateur, error);
      notFoundCount += 1;
      notFound.push(`${formateur.prenom || ""} ${formateur.nom || ""}`.trim());
    }

    await sleep(1100);
  }

  return {
    missingCount: missing.length,
    updatedCount,
    notFoundCount,
    notFound,
  };
}