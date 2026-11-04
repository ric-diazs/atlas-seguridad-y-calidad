const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../src/db");

//const API = "http://localhost:4450";
//const id = Date.now();

describe("CP-07: Registro de usuario, empresa y rol administrador", () => {
  let res;
  let usuario;
  let empresa;

  afterAll(async () => {
    await pool.end();
  });

  test("Crea usuario y empresa en endpoint /empresas (RF-2.1 y RF-2.2)", async () => {
    res = await request(app)
      .post("/empresas")
      .send({
        usuario: {
          nombre_usuario: "Usuario CP-07",
          contrasena_hash: "Prueba123!",
          correo: "cp07@test.cl"
        },
        empresa: {
            nombre: "Empresa CP-07",
            direccion: "Pedro Aguirre Cerda, Santiago",
            telefono: "912345678",
            correo: "empresacp07@test.cl"
        }
      });

    // Verificacion de creacion de usuario y empresa en endpoint /empresas
    expect(res.statusCode).toBe(201);

    // Verificacion adicional de que el usuario y la empresa se crearon
    usuario = res.body.usuario;
    empresa = res.body.empresa;

    expect(usuario.nombre_usuario).toContain("Usuario CP-07");
    expect(empresa.nombre).toContain("Empresa CP-07");
  });

  test("Verificar que usuario creado tenga rol de administrador (RF-2.3)", async () => {
    const usuarioId = usuario.id;
    const empresaId = empresa.id;

    const queryRol = await pool.query(
      `
      SELECT r.nombre AS rol
      FROM empresa_usuarios eu
      JOIN roles r ON r.id = eu.rol_id
      WHERE eu.empresa_id = $1 AND eu.usuario_id = $2
      `,
      [empresaId, usuarioId]
    );

    expect(queryRol.rows).toHaveLength(1);
    expect(queryRol.rows[0].rol.toLowerCase()).toBe("administrador")
  });
});