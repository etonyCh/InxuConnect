package com.inzuconnect.inzuconnect_api.config;

import com.inzuconnect.inzuconnect_api.domain.Listing;
import com.inzuconnect.inzuconnect_api.domain.User;
import com.inzuconnect.inzuconnect_api.domain.enums.Badge;
import com.inzuconnect.inzuconnect_api.domain.enums.Role;
import com.inzuconnect.inzuconnect_api.repository.ListingRepository;
import com.inzuconnect.inzuconnect_api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(ListingRepository listingRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                User host = User.builder()
                        .name("Jean-Claude Niyonzima")
                        .email("host@inzuconnect.bi")
                        .password(passwordEncoder.encode("Password123!"))
                        .role(Role.HOST)
                        .badge(Badge.VERIFIED)
                        .build();
                userRepository.save(host);

                if (listingRepository.count() == 0) {
                    Listing villa = Listing.builder()
                            .title("Villa de Luxe au Bord du Lac Tanganyika")
                            .description("Superbe villa moderne offrant une vue panoramique imprenable sur le lac Tanganyika avec piscine privée et jardin tropical.")
                            .price(250000)
                            .city("Bujumbura")
                            .address("Avenue de la Plage, Rohero")
                            .bedrooms(3)
                            .bathrooms(2)
                            .currency("BIF")
                            .country("Burundi")
                            .owner(host)
                            .build();

                    Listing tinyHome = Listing.builder()
                            .title("Tiny Home Éco-responsable dans les Collines")
                            .description("Chalet écologique niché dans les magnifiques collines verdoyantes de Gitega avec énergie solaire et terrasse.")
                            .price(110000)
                            .city("Gitega")
                            .address("Quartier Musinzira")
                            .bedrooms(1)
                            .bathrooms(1)
                            .currency("BIF")
                            .country("Burundi")
                            .owner(host)
                            .build();

                    listingRepository.save(villa);
                    listingRepository.save(tinyHome);
                }
            }
        };
    }
}
