package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.domain.Listing;
import com.inzuconnect.inzuconnect_api.repository.ListingRepository;
import com.inzuconnect.inzuconnect_api.web.dto.ListingCreateDto;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingRepository listingRepository;

    public ListingController(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getListings(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String city
    ) {
        // Pageable dans Spring Boot est 0-indexé, donc page - 1
        int pageNumber = Math.max(0, page - 1);
        int limitNumber = Math.max(1, Math.min(100, limit));
        
        Pageable pageable = PageRequest.of(pageNumber, limitNumber, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Listing> listingPage;

        if (city != null && !city.isEmpty()) {
            listingPage = listingRepository.findByCityIgnoreCase(city, pageable);
        } else {
            listingPage = listingRepository.findAll(pageable);
        }

        Map<String, Object> meta = new HashMap<>();
        meta.put("total", listingPage.getTotalElements());
        meta.put("page", page);
        meta.put("limit", limitNumber);
        meta.put("totalPages", listingPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        // Important: Garder le même contrat JSON (data, meta) que Fastify pour ne pas casser le Frontend
        response.put("data", listingPage.getContent());
        response.put("meta", meta);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Listing> createListing(@Valid @RequestBody ListingCreateDto dto) {
        // Validation est gérée par @Valid !
        // Si ça passe ici, c'est que les données sont sûres.
        
        Listing listing = new Listing();
        listing.setTitle(dto.getTitle());
        listing.setPrice(dto.getPrice());
        listing.setCity(dto.getCity());
        // Map other fields...
        // Note: Owner and actual saving logic would be in a ListingService
        // Ceci est une implémentation simplifiée pour le plan.
        
        // return ResponseEntity.status(HttpStatus.CREATED).body(listingRepository.save(listing));
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
