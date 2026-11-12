const request = require("supertest");
const app = require("../src/app");

const loginEditorData = {
    nombre_usuario: "editor",
    password: "editor"
};

const contratoData = {
    cliente_id: 2,
    titulo: "Contrato test CP-21",
    fecha_inicio: "2026-10-26",
    fecha_fin: "2026-11-30"
};

describe("CP-21: Editor intenta crear y editar contratos.", () => {
    let tokenEditor;

    beforeAll(async () => {
        const loginEditorResp = await request(app)
            .post("/autenticacion/login")
            .send(loginEditorData);

        tokenEditor = loginEditorResp.body.token;
    });

    test("1. Usuario editor crea un contrato a cliente id 2 y obtiene HTTP 403.", async() => {
        const createContratoResp = await request(app)
            .post("/contratos")
            .set("Authorization", `Bearer ${tokenEditor}`)
            .send(contratoData);

        expect(createContratoResp.statusCode).toBe(403);
    });

    test("2. Usuario editor modifica contrato 1 de cliente id 1 y obtiene HTTP 403.", async () => {
        const updateContratoResp = await request(app)
            .put("/contratos/1")
            .set("Authorization", `Bearer ${tokenEditor}`)
            .send({
                titulo: "Contrato modificado en CP-21"
            });

        expect(updateContratoResp.statusCode).toBe(403);
    });
});
