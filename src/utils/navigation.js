// Explicit OF destinations are independent of an individual tab's remembered space.
// This selects the UI only: RequireOrganization and server permissions still apply.
export function isOrganizationPath(pathname) {
  return /^\/(?:missions(?:\/(?:edit\/)?[^/]+)?|listing|formateur\/(?:new|(?:view|edit)\/[^/]+)|formateurs\/(?:recherche|import)|planning|carte|parametres|decouvrir)\/?$/.test(pathname);
}
