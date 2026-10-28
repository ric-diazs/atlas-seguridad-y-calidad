const request = require("supertest");

const API = "http://localhost:4450";
jest.setTimeout(20000);

describe("CP-08: Gestión completa de clientes y eliminación lógica", () => {
  let token;
  let cliente;

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

  test("Obtiene el cliente por su ID", async () => {
    const res = await request(API)
      .get(`/clientes/${cliente.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Cliente Jest CP08");
  });

  test("El cliente aparece en el listado", async () => {
    const res = await request(API)
      .get("/clientes")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.some((c) => c.id === cliente.id)).toBe(true);
  });

  test("Edita el cliente", async () => {
    const res = await request(API)
      .put(`/clientes/${cliente.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Cliente Jest CP08 Editado",
        correo: "cliente.cp08@test.cl",
        telefono: "987654321",
        direccion: "Av. Prueba 123, Santiago",
      });
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Cliente Jest CP08 Editado");
    expect(res.body.telefono).toBe("987654321");
  });

  test("Rechaza crear un cliente sin nombre (400)", async () => {
    const res = await request(API)
      .post("/clientes")
      .set("Authorization", `Bearer ${token}`)
      .send({ correo: "sinnombre@test.cl" });
    expect(res.status).toBe(400);
  });

  test("Rechaza operaciones sin token (401)", async () => {
    const res = await request(API).get(`/clientes/${cliente.id}`);
    expect(res.status).toBe(401);
  });

  test("La tabla de clientes tiene un campo para eliminación lógica", () => {
    const campos = Object.keys(cliente);
    expect(campos.some((c) => /activo|eliminado|deleted|borrado|estado/.test(c))).toBe(true);
  });

  test("Elimina el cliente", async () => {
    const res = await request(API)
      .delete(`/clientes/${cliente.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test("La eliminación es lógica (el cliente queda marcado, no borrado)", async () => {
    const res = await request(API)
      .delete(`/clientes/${cliente.id}`)
      .set("Authorization", `Bearer ${token}`);
    // Si fuera lógica, el registro seguiría existiendo y la API lo informaría.
    // Un 404 indica que el registro ya no existe en la base.
    expect(res.status).not.toBe(404);
  });
});