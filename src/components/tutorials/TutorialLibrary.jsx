import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import './TutorialLibrary.css';

function TutorialCard({ tutorial, onOpen }) {
  return (
    <article className="tutorial-card">
      <button className="tutorial-card__open" type="button" onClick={(event) => onOpen(tutorial, event.currentTarget)}>
        <span className="tutorial-card__visual">
          <img src={tutorial.steps[0].image} alt="" loading="lazy" />
          <span className="tutorial-card__steps">{tutorial.steps.length} étapes</span>
        </span>
        <span className="tutorial-card__body">
          <span className="tutorial-card__meta">
            <span>{tutorial.category}</span>
            <span>{tutorial.duration}</span>
          </span>
          <strong>{tutorial.title}</strong>
          <span className="tutorial-card__introduction">{tutorial.introduction}</span>
          <span className="tutorial-card__action">Voir le tutoriel <span aria-hidden="true">→</span></span>
        </span>
      </button>
    </article>
  );
}

function TutorialCarousel({ tutorial, onClose, onEvent, returnFocusRef }) {
  const [activeStep, setActiveStep] = useState(0);
  const panelRef = useRef(null);
  const step = tutorial.steps[activeStep];
  const isFirst = activeStep === 0;
  const isLast = activeStep === tutorial.steps.length - 1;

  const changeStep = useCallback((nextStep) => {
    setActiveStep(nextStep);
    onEvent?.('step', tutorial, nextStep);
  }, [onEvent, tutorial]);

  const moveStep = useCallback((direction) => {
    const nextStep = Math.min(
      tutorial.steps.length - 1,
      Math.max(0, activeStep + direction),
    );
    if (nextStep !== activeStep) changeStep(nextStep);
  }, [activeStep, changeStep, tutorial.steps.length]);
  const moveStepRef = useRef(moveStep);

  useEffect(() => {
    moveStepRef.current = moveStep;
  }, [moveStep]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const returnFocusElement = returnFocusRef.current;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('.tutorial-carousel__close')?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') moveStepRef.current(-1);
      if (event.key === 'ArrowRight') moveStepRef.current(1);

      if (event.key === 'Tab') {
        const focusableElements = [...(panelRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [])];
        if (!focusableElements.length) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements.at(-1);

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      returnFocusElement?.focus();
    };
  }, [onClose, returnFocusRef]);

  return (
    <div className="tutorial-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} className="tutorial-carousel" role="dialog" aria-modal="true" aria-labelledby={`tutorial-${tutorial.id}-title`}>
        <header className="tutorial-carousel__header">
          <div>
            <span className="tutorial-carousel__category">{tutorial.category}</span>
            <h2 id={`tutorial-${tutorial.id}-title`}>{tutorial.title}</h2>
          </div>
          <div className="tutorial-carousel__header-actions">
            <a href={tutorial.pdf} className="tutorial-carousel__pdf" target="_blank" rel="noreferrer" onClick={() => onEvent?.('download', tutorial, activeStep)}>
              Télécharger le PDF
            </a>
            <button className="tutorial-carousel__close" type="button" aria-label="Fermer le tutoriel" onClick={onClose}>×</button>
          </div>
        </header>

        <div className="tutorial-carousel__progress" aria-label={`Étape ${activeStep + 1} sur ${tutorial.steps.length}`}>
          {tutorial.steps.map((item, index) => (
            <button
              className={index === activeStep ? 'tutorial-carousel__dot tutorial-carousel__dot--active' : 'tutorial-carousel__dot'}
              type="button"
              key={`${tutorial.id}-${item.title}`}
              onClick={() => changeStep(index)}
              aria-label={`Afficher l’étape ${index + 1} : ${item.title}`}
              aria-current={index === activeStep ? 'step' : undefined}
            />
          ))}
        </div>

        <div className="tutorial-carousel__content">
          <figure className="tutorial-carousel__image">
            <img src={step.image} alt={`Interface Clementplane — ${step.title}`} />
          </figure>
          <div className="tutorial-carousel__copy">
            <span className="tutorial-carousel__counter">Étape {activeStep + 1} sur {tutorial.steps.length}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            <div className="tutorial-carousel__consequence">
              <strong>Ce qui se passe ensuite</strong>
              <p>{step.consequence}</p>
            </div>
          </div>
        </div>

        <footer className="tutorial-carousel__footer">
          <button type="button" className="tutorial-carousel__previous" disabled={isFirst} onClick={() => changeStep(activeStep - 1)}>
            Étape précédente
          </button>
          <span>{activeStep + 1} / {tutorial.steps.length}</span>
          {isLast ? (
            <button type="button" className="tutorial-carousel__next" onClick={() => { onEvent?.('complete', tutorial, activeStep); onClose(); }}>
              Terminer le tutoriel
            </button>
          ) : (
            <button type="button" className="tutorial-carousel__next" onClick={() => changeStep(activeStep + 1)}>
              Étape suivante
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

export default function TutorialLibrary({ tutorials, onEvent, compact = false }) {
  const [activeTutorial, setActiveTutorial] = useState(null);
  const openerRef = useRef(null);
  const categories = useMemo(() => [...new Set(tutorials.map((tutorial) => tutorial.category))], [tutorials]);
  const [activeCategory, setActiveCategory] = useState('Tous');

  const visibleTutorials = activeCategory === 'Tous'
    ? tutorials
    : tutorials.filter((tutorial) => tutorial.category === activeCategory);

  const openTutorial = (tutorial, trigger) => {
    openerRef.current = trigger;
    setActiveTutorial(tutorial);
    onEvent?.('open', tutorial, 0);
  };

  return (
    <div className={compact ? 'tutorial-library tutorial-library--compact' : 'tutorial-library'}>
      {!compact && categories.length > 1 && (
        <div className="tutorial-library__filters" aria-label="Filtrer les tutoriels">
          {['Tous', ...categories].map((category) => (
            <button
              type="button"
              key={category}
              className={category === activeCategory ? 'tutorial-library__filter tutorial-library__filter--active' : 'tutorial-library__filter'}
              onClick={() => setActiveCategory(category)}
              aria-pressed={category === activeCategory}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="tutorial-library__grid">
        {visibleTutorials.map((tutorial) => (
          <TutorialCard tutorial={tutorial} onOpen={openTutorial} key={tutorial.id} />
        ))}
      </div>

      {activeTutorial && (
        <TutorialCarousel
          tutorial={activeTutorial}
          onClose={() => setActiveTutorial(null)}
          onEvent={onEvent}
          returnFocusRef={openerRef}
        />
      )}
    </div>
  );
}
