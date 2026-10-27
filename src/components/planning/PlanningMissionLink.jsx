import { Link } from 'react-router-dom';

// Keep the day preview on a plain click. All other gestures belong to the browser.
export default function PlanningMissionLink({ onPreview, children, ...props }) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        event.stopPropagation();
        if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onPreview(event);
      }}
    >
      {children}
    </Link>
  );
}
