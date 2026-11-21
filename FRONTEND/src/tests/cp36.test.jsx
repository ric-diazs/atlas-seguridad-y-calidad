import ContratosTabList from  "../pages/contratos/ContratosTabList";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("../hooks/useAuth.js", () => ({
    useAuth: () => ({ role: "administrador" })
}));

const hoy = "2026-01-15T12:00:00";

const contratos = [
    {
        id: 1,
        titulo: "Contrato activo",
        cliente_nombre: "Cliente A",
        fecha_inicio: "2026-01-01T12:00:00",
        fecha_fin: "2026-06-01T12:00:00",
    },
    {
        id: 2,
        titulo: "Contrato próximo a vencer",
        cliente_nombre: "Cliente B",
        fecha_inicio: "2026-01-01T12:00:00",
        fecha_fin: "2026-01-25T12:00:00",
    },
    {
        id: 3,
        titulo: "Contrato expirado",
        cliente_nombre: "Cliente C",
        fecha_inicio: "2025-01-01T12:00:00",
        fecha_fin: "2026-01-10T12:00:00",
    },
];

const renderizador = (items = contratos) => {
    return render(
        <MemoryRouter>
            <ContratosTabList items={items} onDelete={vi.fn()} />
        </MemoryRouter>
    );
};

describe("CP-36: Estado del contrato según fechas de inicio y término", () => {
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    test("muestra el estado calculado según las fechas de inicio y término", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(hoy));

        renderizador();

        const filaActivo = screen.getByText("Contrato activo").closest("tr");
        const filaPorVencer = screen
            .getByText("Contrato próximo a vencer")
            .closest("tr");
        const filaExpirado = screen.getByText("Contrato expirado").closest("tr");
        
        expect(within(filaActivo).getByText("Activo")).toBeTruthy();
        expect(within(filaPorVencer).getByText("Vence")).toBeTruthy();
        expect(within(filaExpirado).getByText("Expirado")).toBeTruthy();
    });
});
