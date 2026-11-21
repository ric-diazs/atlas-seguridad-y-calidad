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
    titulo: "Contrato CP-31",
    descripcion: "Contrato CP-31 de cliente 2",
    fecha_inicio: "2026-11-02",
    fecha_fin: "2026-12-02"
};

const archivoJPG = path.resolve(__dirname, "./archivos-contratos/test.jpg");

describe("CP-31: Creación de contrato con documento adjunto (JPG)", () => {
    let loginToken,
        contratoResp;

    beforeAll(async () => {
        const loginResp = await request(API)
            .post("/autenticacion/login")
            .send(loginData);

        loginToken = loginResp.body.token;
    });

    test("Usuario crea un contrato con un archivo JPG adjunto", async () => {
        contratoResp = await request(API)
            .post("/contratos")
            .set("Authorization", `Bearer ${loginToken}`)
            .field("cliente_id", contratoData.cliente_id)
            .field("titulo", contratoData.titulo)
            .field("descripcion", contratoData.descripcion)
            .field("fecha_inicio", contratoData.fecha_inicio)
            .field("fecha_fin", contratoData.fecha_fin)
            .attach("file", archivoJPG, {
                filename: "test.jpg",
                contentType: "image/jpeg"
            })

        expect(contratoResp.statusCode).toBe(201);
    });

});
