import type { ReactNode } from "react";

interface Props {
  kicker?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  compact?: boolean;
  minimal?: boolean;
}

export default function PageHero({ kicker, title, subtitle, children, compact = false, minimal = false }: Props) {
  const sectionPadding = minimal ? "py-16 md:py-20" : compact ? "py-16 md:py-24" : "py-16 md:py-24 lg:py-28";
  const gridClass = children
    ? minimal
      ? "lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)] lg:items-end"
      : "lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.82fr)] lg:items-end"
    : "mx-auto max-w-4xl text-center";

  return (
    <section className="page-hero">
      <div className={`hero-orb ${minimal ? "hero-orb--subtle" : "hero-orb--one"}`} />
      {!minimal ? <div className="hero-orb hero-orb--two" /> : null}
      <div className={`section-shell relative z-10 ${sectionPadding}`}>
        <div className={`grid gap-10 md:gap-12 ${gridClass}`}>
          <div className={children ? "max-w-3xl pt-2 md:pt-3" : ""}>
            {kicker ? (
              <div className={`section-kicker ${children ? "" : "mx-auto"} w-fit`}>
                {kicker}
              </div>
            ) : null}
            <h1
              className={`${kicker ? "mt-5" : ""} ${minimal ? "text-[2.5rem] md:text-5xl lg:text-[3.45rem]" : "text-[2.8rem] md:text-5xl lg:text-[4.25rem]"} font-bold leading-[1.05] text-[color:var(--text-primary)]`}
              style={{ letterSpacing: "-0.02em" }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                className={`mt-5 leading-relaxed text-[color:var(--text-secondary)] ${
                  children ? "max-w-[42rem] text-[1.02rem] md:text-[1.12rem]" : "mx-auto max-w-2xl text-base md:text-lg"
                }`}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          {children ? <div className="relative z-10 lg:justify-self-end lg:self-end">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
