import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, test, expect, beforeEach } from "vitest";
import { toast } from "sonner";
import Login from "../pages/auth/Login";

const { mockLogin, mockNavigate } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ login: mockLogin, loading: false }),
}));

vi.mock("react-router-dom", async (original) => {
  const actual = await original();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function mostrarLogin() {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe("CP-01: Autenticación exitosa de usuario (frontend)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Muestra el formulario de login", () => {
    mostrarLogin();
    expect(screen.getByLabelText("Nombre de usuario")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  test("Con credenciales correctas inicia sesión y va al inicio", async () => {
    mockLogin.mockResolvedValue({ token: "token-falso" });
    mostrarLogin();

    await userEvent.type(screen.getByLabelText("Nombre de usuario"), "admin");
    await userEvent.type(screen.getByLabelText("Contraseña"), "admin");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        nombre_usuario: "admin",
        password: "admin",
      });
      expect(toast.success).toHaveBeenCalledWith("Sesión iniciada");
      expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
    });
  });

  test("Con credenciales incorrectas muestra error y no avanza", async () => {
    mockLogin.mockRejectedValue(new Error("401"));
    mostrarLogin();

    await userEvent.type(screen.getByLabelText("Nombre de usuario"), "admin");
    await userEvent.type(screen.getByLabelText("Contraseña"), "malaclave");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Credenciales inválidas");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("No envía el formulario si los campos están vacíos", async () => {
    mostrarLogin();
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(mockLogin).not.toHaveBeenCalled();
  });
});