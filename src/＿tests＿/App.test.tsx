import { describe, test, expect } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "../App";

describe("App", () => {
    test("アプリタイトルが表示されている", () => {
        render(<App />);
        expect(
            screen.getByRole("heading", { name: "Todoアプリ!" })
        ).toBeInTheDocument();
    });

    test("TODOを追加することができる", () => {
        render(<App />);

        const input = screen.getByRole("textbox", { name: "新しいタスクを入力" })
        const addButton = screen.getByRole("button", { name: "追加" })

        fireEvent.change(input, { target: { value: "テストタスク" } });
        fireEvent.click(addButton);

        const list = screen.getByRole("list")
        expect(within(list).getByText("テストタスク")).toBeInTheDocument();
    });

    test("TODOを完了することができる", () => {
        render(<App />);

        const input = screen.getByRole("textbox", { name: "新しいタスクを入力" })
        const addButton = screen.getByRole("button", { name: "追加" })

        fireEvent.change(input, { target: { value: "テストタスク" } });
        fireEvent.click(addButton);

        const checkbox = screen.getAllByRole("checkbox")[0];
        fireEvent.click(checkbox);

        expect(checkbox).toBeChecked();
    });

    test("完了したTODOの数が表示されている", () => {
        render(<App />);

        const input = screen.getByRole("textbox", { name: "新しいタスクを入力" })
        const addButton = screen.getByRole("button", { name: "追加" })

        fireEvent.change(input, { target: { value: "テストタスク1" } });
        fireEvent.click(addButton);

        fireEvent.change(input, { target: { value: "テストタスク2" } });
        fireEvent.click(addButton);

        const checkbox = screen.getAllByRole("checkbox")[1];
        fireEvent.click(checkbox);

        expect(screen.getByText("完了済み: 1 / 2")).toBeInTheDocument();
    });

    test("TODOがない場合はTODOがないことを示すメッセージが表示されている", () => {
        render(<App />);
        expect(screen.getByText("タスクがありません")).toBeInTheDocument();
        expect(screen.getByText("新しいタスクを追加してください")).toBeInTheDocument();
    });

    test("空のTODOは追加されない", () => {
        render(<App />);

        const input = screen.getByRole("textbox", {name: "新しいタスクを入力"});
        const addButton = screen.getByRole("button", { name: "追加" });

        fireEvent.change(input, { target: { value: "" } });
        fireEvent.click(addButton);

        expect(screen.getByText("タスクがありません")).toBeInTheDocument();
    });

    test("TODOを削除することができる", () => {
        render(<App />);

        const input = screen.getByRole("textbox", { name: "新しいタスクを入力" });
        const addButton = screen.getByRole("button", { name: "追加" });

        fireEvent.change(input, { target: { value: "削除するタスク" } });
        fireEvent.click(addButton);

        const list = screen.getByRole("list");
        expect(within(list).getByText("削除するタスク")).toBeInTheDocument();

        const deleteButton = screen.getByRole("button", { name: "タスクを削除" });
        fireEvent.click(deleteButton);

        expect(screen.queryByText("削除するタスク")).not.toBeInTheDocument();
    });

    test("複数TODOのうち特定の1件だけ削除できる", () => {
        render(<App />);

        const input = screen.getByRole("textbox", { name: "新しいタスクを入力" });
        const addButton = screen.getByRole("button", { name: "追加" });

        fireEvent.change(input, { target: { value: "タスク1" } });
        fireEvent.click(addButton);
        fireEvent.change(input, { target: { value: "タスク2" } });
        fireEvent.click(addButton);

        const deleteButtons = screen.getAllByRole("button", { name: "タスクを削除" });
        fireEvent.click(deleteButtons[0]);

        expect(screen.queryByText("タスク1")).not.toBeInTheDocument();
        expect(screen.getByText("タスク2")).toBeInTheDocument();
    });

    test("全TODOを削除するとタスクなしメッセージが表示される", () => {
        render(<App />);

        const input = screen.getByRole("textbox", { name: "新しいタスクを入力" });
        const addButton = screen.getByRole("button", { name: "追加" });

        fireEvent.change(input, { target: { value: "消えるタスク" } });
        fireEvent.click(addButton);

        const deleteButton = screen.getByRole("button", { name: "タスクを削除" });
        fireEvent.click(deleteButton);

        expect(screen.getByText("タスクがありません")).toBeInTheDocument();
    });
});