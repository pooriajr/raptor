import "./DoneButton.css";

interface DoneButtonProps {
  disabled?: boolean;
  onClick: () => void;
  isDone?: boolean;
}

function DoneButton({ disabled = false, onClick, isDone = false }: DoneButtonProps) {
  const className = `done-button ${isDone ? "done-button--done" : disabled ? "done-button--disabled" : "done-button--ready"}`;

  return (
    <button className={className} disabled={disabled || isDone} onClick={onClick}>
      <span className="done-button__edge" />
      <span className="done-button__front">{isDone ? "✓" : "Done"}</span>
    </button>
  );
}

export default DoneButton;
