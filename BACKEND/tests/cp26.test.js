const dotenv = require("dotenv");
const path = require("path");
const request = require("supertest");

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

const API = process.env.API_URL;

const loginData = {
    nombre_usuario: "admin",
    password: "admin"
};

describe("CP-26: Validaciones de campos de datos de clientes (RF-4.3)", () => {
    let token;

    beforeAll(async () => {
        const loginAdminResp = await request(API)
            .post("/autenticacion/login")
            .send(loginData);

        token = loginAdminResp.body.token;
    });

    test("1. Rechaza crear un cliente sin nombre (500)", async () => {
        const clienteCreateResp = await request(API)
            .post("/clientes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                correo: "cliente_cp26@test.cl"
            });

        expect(clienteCreateResp.statusCode).toBe(500);
    });

    test("2. Rechaza crear un cliente sin correo (500)", async () => {
        const clienteCreateResp = await request(API)
            .post("/clientes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                nombre: "Cliente CP-26"
            });

        expect(clienteCreateResp.statusCode).toBe(500);
    });

    test("3. Rechaza crear un cliente con correo inválido (500)", async () => {
        const clienteCreateResp = await request(API)
            .post("/clientes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                nombre: "Cliente CP-26",
                correo: "correo123"
            });

        expect(clienteCreateResp.statusCode).toBe(500);
    });
});
