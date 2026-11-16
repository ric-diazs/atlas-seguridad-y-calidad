const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../src/db");

// Datos de prueba
const loginData = {
    nombre_usuario: "admin",
    password: "admin"
}

const usuarioCrearData = {
    nombre_usuario: "Usuario Editor CP-22",
    contrasena_hash: "Prueba!123",
    correo: "usuario_cp22@test.cl",
    rol_id: 2
};

describe("CP-22: Almacenamiento de contraseñas con bcrypt", () => {
    let tokenLogin,
        usuarioCreateResp,
        queryPassword;

    beforeAll(async () => {
        const loginResp = await request(app)
            .post("/autenticacion/login")
            .send(loginData);
        
        tokenLogin = loginResp.body.token;

        usuarioCreateResp = await request(app)
            .post("/empresa-usuarios")
            .set("Authorization", `Bearer ${tokenLogin}`)
            .send(usuarioCrearData)
        
        const usuarioId = usuarioCreateResp.body.id;

        queryPassword = await pool.query(
            `
            SELECT id, nombre_usuario, contrasena_hash
            FROM usuarios
            WHERE id = $1
            `,
            [usuarioId]
        );
    });

    afterAll(async () => {
        await pool.end();
    });

    test("1. Contraseña en texto plano no es igual a la registrada en la bbdd", async () => {
        expect(queryPassword.rows[0].contrasena_hash).not.toBe(usuarioCrearData.contrasena_hash);
    });

    test("2. Contraseña esta en formato bcrypt en la bbdd.", async() => {
        // Regex para evaluar si cadena tiene formato bcrypt de 60 caracteres con prefijo $2.
        const bcryptRegex = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;

        expect(queryPassword.rows[0].contrasena_hash).toMatch(bcryptRegex);
    });
})