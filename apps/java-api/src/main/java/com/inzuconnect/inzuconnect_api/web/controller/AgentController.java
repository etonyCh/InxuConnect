package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import com.inzuconnect.inzuconnect_api.web.dto.AgentListingCreateDto;
import com.inzuconnect.inzuconnect_api.web.dto.AgentRegisterHostDto;
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

    @PostMapping("/register-host")
    @Transactional
    public ResponseEntity<?> registerHost(@Valid @RequestBody AgentRegisterHostDto dto) {
        User currentAgent = getCurrentUser();
        if (currentAgent == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }
        if (currentAgent.getRole() != Role.AGENT && currentAgent.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès refusé. Rôle AGENT requis."));
        }

        Optional<User> existing = userRepository.findByEmail(dto.getEmail().toLowerCase());
        if (existing.isEmpty() && dto.getPhone() != null) {
            existing = userRepository.findByPhone(dto.getPhone());
        }

        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Un utilisateur avec cet email ou ce numéro de téléphone existe déjà."));
        }

        User newHost = new User();
        newHost.setName(dto.getName());
        newHost.setEmail(dto.getEmail().toLowerCase());
        newHost.setPassword(passwordEncoder.encode(dto.getPassword()));
        newHost.setPhone(dto.getPhone());
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

    @PostMapping("/listings")
    @Transactional
    public ResponseEntity<?> createListingForHost(@Valid @RequestBody AgentListingCreateDto dto) {
        User currentAgent = getCurrentUser();
        if (currentAgent == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }
        if (currentAgent.getRole() != Role.AGENT && currentAgent.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès refusé. Rôle AGENT requis."));
        }

        Optional<User> optionalHost = userRepository.findById(dto.getOwnerId());
        if (optionalHost.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Hôte introuvable."));
        }

        User host = optionalHost.get();
        boolean isReferred = currentAgent.getId().equals(host.getReferredByAgentId());
        boolean isAdmin = currentAgent.getRole() == Role.ADMIN;

        if (!isReferred && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès refusé. Cet hôte n'est pas parrainé par votre compte agent."));
        }

        int bedrooms = dto.getBedrooms() != null ? dto.getBedrooms() : 1;
        int bathrooms = dto.getBathrooms() != null ? dto.getBathrooms() : 1;

        String finalDescription = generateFallbackDescription(
                dto.getTitle(),
                dto.getDescription(),
                dto.getCity(),
                dto.getAddress(),
                bedrooms,
                bathrooms,
                dto.getPrice(),
                dto.getAmenities() != null ? dto.getAmenities() : Collections.emptyList(),
                dto.getTaxiMotoDistance()
        );

        Listing listing = new Listing();
        listing.setTitle(dto.getTitle());
        listing.setDescription(finalDescription);
        listing.setPrice(dto.getPrice());
        listing.setCity(dto.getCity());
        listing.setAddress(dto.getAddress() != null ? dto.getAddress() : "");
        listing.setBedrooms(bedrooms);
        listing.setBathrooms(bathrooms);
        listing.setTaxiMotoDistance(dto.getTaxiMotoDistance());
        listing.setSurchargeGenerator(dto.getSurchargeGenerator() != null ? dto.getSurchargeGenerator() : 0);
        listing.setOwner(host);

        listing = listingRepository.save(listing);

        if (dto.getPhotos() != null) {
            for (String photoUrl : dto.getPhotos()) {
                Photo photo = new Photo();
                photo.setListing(listing);
                photo.setUrl(photoUrl);
                photoRepository.save(photo);
                listing.getPhotos().add(photo);
            }
        }

        if (dto.getAmenities() != null) {
            Set<Amenity> set = new HashSet<>();
            for (String name : dto.getAmenities()) {
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
                "listing", Map.of(
                        "id", listing.getId(),
                        "title", listing.getTitle(),
                        "city", listing.getCity(),
                        "price", listing.getPrice(),
                        "ownerId", listing.getOwner().getId()
                )
        ));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        User currentAgent = getCurrentUser();
        if (currentAgent == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
        }
        if (currentAgent.getRole() != Role.AGENT && currentAgent.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Accès refusé. Rôle AGENT requis."));
        }

        String agentScopeId = currentAgent.getRole() == Role.ADMIN ? null : currentAgent.getId();
        List<User> referredHosts = agentScopeId != null
                ? userRepository.findByReferredByAgentId(agentScopeId)
                : userRepository.findAll();

        Set<String> hostIds = referredHosts.stream().map(User::getId).collect(Collectors.toSet());

        List<Listing> listings = hostIds.isEmpty()
                ? Collections.emptyList()
                : listingRepository.findAllByIdInOwnerIds(hostIds);

        Map<String, List<Listing>> listingsByOwner = listings.stream()
                .collect(Collectors.groupingBy(l -> l.getOwner().getId()));

        List<Map<String, Object>> hostList = referredHosts.stream().map(h -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", h.getId());
            map.put("name", h.getName());
            map.put("email", h.getEmail());
            map.put("phone", h.getPhone());
            map.put("badge", h.getBadge().name());

            List<Listing> hostListings = listingsByOwner.getOrDefault(h.getId(), Collections.emptyList());
            List<Map<String, Object>> listMap = hostListings.stream().map(l -> {
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

        List<AgentCommission> commissions = agentCommissionRepository.findByAgentId(currentAgent.getId());
        int totalEarnedBif = commissions.stream().mapToInt(AgentCommission::getAmount).sum();

        return ResponseEntity.ok(Map.of(
                "hosts", hostList,
                "hostsCount", hostList.size(),
                "commissions", commissions,
                "totalEarnedBif", totalEarnedBif
        ));
    }

    private User getCurrentUser() {
        var ctx = SecurityContextHolder.getContext();
        if (ctx == null || ctx.getAuthentication() == null || !ctx.getAuthentication().isAuthenticated()) {
            return null;
        }
        String principal = ctx.getAuthentication().getName();
        if (principal == null || principal.isBlank()) return null;
        Optional<User> u = userRepository.findByEmail(principal);
        return u.orElseGet(() -> userRepository.findByPhone(principal).orElse(null));
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
