const request = require("supertest");
const { pool } = require("../db");
const app = require("../app");

describe("CP-09: Generación automática de registros de auditoría ante acciones críticas (RF-6.1 / RB-6)", () => {
  let tokenAdmin;

  beforeAll(async () => {
    // 1. Iniciar sesión como admin
    const loginRes = await request(app)
      .post("/autenticacion/login")
      .send({
        nombre_usuario: "admin",
        password: "admin"
      });

    tokenAdmin = loginRes.body.token;
  }, 15000);

  afterAll(async () => {
    // Cerrar el pool de conexiones de la BD para permitir que Jest finalice limpiamente
    await pool.end();
  });

  test("Debe registrar automáticamente la acción en la tabla de auditoría al crear un cliente", async () => {
    const nombreClienteTest = `Cliente Audit Test ${Date.now()}`;

    // 2. Ejecutar acción crítica: Crear cliente
    const createRes = await request(app)
      .post("/clientes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: nombreClienteTest,
        correo: "audit@test.cl",
        telefono: "912345678"
      });

    expect(createRes.statusCode).toBe(201);

    // 3. Consultar la tabla de auditoría en la base de datos para verificar la trazabilidad
    const auditQuery = await pool.query(
      "SELECT * FROM auditoria WHERE accion LIKE $1 ORDER BY id DESC LIMIT 1",
      [`%CLIENTES_CREAR: creó cliente ${nombreClienteTest}%`]
    );

    // Assertions: Confirmar que el registro existe y se asoció al usuario correcto
    expect(auditQuery.rows.length).toBe(1);
    expect(auditQuery.rows[0].usuario_id).toBe("admin");
    expect(auditQuery.rows[0].accion).toContain(nombreClienteTest);
  }, 10000);
});
