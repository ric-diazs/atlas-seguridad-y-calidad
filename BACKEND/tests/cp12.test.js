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

const contratoData = {
    cliente_id: 2,
    titulo: "Contrato CP-12",
    descripcion: "Contrato CP-12 para el cliente 2",
    fecha_inicio: "2026-10-04",
    fecha_fin: "2026-11-04"
};

describe("CP-12: Auditoría de contratos (crear, editar, eliminar)", () => {
    let loginToken,
        contratoId;

    beforeAll(async () => {
        const loginResp = await request(API)
            .post("/autenticacion/login")
            .send(loginData);

        loginToken = loginResp.body.token;
    });

    afterAll(async () => pool.end());

    test("1. Registra automaticamente en auditoría la creación de un contrato", async() => {
        const contratoResp = await request(API)
            .post("/contratos")
            .set("Authorization", `Bearer ${loginToken}`)
            .send(contratoData);

        expect(contratoResp.statusCode).toBe(201);

        contratoId = contratoResp.body.id;

        const auditQuery = await pool.query(
            `
            SELECT usuario_id, accion
            FROM auditoria
            WHERE accion LIKE $1
            ORDER BY id DESC
            LIMIT 1
            `,
            ["%CONTRATOS_CREAR: creó contrato%"]
        );

        expect(auditQuery.rows.length).toBe(1);
        expect(auditQuery.rows[0].usuario_id).toBe(loginData.nombre_usuario);
        expect(auditQuery.rows[0].accion).toContain("CONTRATOS_CREAR");
    });

    test("2. Registra automaticamente en auditoría la edición de un contrato", async() => {
        const contratoResp = await request(API)
            .put(`/contratos/${contratoId}`)
            .set("Authorization", `Bearer ${loginToken}`)
            .send({ descripcion: "Contrato ACTUALIZADO CP-12 para el cliente 2" });

        expect(contratoResp.statusCode).toBe(200);

        const auditQuery = await pool.query(
            `
            SELECT usuario_id, accion
            FROM auditoria
            WHERE accion LIKE $1
            ORDER BY id DESC
            LIMIT 1
            `,
            ["%CONTRATOS_ACTUALIZAR: actualizó contrato%"]
        );

        expect(auditQuery.rows.length).toBe(1);
        expect(auditQuery.rows[0].usuario_id).toBe(loginData.nombre_usuario);
        expect(auditQuery.rows[0].accion).toContain("CONTRATOS_ACTUALIZAR");
    });

    test("3. Registra automaticamente en auditoría la eliminación de un contrato", async() => {
        const contratoResp = await request(API)
            .delete(`/contratos/${contratoId}`)
            .set("Authorization", `Bearer ${loginToken}`);

        expect(contratoResp.statusCode).toBe(200);

        const auditQuery = await pool.query(
            `
            SELECT usuario_id, accion
            FROM auditoria
            WHERE accion LIKE $1
            ORDER BY id DESC
            LIMIT 1
            `,
            ["%CONTRATOS_ELIMINAR: eliminó contrato%"]
        );

        expect(auditQuery.rows.length).toBe(1);
        expect(auditQuery.rows[0].usuario_id).toBe(loginData.nombre_usuario);
        expect(auditQuery.rows[0].accion).toContain("CONTRATOS_ELIMINAR");
    });

});

