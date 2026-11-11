const request = require("supertest");
const app = require("../src/app");

const loginData = {
    nombre_usuario: "admin",
    password: "admin"
};

const usuarioEliminarData = {
    nombre_usuario: "Usuario Editor CP-20",
    contrasena_hash: "Prueba!123",
    correo: "usuario_cp20@test.cl",
    rol_id: 2
};

describe("CP-20: Admin elimina un usuario de la empresa.", () => {
    let tokenLogin,
        usuarioCreateResp;

    beforeAll(async () => {
        const loginResp = await request(app)
            .post("/autenticacion/login")
            .send(loginData);

        tokenLogin = loginResp.body.token;
    });

    test("1. Usuario admin crea al usuario a eliminar", async () => {
        usuarioCreateResp = await request(app)
            .post("/empresa-usuarios")
            .set("Authorization", `Bearer ${tokenLogin}`)
            .send(usuarioEliminarData);

        expect(usuarioCreateResp.statusCode).toBe(201);
    });

    test("2. Usuario admin elimina a usuario creado", async() => {
        const idUsuarioDelete = usuarioCreateResp.body.id;

        const usuarioDeleteResp = await request(app)
            .delete(`/usuarios/${idUsuarioDelete}`)
            .set("Authorization", `Bearer ${tokenLogin}`);

        expect(usuarioDeleteResp.statusCode).toBe(200);
    });
});
