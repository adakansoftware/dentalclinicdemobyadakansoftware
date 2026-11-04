interface Props {
  stars: number;
}

export default function StarRating({ stars }: Props) {
  return (
    <div className="flex gap-1 text-[color:var(--accent-main)]" aria-label={`${stars}/5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`h-4 w-4 ${star <= stars ? "opacity-100" : "opacity-25"}`}
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}
