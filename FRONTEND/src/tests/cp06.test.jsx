import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, test, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import Login from "../pages/auth/Login";

const { mockLogin } = vi.hoisted(() => ({ mockLogin: vi.fn() }));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ login: mockLogin, loading: false }),
}));

vi.mock("react-router-dom", async (original) => {
  const actual = await original();
  return { ...actual, useNavigate: () => vi.fn() };
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

describe("CP-06: Validación de accesibilidad para adultos mayores (frontend)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Los campos tienen una etiqueta visible asociada", () => {
    mostrarLogin();
    expect(screen.getByLabelText("Nombre de usuario")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
  });

  test("Todos los botones tienen un nombre accesible", () => {
    mostrarLogin();
    screen.getAllByRole("button").forEach((boton) => {
      expect(boton).toHaveAccessibleName();
    });
  });

  test("Las imágenes tienen texto alternativo", () => {
    mostrarLogin();
    screen.getAllByRole("img").forEach((imagen) => {
      expect(imagen).toHaveAttribute("alt");
      expect(imagen.getAttribute("alt")).not.toBe("");
    });
  });

  test("La página tiene un título principal claro", () => {
    mostrarLogin();
    expect(
      screen.getByRole("heading", { name: "Iniciar Sesión" })
    ).toBeInTheDocument();
  });

  test("Se puede iniciar sesión usando solo el teclado", async () => {
    mockLogin.mockResolvedValue({ token: "token-falso" });
    mostrarLogin();

    await userEvent.tab();
    expect(screen.getByLabelText("Nombre de usuario")).toHaveFocus();
    await userEvent.keyboard("admin");

    await userEvent.tab();
    expect(screen.getByLabelText("Contraseña")).toHaveFocus();
    await userEvent.keyboard("admin{Enter}");

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  test("El idioma de la página está declarado en español", () => {
    const html = fs.readFileSync(
      path.resolve(process.cwd(), "index.html"),
      "utf-8"
    );
    expect(html).toMatch(/<html[^>]*lang="es/);
  });
});