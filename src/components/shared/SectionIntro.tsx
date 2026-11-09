interface Props {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export default function SectionIntro({ title, subtitle, align = "left" }: Props) {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`section-heading-wrap flex flex-col gap-3 ${alignment}`}>
      <div className="max-w-3xl">
        <h2 className="section-title">{title}</h2>
        {subtitle ? <p className={`section-subtitle mt-4 ${align === "center" ? "mx-auto" : ""}`}>{subtitle}</p> : null}
      </div>
    </div>
  );
}
