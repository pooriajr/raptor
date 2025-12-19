function ActionSection({
  title,
  intro,
  important,
  actions,
  variant,
}: {
  title: string;
  intro: string;
  important?: string;
  actions: { name: string; description: string }[];
  variant: "raptor" | "scientist";
}) {
  const borderColor = variant === "raptor" ? "border-[#2d5a27]/40" : "border-[#8a5a1a]/40";
  const titleColor = variant === "raptor" ? "text-[#90ee90]" : "text-[#ffb347]";

  return (
    <div className={`p-4 rounded-lg bg-white/[0.03] border ${borderColor}`}>
      <h3 className={`m-0 mb-3 text-xl ${titleColor}`}>{title}</h3>
      <p className="text-sm text-white/70 mb-3 leading-relaxed">{intro}</p>
      {important && <p className="text-sm text-[#ffd700] font-bold mb-3">{important}</p>}
      <ul className="m-0 pl-5 text-sm leading-relaxed space-y-2">
        {actions.map((action) => (
          <li key={action.name}>
            <strong className="text-white">{action.name}:</strong> {action.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

const RAPTOR_ACTIONS = [
  {
    name: "Move a baby raptor",
    description:
      "For one action point, move a baby raptor to a free adjacent space. If by doing so the baby is placed on one of the half-spaces of an L-shaped tile, it escapes; remove the figurine from the board.",
  },
  {
    name: "Move the mother raptor",
    description:
      "For one action point, move the mother raptor in a straight line as many spaces as you like, or until she runs into an obstacle (i.e. a rock, a fire token, or another figurine). If the mother is wounded: Before moving the mother raptor, lose as many action points as the number of sleep tokens on your player aid.",
  },
  {
    name: "Kill a scientist",
    description:
      "For one action point, kill a scientist located on a space adjacent to the mother raptor; remove the scientist figurine from the board and return it to the box. Only the mother can kill scientists.",
  },
  {
    name: "Wake up a baby raptor",
    description:
      "For one action point, wake up a sleeping baby raptor located on a space adjacent to the mother raptor. You cannot wake up a baby raptor the same round it was put to sleep by a scientist.",
  },
  {
    name: "Put out a fire",
    description:
      "For one action point, put out a fire located on a space adjacent to the mother raptor; remove the fire token and all fire tokens connected to it orthogonally.",
  },
];

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

function ActionPointsSlide() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col gap-4">
        <ActionSection
          variant="raptor"
          title="Raptor Actions"
          intro="You can spend action points to perform actions using the mother raptor and any active baby raptors. A baby raptor is active if its figurine is standing up. A raptor can never move to or move through a space occupied by a fire token."
          actions={RAPTOR_ACTIONS}
        />
        <ActionSection
          variant="scientist"
          title="Scientist Actions"
          intro="You can spend action points to perform actions using any active scientist. A scientist is active if its figurine is standing up. Scientists can move through and shoot through a space occupied by a fire token, but they cannot end their movement on a space occupied by a fire token."
          important="Each scientist can perform ONLY ONE aggressive action (shoot or capture) per round."
          actions={SCIENTIST_ACTIONS}
        />
      </div>
    </div>
  );
}

export default ActionPointsSlide;
