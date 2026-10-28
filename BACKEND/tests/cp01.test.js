const request = require("supertest");

const API = "http://localhost:4450";
jest.setTimeout(20000);

describe("CP-01: Autenticación exitosa de usuario (backend)", () => {
  test("Con credenciales correctas responde 200 y entrega un token", async () => {
    const res = await request(API)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "admin", password: "admin" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.split(".")).toHaveLength(3);
  });

  test("El token corresponde al usuario admin", async () => {
    const res = await request(API)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "admin", password: "admin" });

    const payload = JSON.parse(
      Buffer.from(res.body.token.split(".")[1], "base64").toString()
    );
    expect(payload.nombreUsuario).toBe("admin");
  });

  test("No devuelve la contraseña en la respuesta", async () => {
    const res = await request(API)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "admin", password: "admin" });

    expect(JSON.stringify(res.body)).not.toContain("password");
    expect(JSON.stringify(res.body)).not.toContain("contrasena");
  });

  test("Con contraseña incorrecta rechaza el acceso (401)", async () => {
    const res = await request(API)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "admin", password: "malaclave" });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test("Con usuario inexistente rechaza el acceso (401)", async () => {
    const res = await request(API)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "noexiste_cp01", password: "admin" });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test("Con campos vacíos rechaza la petición (400)", async () => {
    const res = await request(API)
      .post("/autenticacion/login")
      .send({});

    expect(res.status).toBe(400);
  });

  test("Responde en menos de 2 segundos", async () => {
    const inicio = Date.now();
    await request(API)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "admin", password: "admin" });
    const tiempo = Date.now() - inicio;

    expect(tiempo).toBeLessThan(2000);
  });
});