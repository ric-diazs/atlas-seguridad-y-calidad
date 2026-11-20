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
    cliente_id: 1,
    titulo: "Contrato CP-03",
    descripcion: "Contrato CP-03 de cliente 1",
    fecha_inicio: "2026-11-02",
    fecha_fin: "2026-12-02"
};

// funcion para convertir string de fechas en string de fechas formato ISO
const convertToISO = fecha => {
    const [anio, mes, dia] = fecha.split("-").map(Number);

    const fechaISO = new Date(Date.UTC(anio, mes - 1, dia));

    const fechaISOString = fechaISO.toISOString();

    return fechaISOString;
};

describe("CP-03: Creación de contrato", () => {
    let loginToken,
        contratoResp;

    beforeAll(async () => {
        const loginResp = await request(API)
            .post("/autenticacion/login")
            .send(loginData);

        loginToken = loginResp.body.token;
    });

    test("1. Usuario administrador crea un contrato asociado a un cliente", async () => {
        contratoResp = await request(API)
            .post("/contratos")
            .set("Authorization", `Bearer ${loginToken}`)
            .send(contratoData);

        expect(contratoResp.statusCode).toBe(201);

        // Las fechas del response del metodo POST vienen en formato ISO
        const fechaInicioISO = convertToISO(contratoData.fecha_inicio);
        const fechaFinISO = convertToISO(contratoData.fecha_fin);

        expect(contratoResp.body.titulo).toBe(contratoData.titulo);
        expect(contratoResp.body.descripcion).toBe(contratoData.descripcion);
        expect(contratoResp.body.fecha_inicio).toBe(fechaInicioISO);
        expect(contratoResp.body.fecha_fin).toBe(fechaFinISO);
    });

    test("2. El contrato está asociado a un cliente de la empresa del usuario", async () => {
        const clienteId = contratoResp.body.cliente_id;

        const clienteResp = await request(API)
            .get(`/clientes/${clienteId}`)
            .set("Authorization", `Bearer ${loginToken}`);

        expect(clienteResp.statusCode).toBe(200);
    });
});
