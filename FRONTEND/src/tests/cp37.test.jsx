import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthProvider from "../context/AuthContext";
import Layout from "../components/Layout";
import { beforeEach, describe, expect, test, vi } from  "vitest";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";


vi.mock("../lib/api.jsx", () => ({
    api: { post: vi.fn() },
    setAuthToken: vi.fn()
}));

/*
// Token generado en jwt.io mediante el siguiente payload
    { 
        usuarioId: 1, 
        nombreUsuario: "admin",
        empresaUsuarioId: 1,
        empresaId: 1,
        iat: 1795286700, // (valor UNIX timestamp convertido de 2026-11-21 18:45:00)
        exp: 1795293900  // (valor UNIX timestamp convertido de 2026-11-21 20:45:00)
    }
*/
const tokenSimulado = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvSWQiOjEsIm5vbWJyZVVzdWFyaW8iOiJhZG1pbiIsImVtcHJlc2FVc3VhcmlvSWQiOjEsImVtcHJlc2FJZCI6MSwiaWF0IjoxNzk1Mjg2NzAwLCJleHAiOjE3OTUyOTM5MDB9.zjm1vv1QidPIFnjACQJeSd0KZyFaUkBjriDGg1HuZUE";

const testData = {
    token: tokenSimulado,
    user: {
        usuarioId: 1,
        nombre_usuario: "admin"
    },
    role: "administrador"
};

const renderizador = () => {
    render(
        <MemoryRouter initialEntries={["/home"]}>
            <AuthProvider>
                <Layout />
            </AuthProvider>
        </MemoryRouter>
    );
};

describe("CP-37: Cierre de sesión", () => {
    // Antes de cada prueba se limpia el localStorage y se recarga una sesion activa
    beforeEach(() => {
        localStorage.clear();

        // Recarga de sesion activa
        localStorage.setItem("token", testData.token);
        
        localStorage.setItem(
            "user",
            JSON.stringify(testData.user)
        );

        localStorage.setItem("role", testData.role);
    });

    test("Al dar click en 'Cerrar sesión', se eliminan token y user de localStorage", async() => {
        renderizador();

        // Se verifica que la sesion se haya iniciado
        expect(localStorage.getItem("token")).toBe(testData.token);
        expect(screen.getByText("admin")).toBeTruthy();

        // Ejecuta evento 'click' en boton "Cerrar sesion"
        await userEvent.click(screen.getByTestId("button-layout-logout"));

        // Se verifica que las credenciales locales fueron eliminadas
        expect(localStorage.getItem("token")).toBeNull();
        expect(localStorage.getItem("user")).toBeNull();
    });
});
