package com.thegarden.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI theGardenOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("The Garden API")
                        .version("0.1.0")
                        .description("Backend API for The Garden — a peaceful third-person "
                                + "Christian adventure game.")
                        .license(new License().name("Proprietary")));
    }
}
