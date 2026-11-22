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
    cliente_id: 1,
    titulo: "Contrato CP-15",
    descripcion: "Contrato CP-15 para el cliente 1",
    fecha_inicio: "2026-07-12",
    fecha_fin: "2026-12-12"
};

const archivoPDF = path.resolve(__dirname, "./archivos-contratos/test.pdf");

describe("CP-15: Auditoría de descarga de documentos", () => {
    let loginToken;

    beforeAll(async () => {
        const loginResp = await request(API)
            .post("/autenticacion/login")
            .send(loginData);

        loginToken = loginResp.body.token;
    });

    afterAll(async () => pool.end());

    test("Registra automáticamente en auditoría descarga de documento asociado a un contrato", async () => {
        const contratoResp = await request(API)
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

        const contratoGetResp = await request(API)
            .get(`/contratos/${contratoId}/file`)
            .set("Authorization", `Bearer ${loginToken}`);
        
        expect(contratoGetResp.statusCode).toBe(200);

        const auditQuery = pool.query(
            `
            SELECT usuario_id, accion
            FROM auditoria
            WHERE accion LIKE $1
            ORDER BY id DESC
            LIMIT 1
            `,
            ["%DOCUMENTOS_DESCARGAR: descargó documento%"]
        );

        expect(auditQuery.rows.length).toBe(1);
        expect(auditQuery.rows[0].usuario_id).toBe(loginData.nombre_usuario);
        expect(auditQuery.rows[0].accion).toContain("DOCUMENTOS_DESCARGAR");
    });
});
