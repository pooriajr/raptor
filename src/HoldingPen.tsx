import "./HoldingPen.css";
import type {
  HoldingPen as HoldingPenState,
  PieceType,
} from "./types/gameState.ts";
import { getPieceEmoji } from "./utils/pieceUtils.ts";

interface HoldingPenProps {
  holdingPen: HoldingPenState;
  onDragStart: (pieceType: PieceType) => void;
  onDragEnd: () => void;
}

function HoldingPen({ holdingPen, onDragStart, onDragEnd }: HoldingPenProps) {
  // Create arrays of draggable items based on counts
  const motherItems = Array(holdingPen.mother).fill("mother" as PieceType);
  const babyItems = Array(holdingPen.babies).fill("baby" as PieceType);
  const scientistItems = Array(holdingPen.scientists).fill(
    "scientist" as PieceType,
  );

  return (
    <div className="HoldingPen">
      <h3>Available Pieces</h3>
      <div className="pen-section">
        <h4>Raptors</h4>
        <div className="piece-container">
          {motherItems.map((type, index) => (
            <span
              key={`mother-${index}`}
              className="holding-piece"
              draggable
              onDragStart={() => onDragStart(type)}
              onDragEnd={onDragEnd}
            >
              {getPieceEmoji(type)}
            </span>
          ))}
          {babyItems.map((type, index) => (
            <span
              key={`baby-${index}`}
              className="holding-piece"
              draggable
              onDragStart={() => onDragStart(type)}
              onDragEnd={onDragEnd}
            >
              {getPieceEmoji(type)}
            </span>
          ))}
        </div>
      </div>
      <div className="pen-section">
        <h4>Scientists</h4>
        <div className="piece-container">
          {scientistItems.map((type, index) => (
            <span
              key={`scientist-${index}`}
              className="holding-piece"
              draggable
              onDragStart={() => onDragStart(type)}
              onDragEnd={onDragEnd}
            >
              {getPieceEmoji(type)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HoldingPen;
