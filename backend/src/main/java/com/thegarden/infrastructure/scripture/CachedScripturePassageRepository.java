package com.thegarden.infrastructure.scripture;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CachedScripturePassageRepository extends JpaRepository<CachedScripturePassage, String> {
}
