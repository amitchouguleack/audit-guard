package com.auditguard.parser;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;

@SpringBootApplication
public class LocalEnterpriseParserApplication implements CommandLineRunner {

    public static void main(String[] args) {
        SpringApplication.run(LocalEnterpriseParserApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        if (args.length > 0 && "cli".equals(args[0])) {
            runCliMode(args);
        }
    }

    private void runCliMode(String[] args) {
        System.out.println("=== Audit Guard Local Enterprise Parser ===");
        System.out.println("CLI mode not yet implemented. Use REST API instead.");
        System.out.println("Start server: java -jar target/local-enterprise-parser-1.0.0.jar");
        System.out.println("API endpoint: POST http://localhost:8080/api/scan");
    }
}
