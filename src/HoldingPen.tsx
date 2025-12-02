import "./HoldingPen.css";
import type { Piece } from "./pieces/Piece.ts";

interface HoldingPenProps {
  pieces: Piece[];
  onDragStart: (pieceId: string) => void;
  onDragEnd: () => void;
  onPieceClick: (pieceId: string) => void;
}

function HoldingPen({
  pieces,
  onDragStart,
  onDragEnd,
  onPieceClick,
}: HoldingPenProps) {
  return (
    <div className="HoldingPen">
      <h3>Available Pieces</h3>
      <div className="pen-section">
        <h4>Raptors</h4>
        <div className="piece-container">
          {pieces
            .filter(
              (p) =>
                p.constructor.name === "MotherRaptor" ||
                p.constructor.name === "BabyRaptor",
            )
            .map((piece) => (
              <span
                key={piece.id}
                className="holding-piece"
                draggable
                onDragStart={() => onDragStart(piece.id)}
                onDragEnd={onDragEnd}
                onClick={() => onPieceClick(piece.id)}
              >
                {piece.getEmoji()}
              </span>
            ))}
        </div>
      </div>
      <div className="pen-section">
        <h4>Scientists</h4>
        <div className="piece-container">
          {pieces
            .filter((p) => p.constructor.name === "Scientist")
            .map((piece) => (
              <span
                key={piece.id}
                className="holding-piece"
                draggable
                onDragStart={() => onDragStart(piece.id)}
                onDragEnd={onDragEnd}
                onClick={() => onPieceClick(piece.id)}
              >
                {piece.getEmoji()}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

export default HoldingPen;
