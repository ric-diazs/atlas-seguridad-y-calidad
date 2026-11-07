const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../src/db");

// Datos de prueba
const loginData = {
    nombre_usuario: "admin",
    password: "admin"
}

const userDataAdmin = {
    nombre_usuario: "Usuario Admin CP-17",
    contrasena_hash: "Prueba123!",
    correo: "cp17_admin@test.cl",
    rol_id: 1
}

const userDataEditor = {
    nombre_usuario: "Usuario Editor CP-17",
    contrasena_hash: "Prueba789!",
    correo: "cp17_editor@test.cl",
    rol_id: 2
}

describe("CP-17: Admin crea usuarios y asigna rol editor y administrador (RF-3.1)", () => {
    let usuarioLogin,
        usuarioCreadoAdmin,
        usuarioCreadoEditor,
        tokenAdmin;
    
    beforeAll(async() => {
        usuarioLogin = await request(app)
            .post("/autenticacion/login")
            .send(loginData);
        
        tokenAdmin = usuarioLogin.body.token;
    });

    afterAll(async() => {
        tokenAdmin = null;
        await pool.end();
    });

    test("1. Usuario admin crea usuario con rol 'administrador'", async () => {
        usuarioCreadoAdmin = await request(app)
            .post("/empresa-usuarios")
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(userDataAdmin)
        
        expect(usuarioCreadoAdmin.statusCode).toBe(201);
    });

    test("2. Usuario admin crea usuario con rol 'editor'", async () => {
        usuarioCreadoEditor = await request(app)
            .post("/empresa-usuarios")
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(userDataEditor)
        
        expect(usuarioCreadoEditor.statusCode).toBe(201);
    });
});
