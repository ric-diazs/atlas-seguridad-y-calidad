const dotenv = require("dotenv");
const path = require("path");
const request = require("supertest");

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

const API = process.env.API_URL;

const loginData = {
    nombre_usuario: "admin",
    password: "admin"
};

describe("CP-38: Revocación del token al cerrar sesión", () => {
    let loginToken;

    beforeAll(async () => {
        const loginResp = await request(API)
            .post("/autenticacion/login")
            .send(loginData);

        loginToken = loginResp.body.token;
    });

    test("Sistema expone mecanismo de logout y rechaza tokens revocados", async () => {
        expect(loginToken).toBeDefined();

        // 1. Se invoca cierre de sesion en el backend
        const logoutResp = await request(API)
            .post("/autenticacion/logout")
            .set("Authorization", `Bearer ${loginToken}`);

        expect(logoutResp.statusCode).not.toBe(404);

        // 2. Reutilizacion de token de autenticacion en ruta protegida post cierre de sesion
        const rutaProtegidaResp = await request(API)
            .get("/clientes")
            .set("Authorization", `Bearer ${loginToken}`);

        expect(rutaProtegidaResp.statusCode).toBe(401);
    });
});
