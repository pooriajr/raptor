import type { ReactNode } from "react";

function ActionSection({
  intro,
  important,
  actions,
}: {
  intro: string;
  important?: string;
  actions: { name: string; description: string; visual?: ReactNode }[];
}) {
  return (
    <>
      <p className="mb-3 text-sm leading-relaxed text-white/70">{intro}</p>
      {important && <p className="mb-3 text-sm font-bold text-[#ffd700]">{important}</p>}
      <ul className="m-0 space-y-2 text-sm leading-relaxed">
        {actions.map((action) => (
          <li key={action.name}>
            <strong className="text-white">{action.name}:</strong> {action.description}
            {action.visual && <div className="mt-3">{action.visual}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}

export default ActionSection;
