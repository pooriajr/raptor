import "../Piece.css";

// Space with permanent visible tooltip
function TooltipSpace({
  children,
  tooltip,
  className,
  tooltipPosition = "top",
}: {
  children?: React.ReactNode;
  tooltip: string;
  className: string;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <div className={`${className} has-tooltip`}>
      {children}
      <div className={`space-tooltip ${tooltipPosition}`}>{tooltip}</div>
    </div>
  );
}

// Full game board for tutorial - same size as actual game
function GameBoardFull() {
  return (
    <div className="tutorial-game-board-full">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <clipPath id="tutorial-exit-right" clipPathUnits="objectBoundingBox">
            <path d="M0.12,0 L0.65,0 L1,0.5 L0.65,1 L0.12,1 Q0,1 0,0.88 L0,0.12 Q0,0 0.12,0" />
          </clipPath>
          <clipPath id="tutorial-exit-left" clipPathUnits="objectBoundingBox">
            <path d="M0.88,0 L0.35,0 L0,0.5 L0.35,1 L0.88,1 Q1,1 1,0.88 L1,0.12 Q1,0 0.88,0" />
          </clipPath>
        </defs>
      </svg>

      {/* Row 1 */}
      <div className="board-full-row">
        {/* L-tile left (exit bottom/center) */}
        <div className="full-tile l-tile left">
          <div className="full-l-exit-col">
            <div className="full-space-placeholder" />
            <div className="full-space-placeholder" />
            <TooltipSpace
              className="full-space exit left"
              tooltip="Baby raptors escape via 4 exit spaces"
              tooltipPosition="top"
            />
          </div>
          <div className="full-l-main-col">
            <div className="full-space" />
            <div className="full-space" />
            <div className="full-space">
              <span>🦎</span>
            </div>
          </div>
        </div>

        {/* Square tile 1 */}
        <div className="full-tile square">
          <div className="full-space" />
          <TooltipSpace
            className="full-space mountain"
            tooltip="Mountains blocks movement and line of sight"
            tooltipPosition="top"
          >
            <span>⛰️</span>
          </TooltipSpace>
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space">
            <span>🧑‍🔬</span>
          </div>
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
          <div className="full-space" />
        </div>

        {/* Square tile 2 */}
        <div className="full-tile square">
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space">
            <span>🦎</span>
          </div>
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
        </div>

        {/* Square tile 3 */}
        <div className="full-tile square">
          <div className="full-space" />
          <div className="full-space" />
          <TooltipSpace className="full-space" tooltip="Babies try to escape via exits" tooltipPosition="top">
            <span>🦎</span>
          </TooltipSpace>
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space">
            <span>🧑‍🔬</span>
          </div>
          <TooltipSpace
            className="full-space fire"
            tooltip="Scientists set fires to blocks raptors"
            tooltipPosition="bottom"
          >
            <span>🔥</span>
          </TooltipSpace>
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
        </div>

        {/* L-tile right (exit top) */}
        <div className="full-tile l-tile right">
          <div className="full-l-main-col">
            <div className="full-space fire">
              <span>🔥</span>
            </div>
            <div className="full-space fire">
              <span>🔥</span>
            </div>
            <div className="full-space" />
          </div>
          <div className="full-l-exit-col">
            <div className="full-space exit right" />
            <div className="full-space-placeholder" />
            <div className="full-space-placeholder" />
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="board-full-row">
        {/* L-tile left (exit top/center) */}
        <div className="full-tile l-tile left">
          <div className="full-l-exit-col">
            <div className="full-space exit left" />
            <div className="full-space-placeholder" />
            <div className="full-space-placeholder" />
          </div>
          <div className="full-l-main-col">
            <div className="full-space" />
            <div className="full-space" />
            <div className="full-space" />
          </div>
        </div>

        {/* Square tile 4 */}
        <div className="full-tile square">
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <TooltipSpace
            className="full-space"
            tooltip="Sleeping babies are vulnerable to capture"
            tooltipPosition="left"
          >
            <span className="piece asleep">
              🦎<span className="status-icon">😴</span>
            </span>
          </TooltipSpace>
          <TooltipSpace
            className="full-space"
            tooltip="Scientists work together to capture babies"
            tooltipPosition="bottom"
          >
            <span>🧑‍🔬</span>
          </TooltipSpace>
          <TooltipSpace className="full-space" tooltip="Mother kills scientists and saves babies" tooltipPosition="top">
            <span className="mother-piece">🦖</span>
          </TooltipSpace>
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
        </div>

        {/* Square tile 5 */}
        <div className="full-tile square">
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space">
            <span>🧑‍🔬</span>
          </div>
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
        </div>

        {/* Square tile 6 */}
        <div className="full-tile square">
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space">
            <span>🦎</span>
          </div>
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
          <div className="full-space" />
        </div>

        {/* L-tile right (exit bottom) */}
        <div className="full-tile l-tile right">
          <div className="full-l-main-col">
            <div className="full-space" />
            <div className="full-space" />
            <div className="full-space">
              <span>🧑‍🔬</span>
            </div>
          </div>
          <div className="full-l-exit-col">
            <div className="full-space-placeholder" />
            <div className="full-space-placeholder" />
            <div className="full-space exit right" />
          </div>
        </div>
      </div>
    </div>
  );
}

function GameElementsSlide() {
  return (
    <div className="slide-content board-overview-full">
      <GameBoardFull />
    </div>
  );
}

export default GameElementsSlide;
