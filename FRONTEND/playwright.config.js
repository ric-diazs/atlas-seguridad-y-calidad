//const { defineConfig } = require("@playwright/test");
import { defineConfig } from "@playwright/test";

/*
    Basado en:

        - Config general: https://playwright.dev/docs/test-configuration
        - Navegadores: https://playwright.dev/docs/test-projects
*/

export default defineConfig({
    // Carpeta donde estan los archivos de test
    testDir: './src/tests',

    // Configs definidos en https://playwright.dev/docs/test-configuration
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    outputDir: 'test-results',

    // Formato en que se mostraran los resultados (por defecto es 'list')
    // Mas en: https://playwright.dev/docs/test-reporters
    reporter: [
        ['list', { printSteps: true }]
    ],

    // Para que 'browserName' funcione, se tiene que haber ejecutado el comando
    // `npx playwright install chronium` al menos una vez en el proyecto.
    use: {
        baseURL: 'http://localhost:3350/',
        browserName: 'chromium',
        trace: 'on-first-retry',
        //screenshot: 'only-on-failure'
    }
});
