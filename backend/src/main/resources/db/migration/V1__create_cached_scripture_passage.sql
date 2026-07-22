CREATE TABLE cached_scripture_passage (
    cache_key        VARCHAR(64) PRIMARY KEY,
    bible_id         INTEGER NOT NULL,
    passage_id       VARCHAR(32) NOT NULL,
    content          TEXT NOT NULL,
    copyright_notice TEXT,
    cached_at        TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_cached_scripture_passage_bible_id ON cached_scripture_passage (bible_id);
CREATE INDEX idx_cached_scripture_passage_cached_at ON cached_scripture_passage (cached_at);
