DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='version') THEN
    ALTER TABLE "Listing" ADD COLUMN "version" bigint DEFAULT 0 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='propertyType') THEN
    ALTER TABLE "Listing" ADD COLUMN "propertyType" varchar(255);
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='floor') THEN
    ALTER TABLE "Listing" ADD COLUMN "floor" integer;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='squareMeters') THEN
    ALTER TABLE "Listing" ADD COLUMN "squareMeters" integer;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='listingPublished') THEN
    ALTER TABLE "Listing" ADD COLUMN "listingPublished" boolean DEFAULT false NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='cleaningFee') THEN
    ALTER TABLE "Listing" ADD COLUMN "cleaningFee" integer DEFAULT 0 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='serviceFeePercent') THEN
    ALTER TABLE "Listing" ADD COLUMN "serviceFeePercent" integer DEFAULT 8 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='weeklyDiscountPercent') THEN
    ALTER TABLE "Listing" ADD COLUMN "weeklyDiscountPercent" integer DEFAULT 0 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='monthlyDiscountPercent') THEN
    ALTER TABLE "Listing" ADD COLUMN "monthlyDiscountPercent" integer DEFAULT 0 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='extraGuestFee') THEN
    ALTER TABLE "Listing" ADD COLUMN "extraGuestFee" integer DEFAULT 0 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='petFee') THEN
    ALTER TABLE "Listing" ADD COLUMN "petFee" integer DEFAULT 0 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='minPrice') THEN
    ALTER TABLE "Listing" ADD COLUMN "minPrice" integer;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='maxPrice') THEN
    ALTER TABLE "Listing" ADD COLUMN "maxPrice" integer;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='instantBookEnabled') THEN
    ALTER TABLE "Listing" ADD COLUMN "instantBookEnabled" boolean DEFAULT false NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='minStayNights') THEN
    ALTER TABLE "Listing" ADD COLUMN "minStayNights" integer DEFAULT 1 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='maxStayNights') THEN
    ALTER TABLE "Listing" ADD COLUMN "maxStayNights" integer DEFAULT 90 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='advanceNoticeHours') THEN
    ALTER TABLE "Listing" ADD COLUMN "advanceNoticeHours" integer DEFAULT 24 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='bookingWindowDays') THEN
    ALTER TABLE "Listing" ADD COLUMN "bookingWindowDays" integer DEFAULT 365;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='checkInTime') THEN
    ALTER TABLE "Listing" ADD COLUMN "checkInTime" varchar(16) DEFAULT '14:00';
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='checkOutTime') THEN
    ALTER TABLE "Listing" ADD COLUMN "checkOutTime" varchar(16) DEFAULT '11:00';
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='allowPets') THEN
    ALTER TABLE "Listing" ADD COLUMN "allowPets" boolean DEFAULT false NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='allowSmoking') THEN
    ALTER TABLE "Listing" ADD COLUMN "allowSmoking" boolean DEFAULT false NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='allowParties') THEN
    ALTER TABLE "Listing" ADD COLUMN "allowParties" boolean DEFAULT false NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='requireGuestId') THEN
    ALTER TABLE "Listing" ADD COLUMN "requireGuestId" boolean DEFAULT true NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='customRules') THEN
    ALTER TABLE "Listing" ADD COLUMN "customRules" text;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='coHostIds') THEN
    ALTER TABLE "Listing" ADD COLUMN "coHostIds" jsonb DEFAULT '[]'::jsonb;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listing' AND column_name='coHostPermissions') THEN
    ALTER TABLE "Listing" ADD COLUMN "coHostPermissions" jsonb DEFAULT '{}'::jsonb;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='version') THEN
    ALTER TABLE "User" ADD COLUMN "version" bigint DEFAULT 0 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='preferredCurrency') THEN
    ALTER TABLE "User" ADD COLUMN "preferredCurrency" varchar(8) DEFAULT 'BIF' NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='locale') THEN
    ALTER TABLE "User" ADD COLUMN "locale" varchar(8) DEFAULT 'fr-BI' NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='timezone') THEN
    ALTER TABLE "User" ADD COLUMN "timezone" varchar(64) DEFAULT 'Africa/Bujumbura' NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='discountCredits') THEN
    ALTER TABLE "User" ADD COLUMN "discountCredits" integer DEFAULT 0 NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='notifyPush') THEN
    ALTER TABLE "User" ADD COLUMN "notifyPush" boolean DEFAULT true NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='notifyEmail') THEN
    ALTER TABLE "User" ADD COLUMN "notifyEmail" boolean DEFAULT true NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='notifySms') THEN
    ALTER TABLE "User" ADD COLUMN "notifySms" boolean DEFAULT true NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='notifyTrips') THEN
    ALTER TABLE "User" ADD COLUMN "notifyTrips" boolean DEFAULT true NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='notifyMessages') THEN
    ALTER TABLE "User" ADD COLUMN "notifyMessages" boolean DEFAULT true NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='notifyPromotions') THEN
    ALTER TABLE "User" ADD COLUMN "notifyPromotions" boolean DEFAULT false NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='connectedSocialAccounts') THEN
    ALTER TABLE "User" ADD COLUMN "connectedSocialAccounts" jsonb DEFAULT '{}'::jsonb;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='shareBookingHistoryWithAgents') THEN
    ALTER TABLE "User" ADD COLUMN "shareBookingHistoryWithAgents" boolean DEFAULT false NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='shareProfileWithCoHosts') THEN
    ALTER TABLE "User" ADD COLUMN "shareProfileWithCoHosts" boolean DEFAULT true NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='allowProfileSearch') THEN
    ALTER TABLE "User" ADD COLUMN "allowProfileSearch" boolean DEFAULT true NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='savedPaymentMethods') THEN
    ALTER TABLE "User" ADD COLUMN "savedPaymentMethods" jsonb DEFAULT '{}'::jsonb;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='hostCoHostIds') THEN
    ALTER TABLE "User" ADD COLUMN "hostCoHostIds" jsonb DEFAULT '[]'::jsonb;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='hostCoHostPermissions') THEN
    ALTER TABLE "User" ADD COLUMN "hostCoHostPermissions" jsonb DEFAULT '{}'::jsonb;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='accountStatus') THEN
    ALTER TABLE "User" ADD COLUMN "accountStatus" varchar(64) DEFAULT 'ACTIVE' NOT NULL;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
