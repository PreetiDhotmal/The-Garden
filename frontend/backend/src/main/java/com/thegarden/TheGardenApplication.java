package com.thegarden;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TheGardenApplication {

    public static void main(String[] args) {
        SpringApplication.run(TheGardenApplication.class, args);
    }
}
