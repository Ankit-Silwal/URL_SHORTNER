"use client";

import { useState } from "react";
import { addRecent, clearRecent, useRecentLinks, type RecentLink } from "./recent-links";

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string };

export function Shortener() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [latest, setLatest] = useState<RecentLink | null>(null);
  const recent = useRecentLinks();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let target = url.trim();
    // Be forgiving: "example.com" -> "https://example.com".
    if (target && !/^https?:\/\//i.test(target)) target = `https://${target}`;

    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Something went wrong (${res.status})`);

      const link: RecentLink = {
        code: data.code,
        shortUrl: `${window.location.origin}/${data.code}`,
        url: target,
        createdAt: Date.now(),
      };
      setLatest(link);
      addRecent(link);
      setUrl("");
      setStatus({ kind: "idle" });
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Can't reach the server. Is the backend running?"
          : err instanceof Error
            ? err.message
            : "Something went wrong";
      setStatus({ kind: "error", message });
    }
  }

  const loading = status.kind === "loading";

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-line bg-card p-2 shadow-[0_10px_40px_-15px_rgba(120,70,30,0.35)]"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="url" className="sr-only">
            Long URL
          </label>
          <input
            id="url"
            type="text"
            inputMode="url"
            autoComplete="off"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/a/very/long/link"
            className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-base text-ink placeholder:text-ink-soft/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none disabled:opacity-60 dark:text-sand-50"
          >
            {loading ? "Shortening…" : "Shorten"}
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {status.kind === "error" && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {status.message}
          </p>
        )}
        {latest && status.kind !== "error" && <ResultCard link={latest} />}
      </div>

      {recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Your recent links</h2>
            <button
              onClick={clearRecent}
              className="text-xs text-ink-soft underline-offset-4 hover:text-accent hover:underline"
            >
              Clear
            </button>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card/70">
            {recent.map((link) => (
              <li key={link.code} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm font-medium text-accent hover:underline"
                  >
                    {link.shortUrl.replace(/^https?:\/\//, "")}
                  </a>
                  <p className="truncate text-xs text-ink-soft" title={link.url}>
                    {link.url}
                  </p>
                </div>
                <CopyButton text={link.shortUrl} small />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-soft">
            Saved in this browser only.
          </p>
        </section>
      )}
    </div>
  );
}

function ResultCard({ link }: { link: RecentLink }) {
  return (
    <div className="rounded-2xl border border-accent/30 bg-accent-soft/60 p-5">
      <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">Your short link</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={link.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate font-mono text-xl font-semibold text-accent hover:underline"
        >
          {link.shortUrl}
        </a>
        <CopyButton text={link.shortUrl} />
      </div>
      <p className="mt-2 truncate text-sm text-ink-soft" title={link.url}>
        → {link.url}
      </p>
    </div>
  );
}

function CopyButton({ text, small = false }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (e.g. non-HTTPS); the link is still visible to copy by hand.
    }
  }

  return (
    <button
      onClick={copy}
      className={`shrink-0 rounded-lg border border-line bg-card font-medium text-ink transition-colors hover:border-accent hover:text-accent ${
        small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      }`}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
