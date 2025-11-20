package com.will.enqueteme;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class EnquetemeApplication {

	public static void main(String[] args) {
		SpringApplication.run(EnquetemeApplication.class, args);
	}

}
