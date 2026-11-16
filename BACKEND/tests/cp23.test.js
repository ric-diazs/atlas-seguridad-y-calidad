const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../src/db");

// Datos de prueba
const loginAdminData = {
    nombre_usuario: "admin",
    password: "admin"
};

const clienteData = {
    nombre: "Cliente CP-23",
    correo: "cliente_cp23@test.cl",
    rut: "9.123.456-k",
    nombre_banco: "Banco CP-23",
    numero_cuenta: "000-111-222-333",
    titular_cuenta: "CP-23",
    metodo_pago: "Transferencia",
    dia_pago: "5",
    moneda: "CLP"
};

describe("CP-23: Cifrado de RUT y datos bancarios de un cliente (NFR-SEG-3)", () => {
    let tokenLogin,
        clienteCreateResp,
        clienteId,
        queryCliente;

    beforeAll(async () => {
        const adminLoginResp = await request(app)
            .post("/autenticacion/login")
            .send(loginAdminData);

        tokenLogin = adminLoginResp.body.token;
    });

    afterAll(async () => {
        await pool.end();
    });

    test("1. Usuario administrador crea exitosamente un cliente", async () => {
        clienteCreateResp = await request(app)
            .post("/clientes")
            .set("Authorization", `Bearer ${tokenLogin}`)
            .send(clienteData);

        expect(clienteCreateResp.statusCode).toBe(201);

        clienteId = clienteCreateResp.body.id;
    });

    test("2. RUT del cliente debe estar cifrado en la base de datos", async () => {
        queryCliente = await pool.query(
            `
            SELECT id,
                   rut,
                   nombre_banco,
                   numero_cuenta,
                   titular_cuenta,
                   metodo_pago,
                   dia_pago,
                   moneda
            FROM clientes
            WHERE id = $1
            `,
            [clienteId]
        );
        
        expect(queryCliente.rows.length).toBe(1);

        // Se espera que el RUT en la base de datos sea distinto del payload
        expect(queryCliente.rows[0].rut).not.toBe(clienteData.rut);
        expect(queryCliente.rows[0].rut).toEqual(expect.any(String));
        expect(queryCliente.rows[0].rut.length).not.toBeGreaterThan(clienteData.rut.length);
    });

    test("3. Nombre del banco del cliente debe estar cifrado en la base de datos", async () => {
        expect(queryCliente.rows[0].nombre_banco).not.toBe(clienteData.nombre_banco);
        expect(queryCliente.rows[0].nombre_banco).toEqual(expect.any(String));
        expect(queryCliente.rows[0].nombre_banco.length).not.toBeGreaterThan(clienteData.nombre_banco.length);
    });

    test("4. Numero de la cuenta del cliente debe estar cifrado en la base de datos", async () => {
        expect(queryCliente.rows[0].numero_cuenta).not.toBe(clienteData.numero_cuenta);
        expect(queryCliente.rows[0].numero_cuenta).toEqual(expect.any(String));
        expect(queryCliente.rows[0].numero_cuenta.length).not.toBeGreaterThan(clienteData.numero_cuenta.length);
    });

    test("5. Nombre del titular de la cuenta del cliente debe estar cifrado en la base de datos", async () => {
        expect(queryCliente.rows[0].titular_cuenta).not.toBe(clienteData.titular_cuenta);
        expect(queryCliente.rows[0].titular_cuenta).toEqual(expect.any(String));
        expect(queryCliente.rows[0].titular_cuenta.length).not.toBeGreaterThan(clienteData.titular_cuenta.length);
    });

    test("6. Metodo de pago de la cuenta del cliente debe estar cifrado en la base de datos", async () => {
        expect(queryCliente.rows[0].metodo_pago).not.toBe(clienteData.metodo_pago);
        expect(queryCliente.rows[0].metodo_pago).toEqual(expect.any(String));
        expect(queryCliente.rows[0].metodo_pago.length).not.toBeGreaterThan(clienteData.metodo_pago.length);
    });

    test("7. Día de pago del cliente debe estar cifrado en la base de datos", async () => {
        expect(queryCliente.rows[0].dia_pago).not.toBe(clienteData.dia_pago);
        expect(queryCliente.rows[0].dia_pago).toEqual(expect.any(String));
        expect(queryCliente.rows[0].dia_pago.length).not.toBeGreaterThan(clienteData.dia_pago.length);
    });

    test("8. Moneda registrada por el cliente debe estar cifrado en la base de datos", async () => {
        expect(queryCliente.rows[0].moneda).not.toBe(clienteData.moneda);
        expect(queryCliente.rows[0].moneda).toEqual(expect.any(String));
        expect(queryCliente.rows[0].moneda.length).not.toBeGreaterThan(clienteData.moneda.length);
    });
});
