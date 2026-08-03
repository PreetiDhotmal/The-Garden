import { BIBLE_BOOK_NAMES } from "@/domain/gameplay/scripture/BibleBookNames";

export interface BookSelectorProps {
  readonly onSelect: (bookName: string) => void;
}

export function BookSelector({ onSelect }: BookSelectorProps) {
  const oldTestament = BIBLE_BOOK_NAMES.filter((book) => book.testament === "OLD");
  const newTestament = BIBLE_BOOK_NAMES.filter((book) => book.testament === "NEW");

  return (
    <div className="flex flex-col gap-4">
      {[
        { label: "Old Testament", books: oldTestament },
        { label: "New Testament", books: newTestament },
      ].map((group) => (
        <div key={group.label}>
          <h3 className="mb-1 text-sm font-semibold text-garden-300">{group.label}</h3>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {group.books.map((book) => (
              <button
                key={book.name}
                type="button"
                onClick={() => {
                  onSelect(book.name);
                }}
                className="rounded border border-garden-700 px-2 py-1 text-left text-xs hover:border-garden-500"
              >
                {book.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
