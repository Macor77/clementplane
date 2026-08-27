import PlanningCell from './PlanningCell';
import {
  getISODate,
  planningGridStyle,
} from './planningUtils';

export default function PlanningRow({
  days,
  planningDate,
  monthLabel,
  fullName,
  trainerPlanning,
  planningLoading,
}) {
  return (
    <div className="listing-planning-grid" style={planningGridStyle(days.length)}>
      {days.map((day) => {
        const isoDate = getISODate(planningDate, day);

        return (
          <PlanningCell
            key={day}
            day={day}
            planningDate={planningDate}
            monthLabel={monthLabel}
            fullName={fullName}
            availability={trainerPlanning[isoDate]}
            planningLoading={planningLoading}
          />
        );
      })}
    </div>
  );
}
