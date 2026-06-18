package com.inzuconnect.inzuconnect_api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "\"Amenity\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Amenity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String name;

    @ManyToMany(mappedBy = "amenities")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Set<Listing> listings = new HashSet<>();
}
