import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}

export default function ContactCard({ icon, label, value, href }: Props) {
  const body = (
    <div className="contact-line">
      <span className="icon-chip">{icon}</span>
      <span className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">{label}</span>
        <span className="font-bold text-[color:var(--text-primary)]">{value}</span>
      </span>
    </div>
  );

  return href ? (
    <a href={href} className="transition-transform duration-300 hover:-translate-y-0.5">
      {body}
    </a>
  ) : (
    body
  );
}
