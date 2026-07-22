import { useEffect, useState } from "react";
import type { ScriptureVerse } from "@the-garden/shared-types";
import { formatReference, referenceKey } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { ClientSideScriptureSearch } from "@/infrastructure/gameplay/scripture/ClientSideScriptureSearch";
import { LoadingIndicator } from "./scripture/LoadingIndicator";

const search = new ClientSideScriptureSearch();

export interface ScriptureSearchPanelProps {
  readonly onSelectVerse: (verse: ScriptureVerse) => void;
}

export function ScriptureSearchPanel({ onSelectVerse }: ScriptureSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly ScriptureVerse[]>([]);
  const [bookMatches, setBookMatches] = useState<readonly string[]>([]);
  const [recentSearches, setRecentSearches] = useState<readonly string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    search
      .getRecentSearches()
      .then(setRecentSearches)
      .catch(() => {
        // Best-effort: recent searches are a convenience, not critical.
      });
  }, []);

  const runSearch = (text: string) => {
    setQuery(text);
    setBookMatches(search.searchBookNames(text));
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    search
      .search({ text, translationCode: "NIV" })
      .then(setResults)
      .catch(() => {
        setResults([]);
      })
      .finally(() => {
        setIsSearching(false);
        search
          .getRecentSearches()
          .then(setRecentSearches)
          .catch(() => {
            // Best-effort, as above.
          });
      });
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={query}
        onChange={(event) => {
          runSearch(event.target.value);
        }}
        placeholder="Search cached scripture or book names…"
        className="rounded border border-garden-700 bg-black/40 px-3 py-1.5 text-sm text-light-divine placeholder:text-garden-700"
      />

      {isSearching && <LoadingIndicator label="Searching…" />}

      {!query && recentSearches.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-semibold text-garden-300">Recent Searches</h4>
          <div className="flex flex-wrap gap-1">
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  runSearch(term);
                }}
                className="rounded-full border border-garden-700 px-2 py-0.5 text-xs text-garden-300 hover:text-light-divine"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {bookMatches.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-semibold text-garden-300">Books</h4>
          <div className="flex flex-wrap gap-1">
            {bookMatches.map((name) => (
              <span key={name} className="rounded-full border border-garden-700 px-2 py-0.5 text-xs">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-semibold text-garden-300">Cached Verses</h4>
          <ul className="flex flex-col gap-1">
            {results.map((verse) => (
              <li key={referenceKey(verse.reference)}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectVerse(verse);
                  }}
                  className="w-full rounded border border-garden-700 p-2 text-left text-xs hover:border-garden-500"
                >
                  <div className="text-garden-300">{formatReference(verse.reference)}</div>
                  <div className="mt-0.5 line-clamp-2 italic">{verse.text}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {query && !isSearching && results.length === 0 && bookMatches.length === 0 && (
        <p className="text-sm text-garden-300">
          No matches in cached scripture. Only verses you&apos;ve already read are searchable offline.
        </p>
      )}
    </div>
  );
}
