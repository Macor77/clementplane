import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { isMobileNavigationCloseKey } from '../../utils/mobileNavigation';

export default function MobileNavigation({
  spaceLabel,
  navigationItems,
  footer,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const drawerId = useId();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (isMobileNavigationCloseKey(event.key)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <header className="mobile-navigation__header">
        <img
          className="mobile-navigation__brand"
          src="/brand/formaplane-logo.svg"
          alt="Formaplane"
        />

        <div className="mobile-navigation__header-actions">
          <span className="mobile-navigation__space-label">
            {spaceLabel}
          </span>

          <button
            type="button"
            className="mobile-navigation__menu-button"
            aria-label="Ouvrir le menu"
            aria-expanded={isOpen}
            aria-controls={drawerId}
            onClick={() => setIsOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </header>

      {isOpen && (
        <div className="mobile-navigation__layer">
          <button
            type="button"
            className="mobile-navigation__overlay"
            aria-label="Fermer le menu"
            onClick={() => setIsOpen(false)}
          />

          <aside
            id={drawerId}
            className="mobile-navigation__drawer"
            aria-label={`Navigation ${spaceLabel}`}
          >
            <div className="mobile-navigation__drawer-header">
              <img
                className="mobile-navigation__drawer-brand"
                src="/brand/formaplane-logo-light.svg"
                alt="Formaplane"
              />

              <button
                type="button"
                className="mobile-navigation__close-button"
                aria-label="Fermer le menu"
                onClick={() => setIsOpen(false)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="mobile-navigation__drawer-space">
              {spaceLabel}
            </div>

            <nav
              className="app-nav mobile-navigation__nav"
              aria-label={`Navigation ${spaceLabel}`}
            >
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `app-nav__link${
                      isActive ? ' app-nav__link--active' : ''
                    }`
                  }
                >
                  <span className="app-nav__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mobile-navigation__footer">
              {footer}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
