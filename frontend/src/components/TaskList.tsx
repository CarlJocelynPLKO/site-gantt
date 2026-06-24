import { useState, type MouseEvent } from "react";
import type { GanttTask } from "../types/gantt";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";

interface TaskListProps {
  tasks: GanttTask[];
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: GanttTask) => void;
}

function formatAssignees(task: GanttTask): string {
  if (!task.assignees?.length) {
    return "Non affectée";
  }
  return task.assignees.map((person) => `${person.firstName} (${person.jobTitle})`).join(", ");
}

export function TaskList({ tasks, onDeleteTask, onEditTask }: TaskListProps) {
  const [menu, setMenu] = useState<{ x: number; y: number; task: GanttTask } | null>(null);

  if (tasks.length === 0) {
    return null;
  }

  const openMenu = (event: MouseEvent, task: GanttTask) => {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY, task });
  };

  const menuItems: ContextMenuItem[] = menu
    ? [
        {
          label: "Modifier la tâche",
          onClick: () => onEditTask(menu.task),
        },
        {
          label: "Supprimer la tâche",
          danger: true,
          onClick: () => {
            if (window.confirm("Supprimer cette tâche ?")) {
              onDeleteTask(menu.task.id);
            }
          },
        },
      ]
    : [];

  return (
    <section className="mapping-panel task-list-panel">
      <h3>Tâches du projet</h3>
      <p className="muted task-list-hint">Clic droit sur une tâche pour modifier ou supprimer.</p>
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              className="task-list-item"
              onContextMenu={(event) => openMenu(event, task)}
            >
              <span className="task-list-name">{task.name}</span>
              <span className="task-list-dates">
                {task.start} → {task.end} · {formatAssignees(task)}
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
