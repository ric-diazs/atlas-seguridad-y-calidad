import test, { expect } from "@playwright/test";

/* Datos de prueba */
const loginData = {
    nombre_usuario: "admin",
    password: "admin"
};

const usuarioEditorData = {
    nombre_usuario: "Usuario Editor CP-19",
    correo: "cp19_editor@test.cl",
    contrasena_hash: "Prueba789!",
    rol: "Editor"
}

const usuarioEditorActualizado = {
    nombre_usuario: "Usuario Editor CP-19 Actualizado",
    correo: "cp19_editor_update@test.cl",
    contrasena_hash: "Prueba789!012"
};

let idUsuarioCreado;

test("CP-19", async ({ page }) => {
    await test.step("1. Usuario admin inicia sesión.", async () => {
        // Se evalua si comenzamos en la pagina de login
        await page.goto('/login');
        await expect(page).toHaveURL('/login');
        await expect(page.getByRole('heading', { name: /Iniciar Sesión/ })).toBeVisible();

        // Inicio de sesion
        await page.getByTestId('input-nombre-usuario').fill(loginData.nombre_usuario);
        await page.getByTestId('input-password').fill(loginData.password);
        await page.getByTestId('button-login').click();

        // Se evalua que el toast de inicio de sesion exitoso aparece
        await expect(page.getByText("Sesión iniciada", { exact: true })).toBeVisible();

        await expect(page).toHaveURL("/home");
    });

    await test.step("2. Usuario admin navega a vista 'usuarios'.", async () => {
        await page.getByTestId('link-nav-usuarios').click();
        await expect(page).toHaveURL("/usuarios");
        await expect(page.getByRole('heading', { name: 'Usuarios registrados en tu empresa' })).toBeVisible();
    })

    await test.step("3. Usuario admin navega a pestaña 'Crear Usuario'.", async () => {
        // Se navega hasta el formulario de registro de usuario y se crea uno.
        await page.getByRole('tab', { name: 'Crear Usuario' }).click()
        await expect(page.getByRole('heading', { name: 'Crear nuevo usuario' })).toBeVisible();
    });

    await test.step("4. Usuario admin crear un nuevo usuario de rol 'editor'.", async () => {
        await page.getByLabel("Nombre de usuario").fill(usuarioEditorData.nombre_usuario);
        await page.getByLabel("Correo electrónico").fill(usuarioEditorData.correo);
        await page.getByLabel("Contraseña").fill(usuarioEditorData.contrasena_hash);

        // Seleccion del rol 'editor'
        await page.getByRole('combobox', { name: "Rol" }).click();
        await page.getByRole("option", { name: usuarioEditorData.rol }, { exact: true }).click();
        await expect(page.getByRole('combobox', { name: "Rol" })).toHaveText(usuarioEditorData.rol);

        // Se crea una espera a la respuesta del metodo POST (REVISAR POR ERROR)
        const respuestaPromise = page.waitForResponse(response => {
            const url = new URL(response.url());

            return(
                response.request().method() === "POST" && 
                url.pathname.endsWith("/empresa-usuarios")
            )
        });

        // Se registra el usuario
        await page.getByRole('button', { name: "Crear Usuario" }).click();

        // Se obtiene el ID del usuario luego de haber ejecutado el metodo POST
        const body = await (await respuestaPromise).json();
        idUsuarioCreado = body.id;

        // Aparece el toast con mensaje de exito
        await expect(page.getByText("Usuario creado", {exact: true})).toBeVisible()
    });

    await test.step("5. Usuario admin vuelve automáticamente a lista de usuarios.", async () => {
        await expect(page).toHaveURL("/usuarios");
        await expect(page.getByRole('heading', { name: 'Usuarios registrados en tu empresa' })).toBeVisible();
    });

    await test.step("6. Usuario admin navega a formulario de edicion del usuario creado", async () => {
        await page.getByTestId(`button-usuario-editar-${idUsuarioCreado}`).click();
        await expect(page).toHaveURL(`/usuarios/${idUsuarioCreado}/editar`);
        await expect(page.getByRole("heading", { name: "Editar Información del Usuario" })).toBeVisible();
    });

    await test.step("7. Usuario admin edita información del usuario creado.", async () => {
        await page.getByTestId("input-usuario-correo").clear();
        await page.getByTestId("input-usuario-correo").fill(usuarioEditorActualizado.correo);

        await page.getByTestId("button-usuario-actualizar").click();

        await expect.soft(page.getByText("Información del usuario actualizada", { exact: true })).toBeVisible();
    });

    await test.step("8. Usuario admin edita contraseña del usuario creado.", async () => {
        await page.getByTestId("input-usuario-password").clear();
        await page.getByTestId("input-usuario-password").fill(usuarioEditorActualizado.contrasena_hash);

        await page.getByTestId("input-usuario-confirmar-password").clear();
        await page.getByTestId("input-usuario-confirmar-password").fill(usuarioEditorActualizado.contrasena_hash);

        await page.getByTestId("button-usuario-actualizar-password").click();

        await expect.soft(page.getByText("Contraseña actualizada", { exact: true })).toBeVisible();
    });
});
