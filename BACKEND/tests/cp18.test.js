const request = require("supertest");
const app = require("../src/app");

// Datos de prueba
const loginData = {
    nombre_usuario: "admin",
    password: "admin"
};

const usuarioEditorData = {
    nombre_usuario: "Usuario Editor CP-18",
    contrasena_hash: "Prueba789!",
    correo: "cp18_editor@test.cl",
    rol_id: 2
}

describe("CP-18: Admin modifica los datos de un usuario desde el servidor. (RF-3.3)", () => {
    let tokenLogin,
        usuarioEditorCreateResp;

    beforeAll(async () => {
        const loginResp = await request(app)
            .post("/autenticacion/login")
            .send(loginData);

        tokenLogin = loginResp.body.token;
    });

    afterAll(async () => tokenLogin = null);
    
    test("1. Usuario con rol de administrador crea un usuario con rol editor.", async () => {
        usuarioEditorCreateResp = await request(app)
            .post("/empresa-usuarios")
            .set("Authorization", `Bearer ${tokenLogin}`)
            .send(usuarioEditorData);

        expect(usuarioEditorCreateResp.statusCode).toBe(201);
    });

    test("2. Usuario con rol administrador modifica datos de usuario editor", async () => {
        const idUserEditor = usuarioEditorCreateResp.body.id;

        const usuarioEditorUpdateResp = await request(app)
            .put(`/usuarios/${idUserEditor}`)
            .set("Authorization", `Bearer ${tokenLogin}`)
            .send({
                nombre_usuario: "Usuario Editor CP-18 Actualizado",
                contrasena_hash: "Prueba789!actualizada",
                correo: "cp18_editor_v2@test.cl"
            });

        expect(usuarioEditorUpdateResp.statusCode).toBe(200);

    });

    test("3. Se inicia sesion con usuario editor actualizado", async () => {
        const usuarioEditorLoginResp = await request(app)
            .post("/autenticacion/login")
            .send({
                nombre_usuario: "Usuario Editor CP-18 Actualizado",
                password: "Prueba789!actualizada"
            });

        expect(usuarioEditorLoginResp.statusCode).toBe(200);
    });
});
