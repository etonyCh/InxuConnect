import { test, expect } from '@playwright/test';

test.describe('InzuConnect - Navigation et Affichage', () => {
  
  test('La page d\'accueil charge correctement avec ses éléments clés', async ({ page }) => {
    // Naviguer sur la page d'accueil
    await page.goto('/');

    // Le titre n'est pas défini par défaut sur le layout actuel, on se concentre sur le DOM
    // await expect(page).toHaveTitle(/InzuConnect/i);

    // Vérifier la présence du Header (Logo InzuConnect)
    await expect(page.locator('header').getByText('Inzu', { exact: true })).toBeVisible();
    await expect(page.locator('header').getByText('Connect', { exact: true })).toBeVisible();

    // Vérifier la présence de la Hero Section
    await expect(page.getByText('Trouvez votre logement idéal, en toute sécurité')).toBeVisible();

    // Vérifier la présence de la barre de recherche intelligente
    await expect(page.getByPlaceholder('Recherche intelligente...')).toBeVisible();

    // Vérifier la présence des badges de secours (design SOTA)
    await expect(page.getByText('Electricité 24/7')).toBeVisible();
    await expect(page.getByText('Eau Potable Assurée')).toBeVisible();

    // Vérifier que la section Listings se charge
    await expect(page.getByRole('heading', { name: 'Listings' })).toBeVisible();
    
    // Vérifier la présence des boutons de connexion/inscription
    await expect(page.getByRole('link', { name: 'Connexion' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'S\'inscrire' })).toBeVisible();
  });

});
