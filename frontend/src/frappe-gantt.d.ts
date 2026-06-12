declare module "frappe-gantt" {
  export type ViewMode = "Quarter Day" | "Half Day" | "Day" | "Week" | "Month";

  export interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress?: number;
    dependencies?: string;
  }

  export default class Gantt {
    constructor(
      wrapper: HTMLElement | string,
      tasks: GanttTask[],
      options?: {
        view_mode?: ViewMode;
        bar_height?: number;
        padding?: number;
        custom_popup_html?: (task: GanttTask) => string;
      },
    );
    change_view_mode(mode: ViewMode): void;
  }
}
