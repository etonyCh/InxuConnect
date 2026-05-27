/**
 * Service SMS d'InzuConnect
 * Intègre Africa's Talking par requêtes HTTP POST (fetch natif).
 * Dispose d'un mode de simulation local (console) si les clés API manquent.
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  const senderId = process.env.AT_SENDER_ID; // Optionnel

  // Mode Simulation Local (Console Fallback)
  if (!username || !apiKey) {
    console.log("\n==================================================");
    console.log("📲 [SIMULATEUR SMS] Fallback Local Activé (AT_USERNAME ou AT_API_KEY manquant)");
    console.log(`POUR : ${to}`);
    console.log(`MESSAGE : ${message}`);
    console.log("==================================================\n");
    return true;
  }

  // Envoi réel via l'API Africa's Talking
  try {
    const body = new URLSearchParams({
      username: username,
      to: to,
      message: message,
    });

    if (senderId) {
      body.append("from", senderId);
    }

    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        "apiKey": apiKey,
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Échec d'envoi SMS Africa's Talking: ${response.status} - ${errorText}`);
      return false;
    }

    const data = (await response.json()) as any;
    const recipient = data?.SMSMessageData?.Recipients?.[0];
    
    if (recipient?.status === "Success") {
      console.log(`✅ SMS envoyé avec succès à ${to} via Africa's Talking`);
      return true;
    } else {
      console.error(`❌ Échec d'envoi SMS à ${to}: Status = ${recipient?.status}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Erreur réseau lors de l'envoi du SMS via Africa's Talking:", error);
    return false;
  }
}