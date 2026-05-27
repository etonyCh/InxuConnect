import { PrismaClient, Badge } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Recalculates and updates the rating average and the trust badge for a given user.
 * @param userId The ID of the user to update.
 */
export async function updateSelfReputationAndBadge(userId: string): Promise<{
  averageRating: number
  reviewCount: number
  badge: Badge
}> {
  // 1. Get all revealed reviews targeting this user
  const reviews = await prisma.review.findMany({
    where: {
      targetId: userId,
      revealedAt: { not: null }
    },
    select: {
      rating: true
    }
  })

  const reviewCount = reviews.length
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0

  // 2. Get the user to check KYC status
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true }
  })

  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  // 3. Count completed or checked-in bookings for this user
  // (Both as guest or host)
  const bookingsCount = await prisma.booking.count({
    where: {
      OR: [
        { guestId: userId },
        { listing: { ownerId: userId } }
      ],
      status: { in: ['CHECKED_IN', 'COMPLETED'] }
    }
  })

  // 4. Badge calculation logic
  let badge: Badge = Badge.NONE

  if (user.kycStatus === 'VERIFIED') {
    badge = Badge.VERIFIED

    // Critères Superhost (Burundi) de la Phase 13
    const hostStaysCount = await prisma.booking.count({
      where: {
        listing: { ownerId: userId },
        status: { in: ['CHECKED_IN', 'COMPLETED'] }
      }
    })

    const hostCancelledCount = await prisma.booking.count({
      where: {
        listing: { ownerId: userId },
        status: 'CANCELLED'
      }
    })

    if (hostStaysCount >= 3 && averageRating >= 4.5 && hostCancelledCount === 0) {
      badge = Badge.SUPERHOST
    } else if (bookingsCount >= 3 && averageRating >= 4.5) {
      badge = Badge.FIABLE
    }
  }

  // 5. Update user's badge in database
  await prisma.user.update({
    where: { id: userId },
    data: { badge }
  })

  return {
    averageRating,
    reviewCount,
    badge
  }
}
