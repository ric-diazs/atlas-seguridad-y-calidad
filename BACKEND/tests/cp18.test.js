const request = require("supertest");
const app = require("../src/app");

const usuarioAdminData = {
    nombre_usuario: "Usuario Admin CP-18",
    contrasena_hash: "Prueba123!",
    correo: "cp18_admin@test.cl"
};

const direccionEmpresa = {
    calle: "Av. CP-18",
    comuna: "Santiago",
    region: "Metropolitana"
};

const empresaAdminData = {
    nombre: "Empresa Test CP-18",
    direccion: `${direccionEmpresa.calle}, ${direccionEmpresa.comuna}, ${direccionEmpresa.region}`,
    telefono: "+56299911113",
    correo: "test_cp18@test.cl"
};

const usuarioEditorData = {
    nombre_usuario: "Usuario Editor CP-18",
    contrasena_hash: "Prueba789!",
    correo: "cp18_editor@test.cl",
    rol_id: 2
}

const loginData = {
    nombre_usuario: usuarioAdminData.nombre_usuario,
    password: usuarioAdminData.contrasena_hash
};

describe("CP-18: Admin modifica los datos y el rol de un usuario (RF-3.3)", () => {
    let tokenLogin,
        usuarioEditorCreateResp;

    // Se comienza con un usuario admin ya creado y con una empresa vinculada (distinto a usuario 'admin':'admin')
    beforeAll(async () => {
        const usuarioCreateResp = await request(app)
            .post("/empresas")
            .send({usuario: usuarioAdminData, empresa: empresaAdminData});

        expect(usuarioCreateResp.statusCode).toBe(201);

        const loginResp = await request(app)
            .post("/autenticacion/login")
            .send(loginData);

        tokenLogin = loginResp.body.token;
    });
    
    test("1. Usuario con rol de administrador crea un usuario con rol editor.", async () => {
        usuarioEditorCreateResp = await request(app)
            .post("/empresa-usuarios")
            .set("Authorization", `Bearer ${tokenLogin}`)
            .send(usuarioEditorData);

        expect(usuarioEditorCreateResp.statusCode).toBe(201);
    });

    test("2. Usuario con rol administrador modifica datos de usuario editor", async () => {
        const idUserEditor = usuarioEditorCreateResp.body.id;

        const usuarioEditorUpdateResp = await request(app)
            .put(`/usuarios/${idUserEditor}`)
            .set("Authorization", `Bearer ${tokenLogin}`)
            .send({
                nombre_usuario: "Usuario Editor CP-18 Actualizado",
                contrasena_hash: "Prueba789!actualizada",
                correo: "cp18_editor_v2@test.cl"
            });

        expect(usuarioEditorUpdateResp.statusCode).toBe(200);

    });
});
