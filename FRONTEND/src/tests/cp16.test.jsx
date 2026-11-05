import { MemoryRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "../context/AuthContext";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import { RequireAuth } from "../components/RoleGuard";
import Home from "../pages/Home";
import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { api } from "../lib/api";

/*
=======
Helpers
=======
*/
// Funciones
vi.mock("../lib/api.jsx", () => ({
    api: {
        post: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn().mockResolvedValue({
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
        })
    },
    setAuthToken: vi.fn()
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
                </Routes>
            </MemoryRouter>
        </AuthProvider>
    );
};

const getByRole = (rol, opcion) => screen.getByRole(rol, {name: opcion});
const getByLabelText = (textoLabel) => screen.getByLabelText(textoLabel);
const getByTestId = (textoTestId) => screen.getByTestId(textoTestId);

const findByRole = async(rol, opcion) => await screen.findByRole(rol, {name: opcion});
const findByText = async(texto) => await screen.findByText(texto);

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

    test("2. Registra usuario, empresa, inicia sesion y llega al dashboard", async () => {
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

        // Debe volver al Login
        expect(await findByRole("heading", /Iniciar Sesión/)).toBeInTheDocument();

        // Inicia sesion con los datos registrados
        // Token ficticio generado en jwt.io
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";

        api.post.mockResolvedValueOnce({ data: { token } });

        await inicioSesion();

        expect(api.post).toHaveBeenCalledWith("/autenticacion/login", loginData);

        // Debe estar en el Home donde esta el Dashboard
        const encabezado = await screen.findByRole("heading", {
            name: /Bienvenido/,
        });

        expect(encabezado).toHaveTextContent(
            `Bienvenido, ${usuarioData.nombre_usuario}`
        );
    });
});
