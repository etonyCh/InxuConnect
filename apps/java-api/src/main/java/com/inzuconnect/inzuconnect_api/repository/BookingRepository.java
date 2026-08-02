package com.inzuconnect.inzuconnect_api.repository;

import com.inzuconnect.inzuconnect_api.domain.Booking;
import com.inzuconnect.inzuconnect_api.domain.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findByGuestId(String guestId);
    List<Booking> findByListingId(String listingId);

    @Query("SELECT b FROM Booking b WHERE b.guest.id = :userId OR b.listing.owner.id = :userId ORDER BY b.createdAt DESC")
    List<Booking> findByGuestIdOrListingOwnerId(String userId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE (b.guest.id = :userId OR b.listing.owner.id = :userId) AND b.id = :bookingId")
    long countAccessible(String userId, String bookingId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.listing.owner.id = :ownerId AND b.id = :bookingId")
    long countOwnedByHost(String ownerId, String bookingId);

    @Query("SELECT b FROM Booking b WHERE b.b2bCompany.id = :b2bCompanyId ORDER BY b.createdAt DESC")
    List<Booking> findByB2bCompanyId(String b2bCompanyId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE (b.guest.id = :userId OR b.listing.owner.id = :userId) AND b.status IN :statuses")
    long countByUserAndStatuses(String userId, Collection<BookingStatus> statuses);

    long countByListingOwnerIdAndStatusIn(String ownerId, Collection<BookingStatus> statuses);

    long countByListingOwnerIdAndStatus(String ownerId, BookingStatus status);
}
