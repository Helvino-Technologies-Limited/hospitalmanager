package com.helvinotech.hms.config;

import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.enums.UserRole;
import com.helvinotech.hms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .fullName("System Administrator")
                    .email("admin@helvino-hms.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .phone("0703445756")
                    .role(UserRole.SUPER_ADMIN)
                    .department("Administration")
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created: admin@helvino-hms.com / admin123");
        }
    }
}
