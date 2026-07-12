// Generic shell page so every nav item routes to something real while A/C/D
// build their screens. Each teammate replaces the matching route in App.jsx.
export default function Placeholder({ title, owner }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
        <div className="text-4xl">🚧</div>
        <p className="mt-3 text-[var(--color-muted)]">
          {title} screen — owned by Person {owner}. Wire it to live API queries here.
        </p>
      </div>
    </div>
  );
}
