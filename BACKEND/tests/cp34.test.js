const dotenv = require("dotenv");
const path = require("path");
const request = require("supertest");

dotenv.config({ path: path.resolve(__dirname, "../.env.test")});

const { pool } = require("../src/db");

const API = process.env.API_URL;

const loginData = {
    nombre_usuario: "admin",
    password: "admin"
};

const contratoData = {
    cliente_id: 1,
    titulo: "Contrato CP-34",
    descripcion: "Contrato CP-34 de cliente 2",
    fecha_inicio: "2026-11-08",
    fecha_fin: "2026-12-07"
};

const archivoPDF = path.resolve(__dirname, "./archivos-contratos/test.pdf");

describe("CP-34: Almacenamiento del documento en storage interno", () => {
    let loginToken,
        contratoResp;

    beforeAll(async () => {
        const loginResp = await request(API)
            .post("/autenticacion/login")
            .send(loginData);

        loginToken = loginResp.body.token;
    });

    afterAll(async () => {
        await pool.end();
    });

    test("Se guarda una URL al documento en la base de datos", async () => {
        let url;

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

        const contratoId = contratoResp.body.id;

        // Consulta del documento adjunto al contrato en la base de datos
        const queryDocuContrato = await pool.query(
            `
            SELECT document
            FROM documentos_contrato
            WHERE contract_id = $1
            `,
            [contratoId]
        );

        const valorGuardado = Buffer
            .from(queryDocuContrato.rows[0].document)
            .toString();

        expect(() => url = new URL(valorGuardado)).not.toThrow();
    });
});
