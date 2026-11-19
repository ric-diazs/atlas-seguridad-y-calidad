import { render, screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import ClientesTabList from "../pages/clientes/ClientesTabList";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("../hooks/useAuth.js", () => ({
    useAuth: () => ({ role: "administrador" })
}));

// Datos de prueba
const clienteData = {
    id: 1,
    nombre: "Cliente CP 27",
    correo: "cliente_cp27@test.cl"
};

const renderizador = (onDelete = vi.fn()) => {
    render(
        <MemoryRouter>
            <ClientesTabList
                items={ [clienteData] }
                onDelete={onDelete}
                onLoad={vi.fn()}
            />
        </MemoryRouter>
    )

    return onDelete;
};

describe("CP-27: Validación de eliminación lógica de cliente", () => {
    test("1. Muestra el diálogo de confirmación al clickear botón de eliminar y permite cancelar", async () =>{
        const onDelete = renderizador();

        await userEvent.click(
            screen.getByTestId("button-cliente-eliminar-1")
        );

        const dialogElement = await screen.findByRole("dialog");

        expect(
            within(dialogElement).getByText(/¿estás seguro de que deseas eliminar/i)
        ).toBeInTheDocument();

        expect(
            within(dialogElement).getByText(clienteData.nombre)
        ).toBeInTheDocument();

        await userEvent.click(
            within(dialogElement).getByTestId("button-cliente-eliminar-cancelar")
        );

        await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));

        expect(onDelete).not.toHaveBeenCalled();
    });

    test("2. Se ejecuta método 'onDelete' al clickear 'Eliminar' en dialogo para eliminar un cliente.", async () => {
        const onDelete = renderizador();

        await userEvent.click(
            screen.getByTestId("button-cliente-eliminar-1")
        );

        const dialogElement = await screen.findByRole("dialog");

        expect(
            within(dialogElement).getByText(/¿estás seguro de que deseas eliminar/i)
        ).toBeInTheDocument();

        expect(
            within(dialogElement).getByText(clienteData.nombre)
        ).toBeInTheDocument();

        await userEvent.click(
            within(dialogElement).getByTestId("button-cliente-eliminar-confirmar")
        );

        expect(onDelete).toHaveBeenCalledOnce();
        expect(onDelete).toHaveBeenCalledWith(1);

        await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
    });
});
