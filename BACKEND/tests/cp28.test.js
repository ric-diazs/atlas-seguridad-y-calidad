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
    titulo: "Contrato CP-28",
    descripcion: "Contrato CP-28 de cliente 2",
    fecha_inicio: "2026-11-02",
    fecha_fin: "2026-12-02"
};

const archivoPDF = path.resolve(__dirname, "./archivos-contratos/test.pdf");

describe("CP-28: Creación de contrato con documento adjunto (PDF)", () => {
    let loginToken,
        contratoResp;

    beforeAll(async () => {
        const loginResp = await request(API)
            .post("/autenticacion/login")
            .send(loginData);

        loginToken = loginResp.body.token;
    });

    test("Usuario crea un contrato con un archivo PDF adjunto", async () => {
        contratoResp = await request(API)
            .post("/contratos")
            .set("Authorization", `Bearer ${loginToken}`)
            .field("cliente_id", contratoData.cliente_id)
            .field("titulo", contratoData.titulo)
            .field("descripcion", contratoData.descripcion)
            .field("fecha_inicio", contratoData.fecha_inicio)
            .field("fecha_fin", contratoData.fecha_fin)
            .attach("file", archivoPDF, {
                filename: "test.pdf",
                contentType: "application/pdf"
            })

        expect(contratoResp.statusCode).toBe(201);
    });
});
