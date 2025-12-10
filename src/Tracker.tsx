import "./Tracker.css";

interface TrackerProps {
  label: string;
  emoji: string;
  current: number;
  max: number;
}

function Tracker({ label, emoji, current, max }: TrackerProps) {
  return (
    <div className="tracker">
      <span className="tracker-label">{label}:</span>
      <span className="tracker-pips">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className={`tracker-pip ${i < current ? "filled" : "empty"}`}>
            {emoji}
          </span>
        ))}
      </span>
    </div>
  );
}

export default Tracker;
