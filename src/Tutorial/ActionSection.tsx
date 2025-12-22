import type { ReactNode } from "react";

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
  actions: { name: string; description: string; visual?: ReactNode }[];
  variant: "raptor" | "scientist";
}) {
  const borderColor = variant === "raptor" ? "border-[#2d5a27]/40" : "border-[#8a5a1a]/40";
  const titleColor = variant === "raptor" ? "text-[#90ee90]" : "text-[#ffb347]";

  return (
    <div className={`rounded-lg border bg-white/3 p-4 ${borderColor}`}>
      <h3 className={`m-0 mb-3 text-xl ${titleColor}`}>{title}</h3>
      <p className="mb-3 text-sm leading-relaxed text-white/70">{intro}</p>
      {important && <p className="mb-3 text-sm font-bold text-[#ffd700]">{important}</p>}
      <ul className="m-0 space-y-2 pl-5 text-sm leading-relaxed">
        {actions.map((action) => (
          <li key={action.name}>
            <strong className="text-white">{action.name}:</strong> {action.description}
            {action.visual && <div className="mt-3">{action.visual}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ActionSection;
