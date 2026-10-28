const request = require("supertest");

const API = "http://localhost:4450";
const id = Date.now();

describe("CP-07: Registro de usuario, empresa y rol administrador", () => {
  let res;

  beforeAll(async () => {
    res = await request(API)
      .post("/empresas")
      .send({
        empresa: {
          nombre: `Empresa Jest ${id}`,
          direccion: "Pedro Aguirre Cerda, Santiago",
          telefono: "912345678",
          correo: `empresa${id}@test.cl`,
        },
        usuario: {
          nombre_usuario: `jest_${id}`,
          contrasena_hash: "Prueba123!",
          correo: `jest_${id}@test.cl`,
        },
      });
  });

  test("Responde 201 (creado)", () => {
    expect(res.status).toBe(201);
  });

  test("Crea el usuario con ID", () => {
    expect(res.body.usuario.id).toBeDefined();
  });

  test("Crea la empresa con ID", () => {
    expect(res.body.empresa.id).toBeDefined();
  });

  test("No devuelve la contraseña", () => {
    expect(JSON.stringify(res.body)).not.toContain("Prueba123!");
  });

  test("El usuario nuevo puede iniciar sesión", async () => {
    const login = await request(API)
      .post("/autenticacion/login")
      .send({ nombre_usuario: `jest_${id}`, password: "Prueba123!" });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();
  }, 15000);

  test("La respuesta informa el rol administrador", () => {
    expect(JSON.stringify(res.body).toLowerCase()).toContain("admin");
  });
});