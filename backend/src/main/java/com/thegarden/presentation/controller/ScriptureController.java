package com.thegarden.presentation.controller;

import com.thegarden.application.scripture.ScriptureApplicationService;
import com.thegarden.application.scripture.dto.BibleBookDto;
import com.thegarden.application.scripture.dto.BibleChapterDto;
import com.thegarden.application.scripture.dto.BibleVersionDto;
import com.thegarden.application.scripture.dto.ScriptureReferenceDto;
import com.thegarden.application.scripture.dto.ScriptureVerseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Scripture", description = "Proxies the YouVersion Platform API — the frontend never talks to YouVersion directly")
public class ScriptureController {

    private final ScriptureApplicationService scriptureService;

    public ScriptureController(ScriptureApplicationService scriptureService) {
        this.scriptureService = scriptureService;
    }

    @Operation(summary = "Get the text for a single scripture reference")
    @PostMapping("/api/scripture/verse")
    public ScriptureVerseDto getVerse(@Valid @RequestBody ScriptureReferenceDto reference) {
        return scriptureService.getVerse(reference);
    }

    @Operation(summary = "Get the text for multiple scripture references in one call")
    @PostMapping("/api/scripture/verses")
    public List<ScriptureVerseDto> getVerses(@Valid @RequestBody List<ScriptureReferenceDto> references) {
        return scriptureService.getVerses(references);
    }

    @Operation(summary = "List available Bible translations for the given language(s)")
    @GetMapping("/api/scripture/versions")
    public List<BibleVersionDto> listVersions(@RequestParam(defaultValue = "en") List<String> languages) {
        return scriptureService.listBibleVersions(languages);
    }

    @Operation(summary = "List books for a translation")
    @GetMapping("/api/scripture/books")
    public List<BibleBookDto> listBooks(@RequestParam String translationCode) {
        return scriptureService.listBooks(translationCode);
    }

    @Operation(summary = "List chapters for a book")
    @GetMapping("/api/scripture/chapters")
    public List<BibleChapterDto> listChapters(
            @RequestParam String translationCode, @RequestParam String bookName) {
        return scriptureService.listChapters(translationCode, bookName);
    }
}
