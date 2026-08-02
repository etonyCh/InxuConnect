package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.*;
import com.inzuconnect.inzuconnect_api.domain.enums.*;
import com.inzuconnect.inzuconnect_api.repository.*;
import com.inzuconnect.inzuconnect_api.web.dto.ListingCreateDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class ListingController {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final AmenityRepository amenityRepository;
    private final PhotoRepository photoRepository;
    private final VirtualStagingRequestRepository stagingRequestRepository;
    private final ServiceItemRepository serviceItemRepository;
    
    @Autowired
    private EntityManager entityManager;

    public ListingController(
            ListingRepository listingRepository,
            UserRepository userRepository,
            AmenityRepository amenityRepository,
            PhotoRepository photoRepository,
            VirtualStagingRequestRepository stagingRequestRepository,
            ServiceItemRepository serviceItemRepository
    ) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.amenityRepository = amenityRepository;
        this.photoRepository = photoRepository;
        this.stagingRequestRepository = stagingRequestRepository;
        this.serviceItemRepository = serviceItemRepository;
    }

    // 1. Liste de toutes les annonces (avec filtres optionnels)
    @GetMapping("/api/listings")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getListings(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) String hasGenerator,
            @RequestParam(required = false) String hasWaterTank,
            @RequestParam(required = false) String hasStarlink,
            @RequestParam(required = false) String targetCurrency,
            @RequestParam(required = false) String ownerId
    ) {
        int pageNumber = Math.max(0, page - 1);
        int limitNumber = Math.max(1, Math.min(100, limit));

        StringBuilder jpql = new StringBuilder("SELECT DISTINCT l FROM Listing l LEFT JOIN FETCH l.photos LEFT JOIN FETCH l.amenities WHERE 1=1");
        Map<String, Object> params = new HashMap<>();

        if (ownerId != null && !ownerId.trim().isEmpty()) {
            jpql.append(" AND l.owner.id = :ownerId");
            params.put("ownerId", ownerId);
        }
        if (city != null && !city.trim().isEmpty()) {
            jpql.append(" AND LOWER(l.city) = LOWER(:city)");
            params.put("city", city);
        }
        if (country != null && !country.trim().isEmpty()) {
            jpql.append(" AND LOWER(l.country) = LOWER(:country)");
            params.put("country", country);
        }
        if (maxPrice != null) {
            jpql.append(" AND l.price <= :maxPrice");
            params.put("maxPrice", maxPrice);
        }
        if ("true".equals(hasGenerator)) {
            jpql.append(" AND EXISTS (SELECT a FROM l.amenities a WHERE a.name = 'generator')");
        }
        if ("true".equals(hasWaterTank)) {
            jpql.append(" AND EXISTS (SELECT a FROM l.amenities a WHERE a.name = 'water_tank')");
        }
        if ("true".equals(hasStarlink)) {
            jpql.append(" AND EXISTS (SELECT a FROM l.amenities a WHERE a.name = 'starlink')");
        }

        StringBuilder countJpql = new StringBuilder("SELECT COUNT(DISTINCT l) FROM Listing l LEFT JOIN l.photos LEFT JOIN l.amenities WHERE 1=1");
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            countJpql.append(" AND ");
            // Simple copy of filters: since we know each filter appends a single AND clause using its param,
            // extract the substring from the original jpql: after "WHERE 1=1" until end.
        }
        // Rebuild count filters by re-appending params clauses the same way
        {
            if (ownerId != null && !ownerId.trim().isEmpty()) {
                countJpql.append(" AND l.owner.id = :ownerId");
            }
            if (city != null && !city.trim().isEmpty()) {
                countJpql.append(" AND LOWER(l.city) = LOWER(:city)");
            }
            if (country != null && !country.trim().isEmpty()) {
                countJpql.append(" AND LOWER(l.country) = LOWER(:country)");
            }
            if (maxPrice != null) {
                countJpql.append(" AND l.price <= :maxPrice");
            }
            if ("true".equals(hasGenerator)) {
                countJpql.append(" AND EXISTS (SELECT a FROM l.amenities a WHERE a.name = 'generator')");
            }
            if ("true".equals(hasWaterTank)) {
                countJpql.append(" AND EXISTS (SELECT a FROM l.amenities a WHERE a.name = 'water_tank')");
            }
            if ("true".equals(hasStarlink)) {
                countJpql.append(" AND EXISTS (SELECT a FROM l.amenities a WHERE a.name = 'starlink')");
            }
        }

        jpql.append(" ORDER BY l.createdAt DESC");

        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql.toString(), Long.class);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            countQuery.setParameter(entry.getKey(), entry.getValue());
        }
        long totalElementsCount = countQuery.getSingleResult();
        int totalElements = (int) Math.min(totalElementsCount, Integer.MAX_VALUE);

        TypedQuery<Listing> query = entityManager.createQuery(jpql.toString(), Listing.class);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }

        query.setFirstResult(pageNumber * limitNumber);
        query.setMaxResults(limitNumber);

        List<Listing> listings = query.getResultList();

        // Convert currency if needed
        List<Map<String, Object>> optimizedListings = listings.stream().map(l -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", l.getId());
            map.put("title", l.getTitle());
            map.put("description", l.getDescription());
            map.put("city", l.getCity());
            map.put("address", l.getAddress());
            map.put("latitude", l.getLatitude());
            map.put("longitude", l.getLongitude());
            map.put("bedrooms", l.getBedrooms());
            map.put("bathrooms", l.getBathrooms());
            map.put("taxiMotoDistance", l.getTaxiMotoDistance());
            map.put("surchargeGenerator", l.getSurchargeGenerator());
            map.put("country", l.getCountry());
            map.put("createdAt", l.getCreatedAt());
            map.put("photos", l.getPhotos());
            map.put("amenities", l.getAmenities());
            map.put("owner", l.getOwner());

            double displayPrice = l.getPrice();
            String displayCurrency = l.getCurrency();

            if (targetCurrency != null && !targetCurrency.trim().isEmpty()) {
                displayPrice = convertCurrency(l.getPrice(), l.getCurrency(), targetCurrency);
                displayCurrency = targetCurrency.toUpperCase();
            }

            map.put("price", displayPrice);
            map.put("currency", displayCurrency);
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> meta = new HashMap<>();
        meta.put("total", totalElements);
        meta.put("page", page);
        meta.put("limit", limitNumber);
        meta.put("totalPages", (int) Math.ceil((double) totalElements / limitNumber));

        Map<String, Object> response = new HashMap<>();
        response.put("data", optimizedListings);
        response.put("meta", meta);

        return ResponseEntity.ok(response);
    }

    // 1.b Endpoint de recherche avancée avec JPA Specification
    @GetMapping("/api/v1/listings/search")
    @Transactional(readOnly = true)
    public ResponseEntity<?> searchListings(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(required = false) Integer bathrooms
    ) {
        org.springframework.data.jpa.domain.Specification<Listing> spec = 
                com.inzuconnect.inzuconnect_api.repository.specification.ListingSpecification.filterListings(
                        city, minPrice, maxPrice, bedrooms, bathrooms
                );
        List<Listing> results = listingRepository.findAll(spec);
        return ResponseEntity.ok(Map.of("data", results, "total", results.size()));
    }

    // 2. Détail d'une annonce
    @GetMapping("/api/listings/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getListing(@PathVariable String id, @RequestParam(required = false) String targetCurrency) {
        Optional<Listing> optionalListing = listingRepository.findById(id);
        if (optionalListing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Annonce non trouvée"));
        }

        Listing l = optionalListing.get();

        Map<String, Object> map = new HashMap<>();
        map.put("id", l.getId());
        map.put("title", l.getTitle());
        map.put("description", l.getDescription());
        map.put("city", l.getCity());
        map.put("address", l.getAddress());
        map.put("latitude", l.getLatitude());
        map.put("longitude", l.getLongitude());
        map.put("bedrooms", l.getBedrooms());
        map.put("bathrooms", l.getBathrooms());
        map.put("taxiMotoDistance", l.getTaxiMotoDistance());
        map.put("surchargeGenerator", l.getSurchargeGenerator());
        map.put("country", l.getCountry());
        map.put("createdAt", l.getCreatedAt());
        map.put("photos", l.getPhotos());
        map.put("amenities", l.getAmenities());
        map.put("owner", l.getOwner());

        double displayPrice = l.getPrice();
        String displayCurrency = l.getCurrency();

        if (targetCurrency != null && !targetCurrency.trim().isEmpty()) {
            displayPrice = convertCurrency(l.getPrice(), l.getCurrency(), targetCurrency);
            displayCurrency = targetCurrency.toUpperCase();
        }

        map.put("price", displayPrice);
        map.put("currency", displayCurrency);

        return ResponseEntity.ok(map);
    }

    // 3. Créer une nouvelle annonce
    @PostMapping("/api/listings")
    @Transactional
    public ResponseEntity<?> createListing(@Valid @RequestBody ListingCreateDto dto) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        // Auto-promotion de GUEST à HOST si nécessaire
        if (currentUser.getRole() == Role.GUEST) {
            currentUser.setRole(Role.HOST);
            userRepository.save(currentUser);
        }

        // Description bilingue de fallback
        String finalDescription = generateFallbackDescription(
                dto.getTitle(),
                dto.getDescription(),
                dto.getCity(),
                dto.getAddress(),
                dto.getBedrooms() != null ? dto.getBedrooms() : 1,
                dto.getBathrooms() != null ? dto.getBathrooms() : 1,
                dto.getPrice(),
                dto.getAmenities() != null ? dto.getAmenities() : Collections.emptyList(),
                dto.getTaxiMotoDistance()
        );

        Listing listing = new Listing();
        listing.setTitle(dto.getTitle());
        listing.setDescription(finalDescription);
        listing.setPrice(dto.getPrice());
        listing.setCity(dto.getCity());
        listing.setCountry(dto.getCountry() != null ? dto.getCountry() : "Burundi");
        listing.setCurrency(dto.getCurrency() != null ? dto.getCurrency() : "BIF");
        listing.setAddress(dto.getAddress());
        listing.setBedrooms(dto.getBedrooms() != null ? dto.getBedrooms() : 1);
        listing.setBathrooms(dto.getBathrooms() != null ? dto.getBathrooms() : 1);
        listing.setTaxiMotoDistance(dto.getTaxiMotoDistance());
        listing.setSurchargeGenerator(dto.getSurchargeGenerator() != null ? dto.getSurchargeGenerator() : 0);
        listing.setLatitude(dto.getLatitude());
        listing.setLongitude(dto.getLongitude());
        listing.setOwner(currentUser);

        listing = listingRepository.save(listing);

        // Enregistrer les photos
        if (dto.getPhotos() != null) {
            for (String photoUrl : dto.getPhotos()) {
                Photo photo = new Photo();
                photo.setListing(listing);
                photo.setUrl(photoUrl);
                photoRepository.save(photo);
                listing.getPhotos().add(photo);
            }
        }

        // Enregistrer les équipements (amenities)
        if (dto.getAmenities() != null) {
            Set<Amenity> amenities = new HashSet<>();
            for (String name : dto.getAmenities()) {
                Amenity amenity = amenityRepository.findByName(name)
                        .orElseGet(() -> {
                            Amenity a = new Amenity();
                            a.setName(name);
                            return amenityRepository.save(a);
                        });
                amenities.add(amenity);
            }
            listing.setAmenities(amenities);
        }

        listing = listingRepository.save(listing);
        return ResponseEntity.status(HttpStatus.CREATED).body(listing);
    }

    // 4. Mettre à jour une annonce
    @PatchMapping("/api/listings/{id}")
    @Transactional
    public ResponseEntity<?> updateListing(@PathVariable String id, @RequestBody Map<String, Object> body) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<Listing> optionalListing = listingRepository.findById(id);
        if (optionalListing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Annonce non trouvée"));
        }

        Listing listing = optionalListing.get();

        if (!listing.getOwner().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Non autorisé à modifier cette annonce"));
        }

        if (body.containsKey("title")) listing.setTitle((String) body.get("title"));
        if (body.containsKey("price")) listing.setPrice((Integer) body.get("price"));
        if (body.containsKey("city")) listing.setCity((String) body.get("city"));
        if (body.containsKey("country")) listing.setCountry((String) body.get("country"));
        if (body.containsKey("currency")) listing.setCurrency((String) body.get("currency"));
        if (body.containsKey("address")) listing.setAddress((String) body.get("address"));
        if (body.containsKey("bedrooms")) listing.setBedrooms((Integer) body.get("bedrooms"));
        if (body.containsKey("bathrooms")) listing.setBathrooms((Integer) body.get("bathrooms"));
        if (body.containsKey("taxiMotoDistance")) listing.setTaxiMotoDistance((Integer) body.get("taxiMotoDistance"));
        if (body.containsKey("surchargeGenerator")) listing.setSurchargeGenerator((Integer) body.get("surchargeGenerator"));
        if (body.containsKey("latitude")) listing.setLatitude((Double) body.get("latitude"));
        if (body.containsKey("longitude")) listing.setLongitude((Double) body.get("longitude"));

        // If core details changed, update fallback description
        boolean coreChanged = body.containsKey("title") || body.containsKey("city") || body.containsKey("price") || body.containsKey("bedrooms") || body.containsKey("bathrooms") || body.containsKey("description") || body.containsKey("amenities");
        if (coreChanged) {
            String desc = body.containsKey("description") ? (String) body.get("description") : listing.getDescription();
            List<String> amenities = body.containsKey("amenities") 
                ? (List<String>) body.get("amenities") 
                : listing.getAmenities().stream().map(Amenity::getName).collect(Collectors.toList());

            String newDesc = generateFallbackDescription(
                    listing.getTitle(),
                    desc,
                    listing.getCity(),
                    listing.getAddress(),
                    listing.getBedrooms(),
                    listing.getBathrooms(),
                    listing.getPrice(),
                    amenities,
                    listing.getTaxiMotoDistance()
            );
            listing.setDescription(newDesc);
        }

        // Photos update
        if (body.containsKey("photos")) {
            List<String> photoUrls = (List<String>) body.get("photos");
            listing.getPhotos().clear();
            listingRepository.save(listing); // Clear on DB
            for (String photoUrl : photoUrls) {
                Photo photo = new Photo();
                photo.setListing(listing);
                photo.setUrl(photoUrl);
                photoRepository.save(photo);
                listing.getPhotos().add(photo);
            }
        }

        // Amenities update
        if (body.containsKey("amenities")) {
            List<String> names = (List<String>) body.get("amenities");
            Set<Amenity> amenities = new HashSet<>();
            for (String name : names) {
                Amenity amenity = amenityRepository.findByName(name)
                        .orElseGet(() -> {
                            Amenity a = new Amenity();
                            a.setName(name);
                            return amenityRepository.save(a);
                        });
                amenities.add(amenity);
            }
            listing.setAmenities(amenities);
        }

        Listing saved = listingRepository.save(listing);
        return ResponseEntity.ok(saved);
    }

    // 5. Supprimer une annonce
    @DeleteMapping("/api/listings/{id}")
    @Transactional
    public ResponseEntity<?> deleteListing(@PathVariable String id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<Listing> optionalListing = listingRepository.findById(id);
        if (optionalListing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Annonce non trouvée"));
        }

        Listing listing = optionalListing.get();

        if (!listing.getOwner().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Non autorisé à supprimer cette annonce"));
        }

        listingRepository.delete(listing);
        return ResponseEntity.ok(Map.of("success", true, "message", "Annonce supprimée avec succès"));
    }

    // 6. Obtenir une URL pré-signée pour upload d'une photo
    @PostMapping("/api/listings/media/presigned")
    public ResponseEntity<?> getPresignedUrl(@RequestBody Map<String, String> body) {
        String fileName = body.get("fileName");
        String contentType = body.get("contentType");

        if (fileName == null || contentType == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "fileName et contentType sont requis"));
        }

        User currentUser = getCurrentUser();
        String userId = currentUser != null ? currentUser.getId() : "anonymous";
        String uniqueId = UUID.randomUUID().toString();
        String sanitizedName = fileName.replaceAll("[^a-zA-Z0-9\\.\\-_]", "");
        String fileKey = "listings/" + userId + "/" + uniqueId + "_" + sanitizedName;

        String mockUploadUrl = "http://localhost:8080/api/listings/media/mock-upload?key=" + fileKey;
        String mockPublicUrl = "http://localhost:8080/uploads/" + fileKey;

        return ResponseEntity.ok(Map.of(
                "success", true,
                "uploadUrl", mockUploadUrl,
                "publicUrl", mockPublicUrl,
                "fileKey", fileKey,
                "isMock", true
        ));
    }

    // 7. Point de terminaison de simulation de chargement local (Local Disk)
    @PutMapping("/api/listings/media/mock-upload")
    public ResponseEntity<?> mockUpload(@RequestParam String key, @RequestBody byte[] fileContent) {
        String baseDir = System.getProperty("user.dir");
        File file = new File(baseDir + "/uploads/" + key);
        file.getParentFile().mkdirs();

        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(fileContent);
            System.out.println("[LOCAL UPLOAD] Fichier sauvegardé: " + file.getAbsolutePath());
            return ResponseEntity.ok(Map.of("success", true, "message", "Fichier sauvegardé localement sur le disque"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Erreur lors de la sauvegarde locale"));
        }
    }

    // 8. Consulter le Staging Virtuel d'un logement (Public)
    @GetMapping("/api/listings/{id}/staging")
    public ResponseEntity<?> getStaging(@PathVariable String id) {
        List<VirtualStagingRequest> requests = stagingRequestRepository.findByListingIdOrderByCreatedAtDesc(id);
        if (requests.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Aucun staging virtuel disponible ou complété pour ce logement"));
        }

        VirtualStagingRequest request = requests.get(0);
        
        Map<String, Object> sceneMap = null;
        try {
            // SceneUrl contains JSON string
            sceneMap = new com.fasterxml.jackson.databind.ObjectMapper().readValue(request.getSceneUrl(), Map.class);
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of(
                "success", true,
                "stagingRequest", Map.of(
                        "id", request.getId(),
                        "listingId", request.getListing().getId(),
                        "status", request.getStatus(),
                        "scene", sceneMap,
                        "createdAt", request.getCreatedAt()
                )
        ));
    }

    // 9. Demander un Staging Virtuel 3D pour un logement
    @PostMapping("/api/host/listings/{id}/staging")
    @Transactional
    public ResponseEntity<?> requestStaging(
            @PathVariable String id,
            @RequestBody Map<String, Object> body
    ) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<Listing> optionalListing = listingRepository.findById(id);
        if (optionalListing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Logement introuvable"));
        }

        Listing listing = optionalListing.get();

        if (!listing.getOwner().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Non autorisé : vous devez être le propriétaire de ce logement"));
        }

        boolean payWithSavings = body.containsKey("payWithSavings") && (boolean) body.get("payWithSavings");
        int cost = 5000;

        if (payWithSavings) {
            if (currentUser.getSavingsBalance() < cost) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Solde d'épargne insuffisant (" + currentUser.getSavingsBalance() + " BIF). Le coût est de " + cost + " BIF."));
            }
            currentUser.setSavingsBalance(currentUser.getSavingsBalance() - cost);
            userRepository.save(currentUser);
        } else {
            String phone = (String) body.get("phone");
            String provider = (String) body.get("provider");
            if (phone == null || provider == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Veuillez spécifier le numéro de téléphone et le fournisseur (ECOCASH/LUMICASH) pour le paiement."));
            }
            System.out.println("Paiement Mobile Money de " + cost + " BIF initié pour le staging virtuel sur " + phone + " via " + provider);
        }

        String mockSceneData = "{\n" +
                "  \"roomType\": \"bedroom\",\n" +
                "  \"dimensions\": { \"width\": 4.5, \"height\": 2.8, \"depth\": 4.0 },\n" +
                "  \"furniture\": [\n" +
                "    { \"type\": \"bed\", \"position\": { \"x\": 0, \"y\": 0.4, \"z\": -1 }, \"rotation\": 0, \"color\": \"#1E3A8A\" },\n" +
                "    { \"type\": \"bedside_table\", \"position\": { \"x\": -1.5, \"y\": 0.25, \"z\": -1.5 }, \"rotation\": 0, \"color\": \"#78350F\" },\n" +
                "    { \"type\": \"wardrobe\", \"position\": { \"x\": 1.8, \"y\": 1.0, \"z\": 1.2 }, \"rotation\": 90, \"color\": \"#78350F\" },\n" +
                "    { \"type\": \"window\", \"position\": { \"x\": 0, \"y\": 1.5, \"z\": -2.0 }, \"dimensions\": { \"w\": 1.2, \"h\": 1.2 } },\n" +
                "    { \"type\": \"light\", \"position\": { \"x\": 0, \"y\": 2.7, \"z\": 0 }, \"intensity\": 1.5 }\n" +
                "  ],\n" +
                "  \"wallColor\": \"#F5F5F4\",\n" +
                "  \"floorTexture\": \"wood\"\n" +
                "}";

        VirtualStagingRequest stagingRequest = new VirtualStagingRequest();
        stagingRequest.setListing(listing);
        stagingRequest.setStatus("COMPLETED");
        stagingRequest.setSceneUrl(mockSceneData);
        stagingRequest.setPrice(cost);

        stagingRequest = stagingRequestRepository.save(stagingRequest);

        Map<String, Object> sceneMap = null;
        try {
            sceneMap = new com.fasterxml.jackson.databind.ObjectMapper().readValue(mockSceneData, Map.class);
        } catch (Exception ignored) {}

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Staging virtuel IA complété avec succès !",
                "stagingRequest", Map.of(
                        "id", stagingRequest.getId(),
                        "listingId", listing.getId(),
                        "status", "COMPLETED",
                        "price", cost,
                        "scene", sceneMap
                )
        ));
    }

    // 10. Suggérer un prix optimal pour un logement
    @PostMapping("/api/listings/price-coach")
    public ResponseEntity<?> priceCoach(@RequestBody Map<String, Object> body) {
        String city = (String) body.get("city");
        if (city == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Le champ 'city' est requis."));
        }

        int bedrooms = body.containsKey("bedrooms") ? (int) body.get("bedrooms") : 1;
        int bathrooms = body.containsKey("bathrooms") ? (int) body.get("bathrooms") : 1;
        List<String> amenities = body.containsKey("amenities") ? (List<String>) body.get("amenities") : Collections.emptyList();
        String dateStr = (String) body.get("date");

        // 1. Base price
        int calculatedBasePrice = 20000;
        String normalizedCity = city.trim().toLowerCase();
        if (normalizedCity.equals("bujumbura")) {
            calculatedBasePrice = 40000;
        } else if (normalizedCity.equals("gitega")) {
            calculatedBasePrice = 30000;
        } else if (normalizedCity.equals("ngozi")) {
            calculatedBasePrice = 25000;
        }

        int roomPriceBonus = Math.max(0, bedrooms - 1) * 15000;
        int bathPriceBonus = Math.max(0, bathrooms - 1) * 5000;

        int amenitiesBonus = 0;
        if (amenities.contains("generator")) amenitiesBonus += 15000;
        if (amenities.contains("water_tank")) amenitiesBonus += 8000;
        if (amenities.contains("starlink")) amenitiesBonus += 12000;
        if (amenities.contains("security_guard")) amenitiesBonus += 5000;
        if (amenities.contains("kitchen")) amenitiesBonus += 5000;

        int myBaseCalculated = calculatedBasePrice + roomPriceBonus + bathPriceBonus + amenitiesBonus;

        // 2. Competitor Average
        List<Listing> competitors = listingRepository.findAll().stream()
                .filter(l -> l.getCity().equalsIgnoreCase(city))
                .collect(Collectors.toList());

        double competitorAverage = myBaseCalculated;
        boolean hasCompetitors = !competitors.isEmpty();
        if (hasCompetitors) {
            competitorAverage = competitors.stream().mapToDouble(Listing::getPrice).average().orElse(myBaseCalculated);
        }

        double referencePrice = hasCompetitors ? (myBaseCalculated + competitorAverage) / 2 : myBaseCalculated;

        // 3. Seasonality & events
        LocalDate targetDate = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();
        int month = targetDate.getMonthValue(); // 1-12
        int day = targetDate.getDayOfMonth();

        double eventMultiplier = 1.0;
        String eventNameFr = "";
        String eventNameRn = "";

        if (month == 7 && day == 1) { // 1er Juillet
            eventMultiplier = 1.25;
            eventNameFr = "la Fête de l'Indépendance du Burundi (haute affluence nationale)";
            eventNameRn = "Umunsi mukuru w'Ukwikukira kw'Uburundi (abashitsi baba ari benshi)";
        } else if (month == 2 && day == 5) { // 5 Février
            eventMultiplier = 1.15;
            eventNameFr = "la Fête de l'Unité Nationale";
            eventNameRn = "Umunsi mukuru w'Ubumwe bw'Abarundi";
        } else if (month == 9 && day >= 1 && day <= 15) {
            if (normalizedCity.equals("bujumbura") || normalizedCity.equals("gitega")) {
                eventMultiplier = 1.20;
                eventNameFr = "la période de rentrée universitaire (forte demande de logements étudiants/enseignants)";
                eventNameRn = "igihe c'iyinjira ry'amashure makuru na kaminuza (abanyeshure n'abigisha barondera inzu)";
            }
        } else if (month == 6 || month == 7 || month == 8) {
            eventMultiplier = 1.15;
            eventNameFr = "la haute saison sèche (visites de la diaspora et tourisme d'été)";
            eventNameRn = "igihe c'impeshi n'inyagato (ababa hanze barataha kandi ba mukerarugendo baba ari benshi)";
        }

        double seasonMultiplier = 1.0;
        String seasonNameFr = "";
        String seasonNameRn = "";

        boolean isRainySeason = Arrays.asList(3, 4, 5, 9, 10, 11).contains(month);
        if (isRainySeason) {
            if (amenities.contains("generator") && amenities.contains("water_tank")) {
                seasonMultiplier = 1.05;
                seasonNameFr = "la valorisation de vos équipements de secours (groupe et citerne) pendant la saison des pluies";
                seasonNameRn = "agaciro k'ivyuma vy'amazi n'umuriro wa moteri mu gihe c'imvura";
            } else {
                seasonMultiplier = 0.90;
                seasonNameFr = "la saison des pluies (risques de perturbations REGIDESO fréquentes)";
                seasonNameRn = "igihe c'imvura (ibibazo vy'amazi n'umuriro bitera haba ibura)";
            }
        } else {
            seasonMultiplier = 1.05;
            seasonNameFr = "le climat agréable de la saison sèche";
            seasonNameRn = "igihe c'agatasi";
        }

        int finalSuggestedPrice = (int) Math.round(referencePrice * eventMultiplier * seasonMultiplier);
        finalSuggestedPrice = Math.round((float) finalSuggestedPrice / 1000) * 1000;
        if (finalSuggestedPrice < 15000) {
            finalSuggestedPrice = 15000;
        }

        String justification = generateFallbackJustification(
                city,
                bedrooms,
                bathrooms,
                amenities,
                finalSuggestedPrice,
                competitorAverage,
                hasCompetitors,
                eventNameFr,
                eventNameRn,
                seasonNameFr,
                seasonNameRn
        );

        return ResponseEntity.ok(Map.of(
                "suggestedPrice", finalSuggestedPrice,
                "justification", justification
        ));
    }

    // 11. Récupérer les services disponibles pour un logement
    @GetMapping("/api/listings/{id}/services")
    public ResponseEntity<?> getServices(@PathVariable String id) {
        List<ServiceItem> services = serviceItemRepository.findByListingId(id);
        return ResponseEntity.ok(services);
    }

    // 12. Ajouter un service additionnel à une annonce (Hôte)
    @PostMapping("/api/listings/{id}/services")
    public ResponseEntity<?> createService(@PathVariable String id, @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        Number priceNum = (Number) body.get("price");

        if (name == null || description == null || priceNum == null || priceNum.intValue() < 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Champs obligatoires manquants ou invalides : name, description, price."));
        }

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
        }

        Optional<Listing> optionalListing = listingRepository.findById(id);
        if (optionalListing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Annonce non trouvée."));
        }

        Listing listing = optionalListing.get();

        if (!listing.getOwner().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Non autorisé. Seul l'hôte de ce logement peut y ajouter des services additionnels."));
        }

        ServiceItem serviceItem = new ServiceItem();
        serviceItem.setListing(listing);
        serviceItem.setName(name);
        serviceItem.setDescription(description);
        serviceItem.setPrice(priceNum.intValue());

        serviceItem = serviceItemRepository.save(serviceItem);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Service additionnel créé avec succès.",
                "service", serviceItem
        ));
    }

    // Helpers
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByPhone(email).orElse(null));
    }

    private double convertCurrency(int amount, String from, String to) {
        String normalizedFrom = from.toUpperCase().trim();
        String normalizedTo = to.toUpperCase().trim();
        if (normalizedFrom.equals(normalizedTo)) {
            return amount;
        }

        double rateFrom = getExchangeRate(normalizedFrom);
        double rateTo = getExchangeRate(normalizedTo);

        double amountInBif = amount / rateFrom;
        double convertedAmount = amountInBif * rateTo;

        if (normalizedTo.equals("USD")) {
            return Math.round(convertedAmount * 100.0) / 100.0;
        } else {
            return Math.round(convertedAmount);
        }
    }

    private double getExchangeRate(String currency) {
        switch (currency) {
            case "RWF": return 0.45;
            case "USD": return 0.00035;
            case "TZS": return 0.90;
            case "BIF":
            default: return 1.0;
        }
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

    private String generateFallbackJustification(
            String city,
            int bedrooms,
            int bathrooms,
            List<String> amenities,
            int suggestedPrice,
            double competitorAverage,
            boolean hasCompetitors,
            String eventNameFr,
            String eventNameRn,
            String seasonNameFr,
            String seasonNameRn
    ) {
        boolean hasGen = amenities.contains("generator");
        boolean hasTank = amenities.contains("water_tank");
        boolean hasWifi = amenities.contains("starlink");

        List<String> amenityBulletsFr = new ArrayList<>();
        List<String> amenityBulletsRn = new ArrayList<>();

        if (hasGen) {
            amenityBulletsFr.add("le groupe électrogène garantit l'électricité sans coupure");
            amenityBulletsRn.add("moteri y'umuriro ikurinda ibura ry'umuriro");
        }
        if (hasTank) {
            amenityBulletsFr.add("la citerne prévient les pénuries d'eau");
            amenityBulletsRn.add("ikigega c'amazi gikingira ibura ry'amazi");
        }
        if (hasWifi) {
            amenityBulletsFr.add("la connexion Internet Starlink ajoute une grande valeur");
            amenityBulletsRn.add("umuhora wa Starlink wunganya agaciro kanini");
        }

        String amenitiesDescFr = !amenityBulletsFr.isEmpty()
                ? " Grâce à vos équipements clés (" + String.join(" et ", amenityBulletsFr) + "), votre logement se positionne de manière très compétitive."
                : "";

        String amenitiesDescRn = !amenityBulletsRn.isEmpty()
                ? " Kubera ibikoresho vyiza ufise (" + String.join(" n' ", amenityBulletsRn) + "), inzu yawe irakomeye cane ku isoko."
                : "";

        String compTextFr = hasCompetitors
                ? "Le prix moyen constaté pour la ville de " + city + " est de " + String.format("%,d", (int) competitorAverage) + " FBu/nuit."
                : "Votre logement est l'un des premiers référencés à " + city + ", offrant une opportunité unique.";

        String compTextRn = hasCompetitors
                ? "Ikigereranyo c'ibiciro mu gisagara ca " + city + " ni " + String.format("%,d", (int) competitorAverage) + " FBu ku ntaghe."
                : "Inzu yawe n'imwe mu za mbere zanditswe muri " + city + ", ifise ikibanza kiza ku isoko.";

        String factorTextFr = !eventNameFr.isEmpty() || !seasonNameFr.isEmpty()
                ? " Ce tarif tient également compte de " + (!eventNameFr.isEmpty() ? eventNameFr : seasonNameFr) + "."
                : "";

        String factorTextRn = !eventNameRn.isEmpty() || !seasonNameRn.isEmpty()
                ? " Iki giciro kandi kirafise ishingiro rishingiye kuri " + (!eventNameRn.isEmpty() ? eventNameRn : seasonNameRn) + "."
                : "";

        return "[Français]\n" +
                "Nous vous suggérons un tarif de " + String.format("%,d", suggestedPrice) + " FBu par nuit pour ce logement de " + bedrooms + " chambre(s) à " + city + "." + amenitiesDescFr + " " + compTextFr + factorTextFr + "\n\n" +
                "[Kirundi]\n" +
                "Turakugiriye inama yo gushira igiciro ca " + String.format("%,d", suggestedPrice) + " FBu ku ntaghe kuri iyi nzu y'ivyumba " + bedrooms + " muri " + city + "." + amenitiesDescRn + " " + compTextRn + factorTextRn;
    }
}
