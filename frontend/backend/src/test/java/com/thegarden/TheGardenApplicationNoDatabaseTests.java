package com.thegarden;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Loads the full application context with NO datasource configured
 * and no active Spring profile that would supply one (deliberately no
 * {@code @ActiveProfiles} here — the base/default application.yml IS
 * the "no database" configuration this test verifies). If
 * DataSourceAutoConfiguration/HibernateJpaAutoConfiguration/
 * FlywayAutoConfiguration/DataJpaRepositoriesAutoConfiguration were
 * not correctly excluded, this test would fail with "Failed to
 * configure a DataSource: 'url' attribute is not specified."
 *
 * The App Key properties are supplied here via test properties only
 * to isolate this test from that separate, unrelated startup
 * validation — this test is specifically about the database.
 */
@SpringBootTest
@TestPropertySource(
        properties = {
            "app.youversion.app-key=test-app-key",
            "app.youversion-oauth.client-id=test-app-key"
        })
class TheGardenApplicationNoDatabaseTests {

    @Test
    void contextLoadsWithoutAnyDatabaseConfigured() {
        // Intentionally empty: a failed context load fails this test
        // via the @SpringBootTest bootstrap itself.
    }
}
