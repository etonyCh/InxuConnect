import crypto from 'crypto'

interface InitiatePaymentDetails {
  phone: string;
  amount: number;
  method: 'ECOCASH' | 'LUMICASH';
  bookingId: string;
}

interface PaymentInitiationResult {
  success: boolean;
  reference: string;
  status: 'PENDING' | 'FAILED';
  message: string;
}

/**
 * Service d'intégration InTouch (Agrégateur Mobile Money au Burundi)
 * Permet d'initier des collectes de paiement EcoCash (Econet) et Lumicash (Lumitel).
 * Dispose d'un mode de simulation locale (console) pour les tests hors production.
 */
export async function initiateMobileMoneyPayment(details: InitiatePaymentDetails): Promise<PaymentInitiationResult> {
  const partnerId = process.env.INTOUCH_PARTNER_ID;
  const apiKey = process.env.INTOUCH_API_KEY;

  const uniqueRef = `INT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // Mode Simulation Local (Console Fallback)
  if (!partnerId || !apiKey) {
    console.log("\n==================================================");
    console.log("📲 [SIMULATEUR INTOUCH] Initialisation Paiement Mobile Money");
    console.log(`RÉFÉRENCE : ${uniqueRef}`);
    console.log(`RÉSERVATION ID : ${details.bookingId}`);
    console.log(`OPÉRATEUR : ${details.method}`);
    console.log(`NUMÉRO PORTABLE : ${details.phone}`);
    console.log(`MONTANT : ${details.amount.toLocaleString()} FBu`);
    console.log("👉 Pour confirmer ce paiement, cliquez sur le bouton de simulation");
    console.log("   dans le dashboard ou appelez le webhook mock-callback.");
    console.log("==================================================\n");

    return {
      success: true,
      reference: uniqueRef,
      status: 'PENDING',
      message: 'Demande de paiement mobile initiée avec succès (Mode Simulation)'
    };
  }

  // Envoi réel à l'API de production InTouch (si configurée)
  try {
    const response = await fetch('https://api.intouchgroup.net/v1/payment/collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${partnerId}:${apiKey}`).toString('base64')}`
      },
      body: JSON.stringify({
        partner_transaction_id: uniqueRef,
        amount: details.amount,
        phone: details.phone,
        service_provider: details.method === 'ECOCASH' ? 'ECONET' : 'LUMITEL',
        currency: 'BIF',
        callback_url: `${process.env.PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/callback`
      })
    });

    if (!response.ok) {
      console.error(`❌ Échec de connexion à InTouch: ${response.status} ${await response.text()}`);
      return {
        success: false,
        reference: uniqueRef,
        status: 'FAILED',
        message: 'Impossible de joindre la passerelle InTouch'
      };
    }

    const data = await response.json() as any;

    return {
      success: data.status === 'SUCCESSFUL' || data.status === 'PENDING',
      reference: data.transaction_id || uniqueRef,
      status: data.status === 'SUCCESSFUL' ? 'PENDING' : 'PENDING',
      message: data.message || 'Paiement initié avec succès'
    };
  } catch (error) {
    console.error("❌ Erreur réseau lors de l'appel InTouch:", error);
    return {
      success: false,
      reference: uniqueRef,
      status: 'FAILED',
      message: 'Erreur réseau InTouch'
    };
  }
}
