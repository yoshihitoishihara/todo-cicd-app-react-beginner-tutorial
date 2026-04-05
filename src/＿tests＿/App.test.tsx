import { describe, test, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import App from "../App";

// Firestore のインメモリストア
const mockState = vi.hoisted(() => {
  const state = {
    todos: [] as Array<{ id: string; title: string; completed: boolean }>,
    subscribers: [] as Array<(snap: any) => void>,
    notify() {
      const snapshot = {
        docs: state.todos.map((todo) => ({
          id: todo.id,
          data: () => ({ title: todo.title, completed: todo.completed }),
        })),
      };
      state.subscribers.forEach((cb) => cb(snapshot));
    },
    reset() {
      state.todos = [];
      state.subscribers = [];
    },
  };
  return state;
});

vi.mock("../firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "todos-collection"),
  doc: vi.fn((_db: unknown, _col: string, id: string) => `doc:${id}`),
  query: vi.fn((ref: unknown) => ref),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => 0),
  onSnapshot: vi.fn((_ref: unknown, cb: (snap: any) => void) => {
    mockState.subscribers.push(cb);
    mockState.notify();
    return () => {
      mockState.subscribers = mockState.subscribers.filter((s) => s !== cb);
    };
  }),
  addDoc: vi.fn(async (_col: unknown, data: { title: string; completed: boolean }) => {
    const id = `id-${mockState.todos.length}`;
    mockState.todos.push({ id, title: data.title, completed: data.completed });
    mockState.notify();
    return { id };
  }),
  deleteDoc: vi.fn(async (docRef: string) => {
    const id = docRef.replace("doc:", "");
    mockState.todos = mockState.todos.filter((t) => t.id !== id);
    mockState.notify();
  }),
  updateDoc: vi.fn(async (docRef: string, data: Partial<{ completed: boolean }>) => {
    const id = docRef.replace("doc:", "");
    const idx = mockState.todos.findIndex((t) => t.id === id);
    if (idx >= 0) {
      mockState.todos[idx] = { ...mockState.todos[idx], ...data };
    }
    mockState.notify();
  }),
}));

beforeEach(() => {
  mockState.reset();
});

describe("App", () => {
  test("アプリタイトルが表示されている", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "買い物メモアプリ!" })
    ).toBeInTheDocument();
  });

  test("TODOを追加することができる", async () => {
    render(<App />);

    const input = screen.getByRole("textbox", { name: "新しいタスクを入力" });
    const addButton = screen.getByRole("button", { name: "追加" });

    fireEvent.change(input, { target: { value: "テストタスク" } });
    fireEvent.click(addButton);

    const list = await screen.findByRole("list");
    expect(within(list).getByText("テストタスク")).toBeInTheDocument();
  });

  test("TODOを完了することができる", async () => {
    render(<App />);

    const input = screen.getByRole("textbox", { name: "新しいタスクを入力" });
    const addButton = screen.getByRole("button", { name: "追加" });

    fireEvent.change(input, { target: { value: "テストタスク" } });
    fireEvent.click(addButton);

    await screen.findByRole("list");

    const checkbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
    });
  });

  test("完了したTODOの数が表示されている", async () => {
    render(<App />);

    const input = screen.getByRole("textbox", { name: "新しいタスクを入力" });
    const addButton = screen.getByRole("button", { name: "追加" });

    fireEvent.change(input, { target: { value: "テストタスク1" } });
    fireEvent.click(addButton);
    await screen.findByText("テストタスク1");

    fireEvent.change(input, { target: { value: "テストタスク2" } });
    fireEvent.click(addButton);
    await screen.findByText("テストタスク2");

    const checkbox = screen.getAllByRole("checkbox")[1];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText("完了済み: 1 / 2")).toBeInTheDocument();
    });
  });

  test("TODOがない場合はTODOがないことを示すメッセージが表示されている", () => {
    render(<App />);
    expect(screen.getByText("タスクがありません")).toBeInTheDocument();
    expect(screen.getByText("新しいタスクを追加してください")).toBeInTheDocument();
  });

  test("空のTODOは追加されない", async () => {
    render(<App />);

    const input = screen.getByRole("textbox", { name: "新しいタスクを入力" });
    const addButton = screen.getByRole("button", { name: "追加" });

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(addButton);

    expect(screen.getByText("タスクがありません")).toBeInTheDocument();
  });

  test("TODOを削除することができる", async () => {
    render(<App />);

    const input = screen.getByRole("textbox", { name: "新しいタスクを入力" });
    const addButton = screen.getByRole("button", { name: "追加" });

    fireEvent.change(input, { target: { value: "削除するタスク" } });
    fireEvent.click(addButton);

    const list = await screen.findByRole("list");
    expect(within(list).getByText("削除するタスク")).toBeInTheDocument();

    const deleteButton = screen.getByRole("button", { name: "タスクを削除" });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText("削除するタスク")).not.toBeInTheDocument();
    });
  });

  test("複数TODOのうち特定の1件だけ削除できる", async () => {
    render(<App />);

    const input = screen.getByRole("textbox", { name: "新しいタスクを入力" });
    const addButton = screen.getByRole("button", { name: "追加" });

    fireEvent.change(input, { target: { value: "タスク1" } });
    fireEvent.click(addButton);
    await screen.findByText("タスク1");

    fireEvent.change(input, { target: { value: "タスク2" } });
    fireEvent.click(addButton);
    await screen.findByText("タスク2");

    const deleteButtons = screen.getAllByRole("button", { name: "タスクを削除" });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("タスク1")).not.toBeInTheDocument();
      expect(screen.getByText("タスク2")).toBeInTheDocument();
    });
  });

  test("全TODOを削除するとタスクなしメッセージが表示される", async () => {
    render(<App />);

    const input = screen.getByRole("textbox", { name: "新しいタスクを入力" });
    const addButton = screen.getByRole("button", { name: "追加" });

    fireEvent.change(input, { target: { value: "消えるタスク" } });
    fireEvent.click(addButton);
    await screen.findByText("消えるタスク");

    const deleteButton = screen.getByRole("button", { name: "タスクを削除" });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText("タスクがありません")).toBeInTheDocument();
    });
  });
});
