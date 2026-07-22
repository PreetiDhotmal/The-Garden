import org.springframework.boot.gradle.plugin.SpringBootPlugin

plugins {
    java
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.thegarden"
version = "0.1.0"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

dependencyManagement {
    imports {
        mavenBom(SpringBootPlugin.BOM_COORDINATES)
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    // Used as a JWT decoder/verifier against YouVersion's JWKS endpoint for
    // the optional "Sign in with YouVersion" flow — we are an OAuth *client*
    // here, not protecting our own API with these tokens, but this starter's
    // NimbusJwtDecoder is the correct, idiomatic way to verify a third
    // party's JWTs regardless of which role we play.
    implementation("org.springframework.boot:spring-boot-starter-security-oauth2-resource-server")

    implementation("com.github.ben-manes.caffeine:caffeine")
    implementation("org.flywaydb:flyway-database-postgresql")

    runtimeOnly("org.postgresql:postgresql")

    // API documentation (Swagger UI / OpenAPI 3.1) — Spring Boot 4-compatible line.
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.3")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.springframework.boot:spring-boot-starter-security-test")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.withType<JavaCompile> {
    options.compilerArgs.add("-parameters")
}

// Gradle's `bootRun` does NOT read .env files natively — without this,
// filling in backend/.env has no effect at all, silently, which isn't
// what a developer following .env.example would expect. This reads
// KEY=VALUE lines (skipping blanks and #-comments) and sets them as
// environment variables for the bootRun task specifically, leaving
// build/test unaffected.
val envFile = file(".env")
if (envFile.exists()) {
    val envVars = envFile.readLines()
        .map { it.trim() }
        .filter { it.isNotEmpty() && !it.startsWith("#") && it.contains("=") }
        .associate { line ->
            val (key, value) = line.split("=", limit = 2)
            key.trim() to value.trim()
        }

    tasks.named<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
        environment(envVars)
    }
}
