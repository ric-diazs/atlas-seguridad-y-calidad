const dotenv = require("dotenv");
const path = require("path");
const request = require("supertest");

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

const API = process.env.API_URL;

const loginData = {
    nombre_usuario: "admin",
    password: "admin"
};

describe("CP-05: Protección del registro de auditoría frente a lecturas no autorizadas", () => {
    let loginToken;

    beforeAll(async () => {
        const loginResp = await request(API)
            .post("/autenticacion/login")
            .send(loginData);

        loginToken = loginResp.body.token;
    });

    test("1. Petición de lectura de logs de auditoría con usuario autenticado", async () => {
        const auditoriaAuthResp = await request(API)
            .get("/auditoria")
            .set("Authenticacion", `Bearer ${loginToken}`);

        expect(auditoriaAuthResp.statusCode).toBe(200);
    });

    test("2. Petición de lectura de logs de auditoría sin autenticación", async () => {
        const auditoriaAuthResp = await request(API)
            .get("/auditoria");

        expect(auditoriaAuthResp.statusCode).toBe(401);
    });
});
