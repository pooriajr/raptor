import ActionSection from "./ActionSection";

const SCIENTIST_ACTIONS = [
  {
    name: "Move a scientist",
    description:
      "For one action point, move a scientist to an adjacent space that is not occupied by a raptor or another scientist.",
  },
  {
    name: "Stand a scientist back up",
    description:
      "For one action point, stand a frightened scientist's figurine back up. You cannot stand a scientist back up the same round it was frightened.",
  },
  {
    name: "Put a baby raptor to sleep",
    description:
      "For one action point, shoot a baby raptor located on a space adjacent to a scientist to put it to sleep.",
  },
  {
    name: "Capture a sleeping baby raptor",
    description:
      "For one action point, capture a sleeping baby raptor located on a space adjacent to a scientist; remove its figurine from the board.",
  },
  {
    name: "Shoot the mother raptor",
    description:
      "For one action point, use an active scientist to shoot the mother raptor. Scientists can shoot orthogonally in a straight line as far as desired, as long as there are no obstacles between the scientist and the mother raptor. Obstacles that block shooting are rocks and active scientists.",
  },
];

function ScientistActionsSlide() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col gap-4">
        <ActionSection
          variant="scientist"
          title="Scientist Actions"
          intro="You can spend action points to perform actions using any active scientist. A scientist is active if its figurine is standing up. Scientists can move through and shoot through fire, but you cannot end the turn with any scientist standing on a fire space."
          important="Each scientist can perform ONLY ONE aggressive action (shoot or capture) per round."
          actions={SCIENTIST_ACTIONS}
        />
      </div>
    </div>
  );
}

export default ScientistActionsSlide;
