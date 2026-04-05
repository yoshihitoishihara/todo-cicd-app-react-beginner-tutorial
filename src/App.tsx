import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const q = query(collection(db, "todos"), orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Todo, "id">),
      }));
      setTodos(todosData);
    });
    return () => unsubscribe();
  }, []);

  const handleAddTodo = async () => {
    if (title.trim()) {
      await addDoc(collection(db, "todos"), {
        title: title.trim(),
        completed: false,
        createdAt: serverTimestamp(),
      });
      setTitle("");
    }
  };

  const handleToggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      await updateDoc(doc(db, "todos", id), { completed: !todo.completed });
    }
  };

  const handleDeleteTodo = async (id: string) => {
    await deleteDoc(doc(db, "todos", id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            買い物メモアプリ!
          </h1>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="新しいタスクを入力..."
              aria-label="新しいタスクを入力"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddTodo}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              追加
            </button>
          </div>

          {todos.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg">タスクがありません</p>
              <p className="text-sm">新しいタスクを追加してください</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    todo.completed
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-gray-300 hover:border-blue-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.id)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span
                    className={`flex-1 ${
                      todo.completed
                        ? "line-through text-gray-500"
                        : "text-gray-800"
                    }`}
                  >
                    {todo.title}
                  </span>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    aria-label="タスクを削除"
                    className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}

          {todos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                完了済み: {todos.filter((todo) => todo.completed).length} /{" "}
                {todos.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
