const request = require("supertest");
const { pool } = require("../db");
const app = require("../app");

describe("CP-09: Auditoría de acciones sobre clientes", () => {
  let tokenAdmin;
  let clienteId;

 // 1. Se inicia sesion con usuario 'admin' antes de hacer las pruebas
  beforeAll(async () => {
    const loginRes = await request(app)
      .post("/autenticacion/login")
      .send({
        nombre_usuario: "admin",
        password: "admin"
      });

    tokenAdmin = loginRes.body.token;
  }, 15000);

  // Cerrar el pool de conexiones de la BD para permitir que Jest finalice limpiamente
  afterAll(async () => {
    await pool.end();
  });

  /*
  ============================================
  Pruebas a cada operacion critica en Clientes
  ============================================
  */
  // Creación de Cliente.
  test("Debe registrar automáticamente la acción de crear un cliente en la tabla de auditoría", async () => {
    const nombreClienteTest = "Cliente CP-09";

    // 2. Ejecutar acción crítica: Crear cliente
    const createRes = await request(app)
      .post("/clientes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: nombreClienteTest,
        correo: "cp09@test.cl",
        telefono: "912345678"
      });

    expect(createRes.statusCode).toBe(201);

    clienteId = createRes.body.id;

    // 3. Consultar la tabla de auditoría en la base de datos para verificar la trazabilidad
    const auditQuery = await pool.query(
      "SELECT * FROM auditoria WHERE accion LIKE $1 ORDER BY id DESC LIMIT 1",
      ["%CLIENTES_CREAR: creó cliente%"]
    );

    // Assertions: Confirmar que el registro existe y se asoció al usuario correcto
    expect(auditQuery.rows.length).toBe(1);
    expect(auditQuery.rows[0].usuario_id).toBe("admin");
    expect(auditQuery.rows[0].accion).toContain("CLIENTES_CREAR");
  }, 10000);

  // Actualizacion de cliente creado anteriormente.
  test("Debe registrar automáticamente la acción de modificar un cliente en la tabla de auditoría", async () => {

    const updateRes = await request(app)
      .put(`/clientes/${clienteId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Cliente CP-09 Actualizado",
        correo: "cp09_actualizado@test.cl"
      });

    expect(updateRes.statusCode).toBe(200);

    const auditQuery = await pool.query(
      "SELECT * FROM auditoria WHERE accion LIKE $1 ORDER BY id DESC LIMIT 1",
      [`%CLIENTES_ACTUALIZAR: actualizó cliente ID ${clienteId}%`]
    );

    // Assertions: Confirmar que el registro existe y se asoció al usuario correcto
    expect(auditQuery.rows.length).toBe(1);
    expect(auditQuery.rows[0].usuario_id).toBe("admin");
    expect(auditQuery.rows[0].accion).toContain("CLIENTES_ACTUALIZAR");
  }, 10000);

  // Eliminar cliente creado
  test("Debe registrar automáticamente la acción de eliminar un cliente en la tabla de auditoría", async () => {
    const deleteRes = await request(app)
      .delete(`/clientes/${clienteId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(deleteRes.statusCode).toBe(200);

    const auditQuery = await pool.query(
      "SELECT * FROM auditoria WHERE accion LIKE $1 ORDER BY id DESC LIMIT 1",
      [`%CLIENTES_ELIMINAR: eliminó cliente ID ${clienteId}%`]
    );

    // Assertions: Confirmar que el registro existe y se asoció al usuario correcto
    expect(auditQuery.rows.length).toBe(1);
    expect(auditQuery.rows[0].usuario_id).toBe("admin");
    expect(auditQuery.rows[0].accion).toContain("CLIENTES_ELIMINAR");
  }, 10000);
});
