const dotenv = require("dotenv");
const path = require("path");
const request = require("supertest");

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

const { pool } = require("../src/db");

const API = process.env.API_URL;

const loginData = {
    nombre_usuario: "admin",
    password: "admin"
};

const usuarioData = {
    nombre_usuario: "Usuario Test CP-13",
    contrasena_hash: "Prueba123!",
    correo: "usuario_cp13@test.cl"
};

describe("CP-13: Auditoría de usuarios (crear, editar, eliminar)", () => {
    let loginToken,
        usuarioId;

    beforeAll(async () => {
        const loginResp = await request(API)
            .post("/autenticacion/login")
            .send(loginData);

        loginToken = loginResp.body.token;
    });

    afterAll(async () => pool.end());

    test("1. Registra automaticamente en auditoría la creación de un usuario", async () => {
        const usuarioResp = await request(API)
            .post("/usuarios")
            .set("Authorization", `Bearer ${loginToken}`)
            .send(usuarioData);

        expect(usuarioResp.statusCode).toBe(201);

        usuarioId = usuarioResp.body.id;

        const auditQuery = await pool.query(
            `
            SELECT usuario_id, accion
            FROM auditoria
            WHERE accion LIKE $1
            ORDER BY id DESC
            LIMIT 1
            `,
            ["%USUARIOS_CREAR: creó usuario%"]
        );

        expect(auditQuery.rows.length).toBe(1);
        expect(auditQuery.rows[0].usuario_id).toBe(loginData.nombre_usuario);
        expect(auditQuery.rows[0].accion).toContain("USUARIOS_CREAR");
    });

    test("2. Registra automaticamente en auditoría la actualización de un usuario", async () => {
        const usuarioResp = await request(API)
            .put(`/usuarios/${usuarioId}`)
            .set("Authorization", `Bearer ${loginToken}`)
            .send({ nombre_usuario: "Usuario Test ACTUALIZADO CP-13" });

        expect(usuarioResp.statusCode).toBe(200);

        const auditQuery = await pool.query(
            `
            SELECT usuario_id, accion
            FROM auditoria
            WHERE accion LIKE $1
            ORDER BY id DESC
            LIMIT 1
            `,
            ["%USUARIOS_ACTUALIZAR: actualizó usuario%"]
        );

        expect(auditQuery.rows.length).toBe(1);
        expect(auditQuery.rows[0].usuario_id).toBe(loginData.nombre_usuario);
        expect(auditQuery.rows[0].accion).toContain("USUARIOS_ACTUALIZAR");
    });

    test("3. Registra automaticamente en auditoría la eliminación de un usuario", async () => {
        const usuarioResp = await request(API)
            .delete(`/usuarios/${usuarioId}`)
            .set("Authorization", `Bearer ${loginToken}`);

        expect(usuarioResp.statusCode).toBe(200);

        const auditQuery = await pool.query(
            `
            SELECT usuario_id, accion
            FROM auditoria
            WHERE accion LIKE $1
            ORDER BY id DESC
            LIMIT 1
            `,
            ["%USUARIOS_ELIMINAR: eliminó usuario%"]
        );

        expect(auditQuery.rows.length).toBe(1);
        expect(auditQuery.rows[0].usuario_id).toBe(loginData.nombre_usuario);
        expect(auditQuery.rows[0].accion).toContain("USUARIOS_ELIMINAR");
    });
});
