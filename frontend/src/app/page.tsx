import { Shortener } from "./shortener";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-16 sm:py-24">
      <header className="mb-10 text-center">
        <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-medium tracking-wide text-accent uppercase">
          Shortly
        </span>
        <h1 className="mt-4 font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
          Long links, made <em className="text-accent">cozy</em>.
        </h1>
        <p className="mt-3 text-ink-soft">
          Paste a URL and get a short link you can share anywhere.
        </p>
      </header>

      <Shortener />

      <footer className="mt-auto pt-16 text-center text-xs text-ink-soft">
        Built step by step — Express + Next.js
      </footer>
    </main>
  );
}
