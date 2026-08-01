package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/agents")
public class AgentController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final PhotoRepository photoRepository;
    private final AmenityRepository amenityRepository;
    private final AgentCommissionRepository agentCommissionRepository;
    private final PasswordEncoder passwordEncoder;

    public AgentController(
            UserRepository userRepository,
            ListingRepository listingRepository,
            PhotoRepository photoRepository,
            AmenityRepository amenityRepository,
            AgentCommissionRepository agentCommissionRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.photoRepository = photoRepository;
        this.amenityRepository = amenityRepository;
        this.agentCommissionRepository = agentCommissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 1. Enregistrer un Hôte sous parrainage Agent
    @PostMapping("/register-host")
    @Transactional
    public ResponseEntity<?> registerHost(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String phone = body.get("phone");

        if (name == null || email == null || password == null || phone == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Champs requis manquants : name, email, password, phone."));
        }

        User currentAgent = getCurrentUser();
        if (currentAgent == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }
        if (currentAgent.getRole() != Role.AGENT && currentAgent.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès refusé. Rôle AGENT requis."));
        }

        Optional<User> existingUser = userRepository.findByEmail(email.toLowerCase());
        if (existingUser.isEmpty()) {
            existingUser = userRepository.findByPhone(phone);
        }

        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Un utilisateur avec cet email ou ce numéro de téléphone existe déjà."));
        }

        User newHost = new User();
        newHost.setName(name);
        newHost.setEmail(email.toLowerCase());
        newHost.setPassword(passwordEncoder.encode(password));
        newHost.setPhone(phone);
        newHost.setRole(Role.HOST);
        newHost.setReferredByAgentId(currentAgent.getId());
        newHost.setKycStatus(KycStatus.NONE);

        newHost = userRepository.save(newHost);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Hôte enregistré et lié à votre profil agent avec succès.",
                "user", Map.of(
                        "id", newHost.getId(),
                        "name", newHost.getName(),
                        "email", newHost.getEmail(),
                        "phone", newHost.getPhone(),
                        "role", newHost.getRole().name(),
                        "referredByAgentId", newHost.getReferredByAgentId()
                )
        ));
    }

    // 2. Créer une annonce pour le compte d'un Hôte parrainé
    @PostMapping("/listings")
    @Transactional
    public ResponseEntity<?> createListingForHost(@RequestBody Map<String, Object> body) {
        String title = (String) body.get("title");
        String baseDescription = (String) body.get("description");
        Number priceNum = (Number) body.get("price");
        String city = (String) body.get("city");
        String address = (String) body.get("address");
        String ownerId = (String) body.get("ownerId");
        Integer bedrooms = (Integer) body.get("bedrooms");
        Integer bathrooms = (Integer) body.get("bathrooms");
        Integer taxiMotoDistance = (Integer) body.get("taxiMotoDistance");
        Integer surchargeGenerator = (Integer) body.get("surchargeGenerator");
        List<String> photos = (List<String>) body.get("photos");
        List<String> amenities = (List<String>) body.get("amenities");

        if (title == null || priceNum == null || city == null || ownerId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Champs requis manquants : title, price, city, ownerId."));
        }

        User currentAgent = getCurrentUser();
        if (currentAgent == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }
        if (currentAgent.getRole() != Role.AGENT && currentAgent.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès refusé. Rôle AGENT requis."));
        }

        Optional<User> optionalHost = userRepository.findById(ownerId);
        if (optionalHost.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Hôte introuvable."));
        }

        User host = optionalHost.get();
        boolean isReferred = currentAgent.getId().equals(host.getReferredByAgentId());
        boolean isAdmin = currentAgent.getRole() == Role.ADMIN;

        if (!isReferred && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès refusé. Cet hôte n'est pas parrainé par votre compte agent."));
        }

        String finalDescription = generateFallbackDescription(
                title,
                baseDescription,
                city,
                address,
                bedrooms != null ? bedrooms : 1,
                bathrooms != null ? bathrooms : 1,
                priceNum.intValue(),
                amenities != null ? amenities : Collections.emptyList(),
                taxiMotoDistance
        );

        Listing listing = new Listing();
        listing.setTitle(title);
        listing.setDescription(finalDescription);
        listing.setPrice(priceNum.intValue());
        listing.setCity(city);
        listing.setAddress(address != null ? address : "");
        listing.setBedrooms(bedrooms != null ? bedrooms : 1);
        listing.setBathrooms(bathrooms != null ? bathrooms : 1);
        listing.setTaxiMotoDistance(taxiMotoDistance);
        listing.setSurchargeGenerator(surchargeGenerator != null ? surchargeGenerator : 0);
        listing.setOwner(host);

        listing = listingRepository.save(listing);

        if (photos != null) {
            for (String photoUrl : photos) {
                Photo photo = new Photo();
                photo.setListing(listing);
                photo.setUrl(photoUrl);
                photoRepository.save(photo);
                listing.getPhotos().add(photo);
            }
        }

        if (amenities != null) {
            Set<Amenity> set = new HashSet<>();
            for (String name : amenities) {
                Amenity amenity = amenityRepository.findByName(name)
                        .orElseGet(() -> {
                            Amenity a = new Amenity();
                            a.setName(name);
                            return amenityRepository.save(a);
                        });
                set.add(amenity);
            }
            listing.setAmenities(set);
        }

        listing = listingRepository.save(listing);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Annonce créée avec succès pour votre hôte parrainé.",
                "listing", listing
        ));
    }

    // 3. Tableau de bord de l'Agent
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        User currentAgent = getCurrentUser();
        if (currentAgent == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }
        if (currentAgent.getRole() != Role.AGENT && currentAgent.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès refusé. Rôle AGENT requis."));
        }

        try {
            // Hôtes parrainés
            List<User> referredHosts = userRepository.findAll().stream()
                    .filter(u -> currentAgent.getId().equals(u.getReferredByAgentId()))
                    .collect(Collectors.toList());

            List<Map<String, Object>> hostList = referredHosts.stream().map(h -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", h.getId());
                map.put("name", h.getName());
                map.put("email", h.getEmail());
                map.put("phone", h.getPhone());
                map.put("badge", h.getBadge().name());

                // Find listings of this host
                List<Listing> listings = listingRepository.findAll().stream()
                        .filter(l -> l.getOwner().getId().equals(h.getId()))
                        .collect(Collectors.toList());

                List<Map<String, Object>> listMap = listings.stream().map(l -> {
                    Map<String, Object> lm = new HashMap<>();
                    lm.put("id", l.getId());
                    lm.put("title", l.getTitle());
                    lm.put("price", l.getPrice());
                    lm.put("city", l.getCity());
                    return lm;
                }).collect(Collectors.toList());

                map.put("listings", listMap);
                return map;
            }).collect(Collectors.toList());

            // Commissions
            List<AgentCommission> commissions = agentCommissionRepository.findByAgentId(currentAgent.getId());
            int totalEarnedBif = commissions.stream().mapToInt(AgentCommission::getAmount).sum();

            return ResponseEntity.ok(Map.of(
                    "hosts", hostList,
                    "hostsCount", hostList.size(),
                    "commissions", commissions,
                    "totalEarnedBif", totalEarnedBif
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Erreur lors du chargement du tableau de bord agent."));
        }
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByPhone(email).orElse(null));
    }

    private String generateFallbackDescription(
            String title,
            String baseDescription,
            String city,
            String address,
            int bedrooms,
            int bathrooms,
            int price,
            List<String> amenities,
            Integer taxiMotoDistance
    ) {
        StringBuilder frAmenities = new StringBuilder();
        StringBuilder rnAmenities = new StringBuilder();

        for (int i = 0; i < amenities.size(); i++) {
            String a = amenities.get(i);
            String labelFr = getAmenityLabelFr(a);
            String labelRn = getAmenityLabelRn(a);

            if (i > 0) {
                frAmenities.append(", ");
                rnAmenities.append(", ");
            }
            frAmenities.append(labelFr);
            rnAmenities.append(labelRn);
        }

        String taxiFr = taxiMotoDistance != null ? " accessible rapidement (station de taxi-moto à " + taxiMotoDistance + "m)" : "";
        String taxiRn = taxiMotoDistance != null ? " kandi ntiwibagire ko hari ikibanza c'amapikipiki hafi (ku metero " + taxiMotoDistance + ")" : "";

        String mainDescFr = baseDescription != null ? baseDescription + "\n" : "";
        String mainDescRn = baseDescription != null ? "Ku bijanye n'iyi nzu: " + baseDescription + "\n" : "";

        return "[Français]\n" +
                "Bienvenue au \"" + title + "\". " + mainDescFr + "Ce magnifique logement situé à " + city + (address != null ? " (" + address + ")" : "") + " offre un cadre idéal avec ses " + bedrooms + " chambre(s) et " + bathrooms + " salle(s) de bain.\n" +
                "Pour faire face aux défis locaux d'infrastructures au Burundi, le logement est doté de commodités haut de gamme : " + (frAmenities.length() > 0 ? frAmenities.toString() : "confort standard") + "." + taxiFr + "\n" +
                "Idéal pour les séjours professionnels ou de loisirs. Tarif : " + String.format("%,d", price) + " FBu par nuit (paiement Mobile Money EcoCash/Lumicash supporté).\n\n" +
                "[Kirundi]\n" +
                "Kaze kuri \"" + title + "\". " + mainDescRn + "Iyi nzu nziza cane iri mu gisagara ca " + city + (address != null ? " (" + address + ")" : "") + " irakubereye cane. Ifise ivyumba " + bedrooms + " vyo kuryama n'ivyumba " + bathrooms + " vyo kwiyogereramo.\n" +
                "Kugira ntiwigere uhura n'ibibazo vy'amazi cyangwa umuriro mu Burundi, iyi nzu irafise: " + (rnAmenities.length() > 0 ? rnAmenities.toString() : "ibikoresho vyiza") + "." + taxiRn + "\n" +
                "Ikiguzi ni " + String.format("%,d", price) + " FBu ku ntaghe (urashobora kwishura ukoresheje EcoCash cyangwa Lumicash).";
    }

    private String getAmenityLabelFr(String a) {
        switch (a) {
            case "generator": return "groupe électrogène";
            case "water_tank": return "citerne d'eau";
            case "starlink": return "Internet haut débit Starlink";
            case "security_guard": return "gardiennage sécurisé 24/7";
            case "kitchen": return "cuisine moderne équipée";
            default: return a;
        }
    }

    private String getAmenityLabelRn(String a) {
        switch (a) {
            case "generator": return "moteri y'inguvu z'umuriro";
            case "water_tank": return "ikigega c'amazi";
            case "starlink": return "umuhora w'itabazanya wa Starlink";
            case "security_guard": return "abazamu bacungera umutekano ijoro n'umurango";
            case "kitchen": return "igikoni kigezweho";
            default: return a;
        }
    }
}
