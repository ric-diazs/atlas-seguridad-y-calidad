const dotenv = require("dotenv");
const path = require("path");
const request = require("supertest");
const jwt = require("jsonwebtoken");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.test"), override: true });

const API = process.env.API_URL;
jest.setTimeout(20000);
const JWT_SECRET = process.env.JWT_SECRET;

describe("CP-08: Gestión completa de clientes", () => {
  let token;
  let cliente;
  let authUser;

  beforeAll(async () => {
    const login = await request(API)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "admin", password: "admin" });
    token = login.body.token;
  });

  test("Crea un cliente (201)", async () => {
    const res = await request(API)
      .post("/clientes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Cliente Jest CP08",
        correo: "cliente.cp08@test.cl",
        telefono: "912345678",
        direccion: "Av. Prueba 123, Santiago",
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    cliente = res.body;
  });

  test("Edita el cliente", async () => {
    const res = await request(API)
      .put(`/clientes/${cliente.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Cliente Jest CP08 Editado",
        correo: "cliente.cp08@test.cl",
      });
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Cliente Jest CP08 Editado");
  });

  test("Elimina el cliente", async () => {
    const res = await request(API)
      .delete(`/clientes/${cliente.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test("Lista clientes por empresa", async () => {
    // Obtener id de empresa mediante JWT
    authUser = jwt.verify(token, JWT_SECRET); // Payload decodificado de JWT
    const empresaId = authUser.empresaId;     // Id de la empresa asociada al usuario autenticado

    const listaClientesResp = await request(API)
      .get("/clientes/search")
      .set("Authorization", `Bearer ${token}`);

      expect(listaClientesResp.statusCode).toBe(200);

      // Se verifica que cada empresa_id del listado sea igual al del usuario autenticado
      expect(listaClientesResp.body.some(cliente => cliente.empresa_id === empresaId)).toBe(true);
  });
});