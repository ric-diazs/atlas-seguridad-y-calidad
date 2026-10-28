import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, test, expect, beforeEach } from "vitest";
import { toast } from "sonner";
import Register from "../pages/auth/Register";

const { mockPost, mockNavigate } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("../lib/api.jsx", () => ({
  api: { post: mockPost },
}));

vi.mock("react-router-dom", async (original) => {
  const actual = await original();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function mostrarRegistro() {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

async function llenarPasoUsuario() {
  await userEvent.type(screen.getByLabelText(/Nombre de usuario/), "prueba_cp07");
  await userEvent.type(screen.getByLabelText(/Correo electrónico/), "prueba_cp07@test.cl");
  await userEvent.type(screen.getByLabelText(/Contraseña/), "Prueba123!");
  await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

async function llenarPasoEmpresa() {
  await userEvent.type(screen.getByLabelText(/Nombre de la empresa/), "Empresa CP07");
  await userEvent.type(screen.getByLabelText(/Calle/), "Pedro Aguirre Cerda");
  await userEvent.type(screen.getByLabelText(/Comuna/), "Santiago");
  await userEvent.type(screen.getByLabelText(/Región/), "Metropolitana");
  await userEvent.type(screen.getByLabelText(/Teléfono/), "912345678");
  await userEvent.type(screen.getByLabelText(/Correo corporativo/), "empresa@test.cl");
  await userEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
}

describe("CP-07: Registro de usuario, creación de empresa y rol administrador (frontend)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Muestra el paso 1 con los datos del usuario", () => {
    mostrarRegistro();
    expect(screen.getByRole("heading", { name: "Información del Usuario" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de usuario/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo electrónico/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
  });

  test("No avanza al paso 2 si los campos están vacíos", async () => {
    mostrarRegistro();
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("heading", { name: "Información del Usuario" })).toBeInTheDocument();
  });

  test("Con los datos del usuario completos pasa al paso 2 (empresa)", async () => {
    mostrarRegistro();
    await llenarPasoUsuario();
    expect(
      await screen.findByRole("heading", { name: "Información de la Empresa" })
    ).toBeInTheDocument();
  });

  test("El botón Volver regresa al paso 1", async () => {
    mostrarRegistro();
    await llenarPasoUsuario();
    await screen.findByRole("heading", { name: "Información de la Empresa" });
    await userEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.getByRole("heading", { name: "Información del Usuario" })).toBeInTheDocument();
  });

  test("Envía usuario y empresa juntos al backend y redirige al login", async () => {
    mockPost.mockResolvedValue({ data: {} });
    mostrarRegistro();
    await llenarPasoUsuario();
    await screen.findByRole("heading", { name: "Información de la Empresa" });
    await llenarPasoEmpresa();

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/empresas", {
        usuario: {
          nombre_usuario: "prueba_cp07",
          contrasena_hash: "Prueba123!",
          correo: "prueba_cp07@test.cl",
        },
        empresa: {
          nombre: "Empresa CP07",
          direccion: "Pedro Aguirre Cerda, Santiago, Metropolitana",
          telefono: "912345678",
          correo: "empresa@test.cl",
        },
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Cuenta creada exitosamente, ahora inicia sesión"
      );
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("Si el backend falla, no redirige al login", async () => {
    mockPost.mockRejectedValue(new Error("500"));
    mostrarRegistro();
    await llenarPasoUsuario();
    await screen.findByRole("heading", { name: "Información de la Empresa" });
    await llenarPasoEmpresa();

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});