# --- Build stage ---
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY gradlew gradlew.bat ./
COPY gradle ./gradle
COPY build.gradle.kts settings.gradle.kts ./
RUN ./gradlew dependencies --no-daemon || true

COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# --- Run stage ---
FROM eclipse-temurin:21-jre AS run
WORKDIR /app

RUN addgroup --system garden && adduser --system --ingroup garden garden
COPY --from=build /workspace/build/libs/*.jar app.jar
RUN chown garden:garden app.jar
USER garden

EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "app.jar"]
