import { test, expect } from '@playwright/test';

test.describe('InzuConnect - Flux d\'Authentification', () => {
  
  test('La page de connexion s\'affiche et permet de saisir les identifiants', async ({ page }) => {
    // Aller à la page de connexion
    await page.goto('/login');

    // Vérifier que le formulaire est affiché
    await expect(page.getByText('Connectez-vous pour louer ou réserver')).toBeVisible();
    await expect(page.getByText('Adresse Email', { exact: true })).toBeVisible();
    await expect(page.getByText('Mot de passe', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();

    // Entrer des informations factices
    await page.getByPlaceholder('votre@email.com').fill('test@inzuconnect.com');
    await page.getByPlaceholder('••••••••').fill('password123');

    // On ne soumet pas réellement pour ne pas polluer la DB dans ce test simple de l'interface
  });

  test('La page d\'inscription s\'affiche correctement', async ({ page }) => {
    // Aller à la page d'inscription
    await page.goto('/register');

    // Vérifier les champs du formulaire d'inscription
    await expect(page.getByText('Créez votre compte de confiance')).toBeVisible();
    await expect(page.getByText('Nom Complet', { exact: true })).toBeVisible();
    await expect(page.getByText('Adresse Email', { exact: true })).toBeVisible();
    await expect(page.getByText('Mot de passe', { exact: true })).toBeVisible();
    await expect(page.getByText('Rôle souhaité', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Créer mon compte' })).toBeVisible();
  });

});
