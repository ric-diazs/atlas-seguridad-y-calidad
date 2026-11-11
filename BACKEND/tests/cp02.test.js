const request = require("supertest");
const app = require("../src/app");

const loginAdminData = {
  nombre_usuario: "admin",
  password: "admin"
};

const loginEditorData = {
  nombre_usuario: "editor",
  password: "editor"
};

// Este cliente es solo para la prueba de crear uno
const clienteDataCreate = {
  nombre: "Cliente CP-02",
  correo: "cliente_cp02@test.cl",
  telefono: "12345678"
};

// Cliente para las pruebas de modificar y eliminar un cliente
const clienteDataTest = {
    nombre: "Cliente Test CP-02",
    correo: "test@test.com"
};

describe("CP-02: Restricción de permisos para rol editor (RF-3.2 / RB-4)", () => {
  let tokenEditor;
  let tokenAdmin;
  let clienteTestId;

  beforeAll(async () => {
    // 1. Inicia sesión real con la cuenta 'admin'
    const loginAdminResp = await request(app)
      .post("/autenticacion/login")
      .send(loginAdminData);

    tokenAdmin = loginAdminResp.body.token;

    // 2. Crea el cliente para las pruebas de Editar y Eliminar cliente
    const clientTestResp = await request(app)
      .post("/clientes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(clienteDataTest);

    clienteTestId = clientTestResp.body.id;

    tokenAdmin = null;
  }, 15000);

  test("1. Rechaza con HTTP 403 cuando un usuario editor intenta crear un cliente", async () => {
    const loginEditorResp = await request(app)
      .post("/autenticacion/login")
      .send(loginEditorData);

    tokenEditor = loginEditorResp.body.token;

    const clientRespCreate = await request(app)
      .post("/clientes")
      .set("Authorization", `Bearer ${tokenEditor}`)
      .send(clienteDataCreate);

    expect(clientRespCreate.statusCode).toBe(403);
  });

  test("2. Rechazar con HTTP 403 cuando un usuario editor intenta modificar un cliente", async () => {
    const clientRespUpdate = await request(app)
      .put(`/clientes/${clienteTestId}`)
      .set("Authorization", `Bearer ${tokenEditor}`)
      .send({
        nombre: "Cliente Test CP-02 Actualizado",
        correo: "test_v2@test.cl"
      });

    expect(clientRespUpdate.statusCode).toBe(403);
  });

  test("3. Rechaza con HTTP 403 cuando un usuario editor intenta eliminar un cliente", async () => {
    // 3. Intentar eliminar el cliente con el token de editor
    const res = await request(app)
      .delete(`/clientes/${clienteTestId}`)
      .set("Authorization", `Bearer ${tokenEditor}`);

    // Asertar que el backend rechace la operación con código HTTP 403 (Forbidden)
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  }, 10000);
});
