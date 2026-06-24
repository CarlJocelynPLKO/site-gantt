import { useState, type MouseEvent } from "react";
import type { GanttTask } from "../types/gantt";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";

interface TaskListProps {
  tasks: GanttTask[];
  onDeleteTask: (taskId: string) => void;
}

export function TaskList({ tasks, onDeleteTask }: TaskListProps) {
  const [menu, setMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);

  if (tasks.length === 0) {
    return null;
  }

  const openMenu = (event: MouseEvent, taskId: string) => {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY, taskId });
  };

  const menuItems: ContextMenuItem[] = menu
    ? [
        {
          label: "Supprimer la tâche",
          danger: true,
          onClick: () => {
            if (window.confirm("Supprimer cette tâche ?")) {
              onDeleteTask(menu.taskId);
            }
          },
        },
      ]
    : [];

  return (
    <section className="mapping-panel task-list-panel">
      <h3>Tâches du projet</h3>
      <p className="muted task-list-hint">Clic droit sur une tâche pour la supprimer.</p>
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              className="task-list-item"
              onContextMenu={(event) => openMenu(event, task.id)}
            >
              <span className="task-list-name">{task.name}</span>
              <span className="task-list-dates">
                {task.start} → {task.end}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}
    </section>
  );
}
