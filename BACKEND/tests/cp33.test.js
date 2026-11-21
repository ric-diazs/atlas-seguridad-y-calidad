const dotenv = require("dotenv");
const path = require("path");
const request = require("supertest");

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

const API = process.env.API_URL;

const loginData = {
    nombre_usuario: "admin",
    password: "admin"
};

const contratoData = {
    cliente_id: 2,
    titulo: "Contrato CP-33",
    descripcion: "Contrato CP-33 de cliente 2",
    fecha_inicio: "2026-11-02",
    fecha_fin: "2026-12-02"
};

const archivoTXT = path.resolve(__dirname, "./archivos-contratos/test.txt");

describe("CP-33: Validación de contrato con documento adjunto inválido (TXT)", () => {
    let loginToken,
        contratoResp;

    beforeAll(async () => {
        const loginResp = await request(API)
            .post("/autenticacion/login")
            .send(loginData);

        loginToken = loginResp.body.token;
    });

    test("Rechaza creación de un contrato con un archivo TXT adjunto", async () => {
        contratoResp = await request(API)
            .post("/contratos")
            .set("Authorization", `Bearer ${loginToken}`)
            .field("cliente_id", contratoData.cliente_id)
            .field("titulo", contratoData.titulo)
            .field("descripcion", contratoData.descripcion)
            .field("fecha_inicio", contratoData.fecha_inicio)
            .field("fecha_fin", contratoData.fecha_fin)
            .attach("file", archivoTXT, {
                filename: "test.txt",
                contentType: "text/plain"
            })

        expect(contratoResp.statusCode).toBe(500);
    });
});
