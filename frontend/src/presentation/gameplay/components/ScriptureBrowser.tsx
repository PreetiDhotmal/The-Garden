import { useState } from "react";
import type { ScriptureReference, ScriptureVerse } from "@the-garden/shared-types";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { formatReference, referenceKey } from "@/domain/gameplay/scripture/ScriptureFormatter";
import type { ScriptureCollection } from "@/domain/gameplay/scripture/ScriptureCollection";
import { VerseReader } from "./VerseReader";
import { BookSelector } from "./BookSelector";
import { ChapterSelector } from "./ChapterSelector";
import { ScriptureSearchPanel } from "./ScriptureSearchPanel";
import { ReadingHistoryPanel } from "./ReadingHistoryPanel";
import { BookmarksPanel } from "./BookmarksPanel";
import { LoadingIndicator } from "./scripture/LoadingIndicator";
import { ErrorMessage } from "./scripture/ErrorMessage";

type Tab = "collections" | "browse" | "search" | "history" | "saved";
type BrowseStep = { readonly kind: "book" } | { readonly kind: "chapter"; readonly bookName: string };

const DEFAULT_TRANSLATION = "NIV";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "collections", label: "Collections" },
  { id: "browse", label: "Browse" },
  { id: "search", label: "Search" },
  { id: "history", label: "History" },
  { id: "saved", label: "Saved" },
];

export function ScriptureBrowser({ onClose }: { readonly onClose: () => void }) {
  const { scriptureRepository } = useGameplay();
  const [tab, setTab] = useState<Tab>("collections");
  const [activeReference, setActiveReference] = useState<ScriptureReference | null>(null);
  const [browseStep, setBrowseStep] = useState<BrowseStep>({ kind: "book" });
  const [collections, setCollections] = useState<readonly ScriptureCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);

  const loadCollections = () => {
    setCollectionsLoading(true);
    setCollectionsError(null);
    scriptureRepository
      .listCollections()
      .then(setCollections)
      .catch(() => {
        setCollectionsError("Could not load scripture collections.");
      })
      .finally(() => {
        setCollectionsLoading(false);
      });
  };

  const selectVerse = (verse: ScriptureVerse) => {
    setActiveReference(verse.reference);
  };

  const closeVerse = () => {
    setActiveReference(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-garden-700 bg-shadow-valley text-light-divine">
        <div className="flex items-center justify-between border-b border-garden-700 px-6 py-4">
          <h2 className="font-[var(--font-display)] text-xl">Scripture</h2>
          <button type="button" onClick={onClose} className="text-garden-300 hover:text-light-divine">
            Close
          </button>
        </div>

        {!activeReference && (
          <div className="flex gap-1 border-b border-garden-700 px-4 pt-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  if (t.id === "collections" && collections.length === 0) {
                    loadCollections();
                  }
                  if (t.id === "browse") {
                    setBrowseStep({ kind: "book" });
                  }
                }}
                className={`rounded-t px-3 py-1.5 text-xs ${
                  tab === t.id
                    ? "border-b-2 border-garden-500 font-semibold text-light-divine"
                    : "text-garden-300 hover:text-light-divine"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto p-6">
          {activeReference ? (
            <VerseReader reference={activeReference} onBack={closeVerse} />
          ) : (
            <>
              {tab === "collections" && (
                <div className="flex flex-col gap-3">
                  {collectionsLoading && <LoadingIndicator label="Loading collections…" />}
                  {collectionsError && (
                    <ErrorMessage message={collectionsError} onRetry={loadCollections} />
                  )}
                  {!collectionsLoading &&
                    !collectionsError &&
                    collections.map((collection) => (
                      <div key={collection.id}>
                        <h3 className="mb-1 text-sm font-semibold text-garden-300">{collection.title}</h3>
                        <ul className="flex flex-col gap-1">
                          {collection.references.map((reference) => (
                            <li key={referenceKey(reference)}>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReference(reference);
                                }}
                                className="w-full rounded border border-garden-700 px-3 py-1.5 text-left text-sm hover:border-garden-500"
                              >
                                {formatReference(reference)} ({reference.translationCode})
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              )}

              {tab === "browse" && browseStep.kind === "book" && (
                <BookSelector
                  onSelect={(bookName) => {
                    setBrowseStep({ kind: "chapter", bookName });
                  }}
                />
              )}
              {tab === "browse" && browseStep.kind === "chapter" && (
                <ChapterSelector
                  bookName={browseStep.bookName}
                  translationCode={DEFAULT_TRANSLATION}
                  onBack={() => {
                    setBrowseStep({ kind: "book" });
                  }}
                  onSelect={(chapterNumber) => {
                    setActiveReference({
                      bookName: browseStep.bookName,
                      chapter: chapterNumber,
                      verseStart: 1,
                      verseEnd: null,
                      translationCode: DEFAULT_TRANSLATION,
                    });
                  }}
                />
              )}

              {tab === "search" && <ScriptureSearchPanel onSelectVerse={selectVerse} />}
              {tab === "history" && <ReadingHistoryPanel onSelectVerse={selectVerse} />}
              {tab === "saved" && <BookmarksPanel onSelectVerse={selectVerse} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
