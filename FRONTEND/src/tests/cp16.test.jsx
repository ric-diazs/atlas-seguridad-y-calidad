import { MemoryRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "../context/AuthContext";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import { RequireAdmin, RequireAuth } from "../components/RoleGuard";
import Home from "../pages/Home";
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { api } from "../lib/api";
import { toast } from "sonner";
import EmpresaForm from "../pages/empresas/EmpresaForm";

/*
=======
Helpers
=======
*/
// Labels de los formularios de login, registro de usuario y empresa
const loginLabels = [/Nombre de usuario/, /Contraseña/];
const registroUsuarioLabels = [/Nombre de usuario/, /Correo electrónico/, /Contraseña/];
const registroEmpresaLabels = [/Nombre de la empresa/, /Calle/, /Comuna/, /Región/, /Teléfono/, /Correo corporativo/]

// Datos de prueba
const usuarioData = {
    nombre_usuario: "prueba_cp07",
    contrasena_hash: "Prueba123!",
    correo: "prueba_cp07@test.cl"
};

const usuarioFormData = {
    nombre_usuario: usuarioData.nombre_usuario,
    correo: usuarioData.correo,
    contrasena: usuarioData.contrasena_hash
};

const loginData = {
    nombre_usuario: usuarioData.nombre_usuario,
    password: usuarioData.contrasena_hash
};

const direccionData = {
    calle: "Pedro Aguirre Cerda",
    comuna: "Santiago",
    region: "Metropolitana"
};

const empresaData = {
    nombre: "Empresa CP07",
    direccion: `${direccionData.calle}, ${direccionData.comuna}, ${direccionData.region}`,
    telefono: "912345678",
    correo: "empresa@test.cl",
};

const empresaFormData = {
    nombre: empresaData.nombre,
    calle: direccionData.calle,
    comuna: direccionData.comuna,
    region: direccionData.region,
    telefono: empresaData.telefono,
    correo: empresaData.correo,
};

// Funciones
vi.mock("../lib/api.jsx", () => ({
    api: {
        post: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn().mockImplementation((url) => {
            if(url.startsWith("/empresas")){
                return Promise.resolve({ data: empresaData });
            }

            return Promise.resolve({
                data: {
                    metricas: {
                        totalUsuarios: 0,
                        totalClientes: 0,
                        contratos7Dias: 0,
                        contratos15Dias: 0,
                        contratos30Dias: 0,
                    },
                    contratosProximosAVencer: [],
                    contratosVencidos: [],
                }
            });
        }),
        put: vi.fn().mockResolvedValue({ data: {} })
    },
    setAuthToken: vi.fn()
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Las rutas en las que se navegara durante la prueba
const renderizador = () => {
    render(
        <AuthProvider>
            <MemoryRouter initialEntries={["/login"]}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/registro" element={<Register />} />
                    <Route
                        path="/home"
                        element={
                            <RequireAuth>
                                <Home />
                            </RequireAuth>
                        }
                    />
                   <Route path="/empresas/:id/editar" element={<RequireAdmin><EmpresaForm /></RequireAdmin>} /> 
                </Routes>
            </MemoryRouter>
        </AuthProvider>
    );
};

const getByRole = (rol, opcion) => screen.getByRole(rol, {name: opcion});
const getByLabelText = (textoLabel) => screen.getByLabelText(textoLabel);
const getByTestId = (textoTestId) => screen.getByTestId(textoTestId);

const findByRole = async(rol, opcion) => await screen.findByRole(rol, {name: opcion});

const registroUsuario = async() => {
    // Ingresa el texto en los inputs
    for(let i = 0; i < registroUsuarioLabels.length; i++) {
        await userEvent.type(getByLabelText(registroUsuarioLabels[i]), Object.values(usuarioFormData)[i]);
    }
    
    // Presiona el boton para crear usuario
    await userEvent.click(getByRole("button", "Continuar"));
};

const registroEmpresa = async() => {
    // Ingresa el texto en los inputs
    for(let i = 0; i < registroEmpresaLabels.length; i++) {
        await userEvent.type(getByLabelText(registroEmpresaLabels[i]), Object.values(empresaFormData)[i]);
    }
    
    // Presiona el boton para crear usuario
    await userEvent.click(getByRole("button", "Crear cuenta"));
};

const inicioSesion = async() => {
   // Ingresa el texto en los inputs
    for(let i = 0; i < loginLabels.length; i++) {
        await userEvent.type(getByLabelText(loginLabels[i]), Object.values(loginData)[i]);
    }
    
    // Presiona el boton para crear usuario
    await userEvent.click(getByRole("button", "Entrar"));
};

/*
=======
Pruebas
=======
*/
describe("CP-16: Acceso al dashboard y administración de los datos de la empresa", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    test("1. Navega desde el Login al Registro", async () => {
        /* Por defecto, se comienza en la vista de Login */
        renderizador();

        /* Paso 1: Se verifica que el usuario esta en la vista de Login */
        expect(getByRole("heading", /Iniciar Sesión/)).toBeInTheDocument();

        // Labels del formulario de Login
        for(let i = 0; i < loginLabels.length; i++) {
            expect(getByLabelText(loginLabels[i])).toBeInTheDocument();
        }

        expect(getByRole("button", "Entrar")).toBeInTheDocument();

        // El link es un componente de React en Login, pero tiene su atributo "data-testid" definido
        expect(getByTestId("link-registro")).toBeInTheDocument();

        /* Paso 2: Navegacion desde el Login a Registro */
        await userEvent.click(getByTestId("link-registro"));
        expect(await findByRole("heading", /Información del Usuario/)).toBeInTheDocument();
    });

    test("2. Registra usuario, empresa y vuelve automáticamente al login", async () => {
        // Empieza en Login
        renderizador();

        // Navega a Registro
        await userEvent.click(getByTestId("link-registro"));
        expect(await findByRole("heading", /Información del Usuario/)).toBeInTheDocument();

        // Registra usuario.
        await registroUsuario();
        expect(await findByRole("heading", /Información de la Empresa/)).toBeInTheDocument();

        // Registra empresa (de ser exitoso, debe volver al Login).
        await registroEmpresa();

        expect(api.post).toHaveBeenCalledWith(
            "/empresas",
            expect.objectContaining({
                usuario: expect.objectContaining(usuarioData),
                empresa: expect.objectContaining(empresaData)
            })
        );

        expect(toast.success).toHaveBeenCalledWith("Cuenta creada exitosamente, ahora inicia sesión");

        // Debe volver al Login
        expect(await findByRole("heading", /Iniciar Sesión/)).toBeInTheDocument();
    });

    test("3. Inicia sesion con usuario nuevo, ingresa al dashboard y modifica empresa", async () => {
        // Pasos del test 2
        renderizador();
        await userEvent.click(getByTestId("link-registro"));
        await registroUsuario();
        await registroEmpresa();

        expect(api.post).toHaveBeenCalledWith(
            "/empresas",
            expect.objectContaining({
                usuario: expect.objectContaining(usuarioData),
                empresa: expect.objectContaining(empresaData)
            })
        );

        expect(toast.success).toHaveBeenCalledWith("Cuenta creada exitosamente, ahora inicia sesión");

        expect(await findByRole("heading", /Iniciar Sesión/)).toBeInTheDocument();

        // Pasos del test 3.

        // Inicia sesion con los datos registrados
        /*
          Token ficticio generado en jwt.io con payload:
            {
              "sub": "123",
              "empresaId": "123",
              "usuarioId": "456",
              "admin": true
            }
        */
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbXByZXNhSWQiOiIxMjMiLCJ1c3VhcmlvSWQiOiI0NTYiLCJhZG1pbiI6dHJ1ZX0.rAqHKfoitKWdrB5I92gv2eoSMWA7sc2-ucu4LZZn15A";

        api.post.mockResolvedValueOnce({ data: { token } });

        await inicioSesion();

        expect(api.post).toHaveBeenCalledWith("/autenticacion/login", loginData);

        expect(toast.success).toHaveBeenCalledWith("Sesión iniciada");

        // Debe estar en el Home donde esta el Dashboard
        const encabezado = await findByRole("heading", /Bienvenido/);

        expect(encabezado).toHaveTextContent(
            `Bienvenido, ${usuarioData.nombre_usuario}`
        );

        await userEvent.click(getByRole("button", /Editar Empresa/));

        expect(await findByRole("heading", /Editar Información de la Empresa/)).toBeInTheDocument();

        const empresaNombreUpdated = "Empresa CP-16 Actualizado";

        await userEvent.clear(getByTestId("input-empresa-nombre"));

        await userEvent.type(getByTestId("input-empresa-nombre"), empresaNombreUpdated);

        await userEvent.click(getByTestId("button-empresa-guardar"));

        expect(api.put).toHaveBeenCalledWith(
            expect.stringMatching(/^\/empresas\//),
            expect.objectContaining({
                nombre: empresaNombreUpdated,
                direccion: expect.any(String),
                telefono: expect.any(String),
                correo: expect.any(String)
            })
        );

        expect(toast.success).toHaveBeenCalledWith("Información de la empresa actualizada");
    });
});
