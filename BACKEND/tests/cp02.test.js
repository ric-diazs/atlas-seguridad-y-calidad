const request = require("supertest");
const app = require("../app");

describe("CP-02: Restricción de permisos para rol editor (RF-3.2 / RB-4)", () => {
  let tokenEditor;
  let clientePruebaId;

  beforeAll(async () => {
    // 1. Iniciar sesión real con la cuenta 'editor'
    const loginRes = await request(app)
      .post("/autenticacion/login")
      .send({
        nombre_usuario: "editor",
        password: "editor"
      });

    tokenEditor = loginRes.body.token;

    // 2. Intentar crear un cliente borrable de prueba
    const clientRes = await request(app)
      .post("/clientes")
      .set("Authorization", `Bearer ${tokenEditor}`)
      .send({
        nombre: "Cliente Test Borrado",
        correo: "test_borrado@empresa.cl",
        telefono: "12345678"
      });

    if (clientRes.body && clientRes.body.id) {
      clientePruebaId = clientRes.body.id;
    } else {
      clientePruebaId = 99999; // ID inexistente para probar el rechazo por rol
    }
  }, 15000);

  test("Debe rechazar con HTTP 403 cuando un usuario con rol editor intenta eliminar un cliente", async () => {
    // 3. Intentar eliminar el cliente con el token de editor
    const res = await request(app)
      .delete(`/clientes/${clientePruebaId}`)
      .set("Authorization", `Bearer ${tokenEditor}`);

    // Asertar que el backend rechace la operación con código HTTP 403 (Forbidden)
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  }, 10000);
});
