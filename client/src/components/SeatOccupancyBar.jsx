// SeatOccupancyBar — colored progress bar based on occupancy %
const SeatOccupancyBar = ({ current, capacity, showText = true }) => {
  const pct = capacity > 0 ? Math.round((current / capacity) * 100) : 0;

  const color =
    pct < 60 ? 'bg-secondary' :
    pct < 90 ? 'bg-tertiary' :
               'bg-error';

  const textColor =
    pct < 60 ? 'text-secondary' :
    pct < 90 ? 'text-tertiary' :
               'text-error';

  const label =
    pct < 60 ? 'Available' :
    pct < 90 ? 'Moderate' :
               'Full';

  return (
    <div className="space-y-1">
      {showText && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-on-surface-variant">Occupancy</span>
          <span className={`font-bold ${textColor}`}>
            {current}/{capacity} seats · {label}
          </span>
        </div>
      )}
      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default SeatOccupancyBar;
