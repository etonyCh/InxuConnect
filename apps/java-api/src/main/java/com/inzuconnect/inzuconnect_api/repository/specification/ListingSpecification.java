package com.inzuconnect.inzuconnect_api.repository.specification;

import com.inzuconnect.inzuconnect_api.domain.Listing;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ListingSpecification {

    public static Specification<Listing> filterListings(
            String city,
            Integer minPrice,
            Integer maxPrice,
            Integer bedrooms,
            Integer bathrooms
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (city != null && !city.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("city")), "%" + city.toLowerCase() + "%"));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (bedrooms != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("bedrooms"), bedrooms));
            }

            if (bathrooms != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("bathrooms"), bathrooms));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
