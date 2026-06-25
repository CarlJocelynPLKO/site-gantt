import type { Project } from "../types/gantt";

export interface ProjectPhases {
  etude: number;
  chantier: number;
  livraison: number;
}

export const DEFAULT_PHASES: ProjectPhases = { etude: 34, chantier: 33, livraison: 33 };

export const MIN_PHASE_PCT = 5;

export const PHASE_META = {
  etude: { label: "Étude / Conception", color: "#7eb0e3" },
  chantier: { label: "Chantier", color: "#e0b06a" },
  livraison: { label: "Livraison", color: "#5fbf9d" },
} as const;

export const PHASE_BAR_RADIUS = 12;

export function normalizePhases(phases: ProjectPhases): ProjectPhases {
  let etude = Math.round(phases.etude);
  let chantier = Math.round(phases.chantier);
  let livraison = Math.round(phases.livraison);

  const total = etude + chantier + livraison;
  if (total !== 100 && total > 0) {
    etude = Math.round((etude / total) * 100);
    chantier = Math.round((chantier / total) * 100);
    livraison = 100 - etude - chantier;
  }

  etude = Math.max(MIN_PHASE_PCT, Math.min(100 - MIN_PHASE_PCT * 2, etude));
  chantier = Math.max(MIN_PHASE_PCT, Math.min(100 - MIN_PHASE_PCT - etude, chantier));
  livraison = 100 - etude - chantier;

  if (livraison < MIN_PHASE_PCT) {
    livraison = MIN_PHASE_PCT;
    chantier = Math.max(MIN_PHASE_PCT, 100 - etude - livraison);
    etude = 100 - chantier - livraison;
  }

  return { etude, chantier, livraison };
}

export function getProjectPhases(project: Project): ProjectPhases {
  return normalizePhases({
    etude: project.phaseEtudePct ?? DEFAULT_PHASES.etude,
    chantier: project.phaseChantierPct ?? DEFAULT_PHASES.chantier,
    livraison: project.phaseLivraisonPct ?? DEFAULT_PHASES.livraison,
  });
}

export function formatPhasesForPopup(phases: ProjectPhases): string {
  return [
    `${PHASE_META.etude.label} : ${phases.etude} %`,
    `${PHASE_META.chantier.label} : ${phases.chantier} %`,
    `${PHASE_META.livraison.label} : ${phases.livraison} %`,
  ].join("<br/>");
}

function getBarGeometry(wrapper: HTMLElement): { x: number; y: number; width: number; height: number } | null {
  const bar = wrapper.querySelector<SVGRectElement>(".bar");
  if (!bar) {
    return null;
  }

  const x = Number(bar.getAttribute("x"));
  const y = Number(bar.getAttribute("y"));
  const width = Number(bar.getAttribute("width"));
  const height = Number(bar.getAttribute("height"));

  if (!Number.isFinite(x) || !Number.isFinite(y) || width <= 0 || height <= 0) {
    return null;
  }

  return { x, y, width, height };
}

function renderPhaseSegments(wrapper: HTMLElement, phases: ProjectPhases): void {
  const geometry = getBarGeometry(wrapper);
  if (!geometry) {
    return;
  }

  const barGroup = wrapper.querySelector<SVGGElement>(".bar-group");
  if (!barGroup) {
    return;
  }

  wrapper.querySelector(".phase-segments")?.remove();
  wrapper.classList.remove("has-phase-segments");

  const { x, y, width, height } = geometry;
  const segments = barGroup.ownerDocument!.createElementNS("http://www.w3.org/2000/svg", "g");
  segments.setAttribute("class", "phase-segments");

  const widths = [
    (width * phases.etude) / 100,
    (width * phases.chantier) / 100,
    (width * phases.livraison) / 100,
  ];
  const colors = [PHASE_META.etude.color, PHASE_META.chantier.color, PHASE_META.livraison.color];
  const keys: (keyof ProjectPhases)[] = ["etude", "chantier", "livraison"];
  const cornerRadius = Math.min(PHASE_BAR_RADIUS, height / 2);

  const bar = wrapper.querySelector<SVGRectElement>(".bar");
  if (bar) {
    bar.setAttribute("rx", String(cornerRadius));
    bar.setAttribute("ry", String(cornerRadius));
    bar.setAttribute("opacity", "0");
  }

  let offsetX = x;
  const visibleIndexes = keys
    .map((key, index) => ({ key, index, width: widths[index] }))
    .filter((segment) => segment.width > 0);
  const lastVisibleIndex = visibleIndexes[visibleIndexes.length - 1]?.index;

  keys.forEach((key, index) => {
    const segmentWidth = widths[index];
    if (segmentWidth <= 0) {
      return;
    }

    const rect = barGroup.ownerDocument!.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("class", `phase-segment phase-segment--${key}`);
    rect.setAttribute("x", String(offsetX));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(segmentWidth));
    rect.setAttribute("height", String(height));
    rect.setAttribute("fill", colors[index]);

    if (index === 0 || index === lastVisibleIndex) {
      rect.setAttribute("rx", String(cornerRadius));
      rect.setAttribute("ry", String(cornerRadius));
    }

    segments.appendChild(rect);
    offsetX += segmentWidth;
  });

  const dividerWidth = 8;
  const dividerHeight = height + 6;
  const dividerY = y - 3;
  const boundary1 = x + widths[0];
  const boundary2 = x + widths[0] + widths[1];

  [boundary1, boundary2].forEach((boundaryX, dividerIndex) => {
    const divider = barGroup.ownerDocument!.createElementNS("http://www.w3.org/2000/svg", "rect");
    divider.setAttribute("class", "phase-divider");
    divider.setAttribute("data-divider", String(dividerIndex));
    divider.setAttribute("x", String(boundaryX - dividerWidth / 2));
    divider.setAttribute("y", String(dividerY));
    divider.setAttribute("width", String(dividerWidth));
    divider.setAttribute("height", String(dividerHeight));
    divider.setAttribute("fill", "transparent");
    segments.appendChild(divider);
  });

  const barElement = wrapper.querySelector<SVGRectElement>(".bar");
  const label = wrapper.querySelector(".bar-label");
  if (barElement?.nextSibling) {
    barGroup.insertBefore(segments, label ?? barElement.nextSibling);
  } else {
    barGroup.appendChild(segments);
  }

  wrapper.dataset.phaseEtude = String(phases.etude);
  wrapper.dataset.phaseChantier = String(phases.chantier);
  wrapper.dataset.phaseLivraison = String(phases.livraison);
  wrapper.classList.add("has-phase-segments");
}

function readPhasesFromWrapper(wrapper: HTMLElement): ProjectPhases {
  return normalizePhases({
    etude: Number(wrapper.dataset.phaseEtude),
    chantier: Number(wrapper.dataset.phaseChantier),
    livraison: Number(wrapper.dataset.phaseLivraison),
  });
}

function clampPhase(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function adjustPhasesOnDrag(
  startPhases: ProjectPhases,
  dividerIndex: number,
  deltaPct: number,
): ProjectPhases {
  if (dividerIndex === 0) {
    const maxEtude = 100 - MIN_PHASE_PCT - startPhases.livraison;
    const etude = clampPhase(startPhases.etude + deltaPct, MIN_PHASE_PCT, maxEtude);
    const chantier = 100 - etude - startPhases.livraison;
    return normalizePhases({ etude, chantier, livraison: startPhases.livraison });
  }

  const maxChantier = 100 - MIN_PHASE_PCT - startPhases.etude;
  const chantier = clampPhase(startPhases.chantier + deltaPct, MIN_PHASE_PCT, maxChantier);
  const livraison = 100 - startPhases.etude - chantier;
  return normalizePhases({ etude: startPhases.etude, chantier, livraison });
}

function attachDividerDrag(
  wrapper: HTMLElement,
  projectId: string,
  onPhasesChange?: (projectId: string, phases: ProjectPhases) => void,
): () => void {
  const onDividerMouseDown = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    const target = mouseEvent.target as SVGRectElement | null;
    if (!target?.classList.contains("phase-divider")) {
      return;
    }

    if (mouseEvent.button !== 0) {
      return;
    }

    const dividerIndex = Number(target.getAttribute("data-divider"));
    if (dividerIndex !== 0 && dividerIndex !== 1) {
      return;
    }

    mouseEvent.stopPropagation();
    mouseEvent.preventDefault();

    const geometry = getBarGeometry(wrapper);
    if (!geometry) {
      return;
    }

    const startX = mouseEvent.clientX;
    const startPhases = readPhasesFromWrapper(wrapper);

    let currentPhases = startPhases;
    wrapper.classList.add("phase-dragging");

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPct = ((moveEvent.clientX - startX) / geometry.width) * 100;
      currentPhases = adjustPhasesOnDrag(startPhases, dividerIndex, deltaPct);
      renderPhaseSegments(wrapper, currentPhases);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      wrapper.classList.remove("phase-dragging");

      if (
        currentPhases.etude !== startPhases.etude ||
        currentPhases.chantier !== startPhases.chantier ||
        currentPhases.livraison !== startPhases.livraison
      ) {
        onPhasesChange?.(projectId, currentPhases);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  wrapper.addEventListener("mousedown", onDividerMouseDown);

  return () => {
    wrapper.removeEventListener("mousedown", onDividerMouseDown);
  };
}

function attachBarGeometrySync(container: HTMLElement): () => void {
  let rafId = 0;
  let syncing = false;

  const syncVisibleBars = () => {
    container.querySelectorAll<HTMLElement>(".bar-wrapper[data-id]").forEach((wrapper) => {
      if (!wrapper.querySelector(".phase-segments")) {
        return;
      }
      renderPhaseSegments(wrapper, readPhasesFromWrapper(wrapper));
    });
  };

  const scheduleSync = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(syncVisibleBars);
  };

  const onPointerDown = (event: Event) => {
    const target = event.target as Element | null;
    if (!target) {
      return;
    }
    if (target.classList.contains("phase-divider")) {
      return;
    }
    if (
      target.classList.contains("handle") ||
      target.classList.contains("bar-wrapper") ||
      target.closest(".handle")
    ) {
      syncing = true;
    }
  };

  const onPointerMove = () => {
    if (syncing) {
      scheduleSync();
    }
  };

  const stopSyncing = () => {
    if (!syncing) {
      return;
    }
    syncing = false;
    scheduleSync();
  };

  container.addEventListener("mousedown", onPointerDown);
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", stopSyncing);

  return () => {
    cancelAnimationFrame(rafId);
    container.removeEventListener("mousedown", onPointerDown);
    window.removeEventListener("mousemove", onPointerMove);
    window.removeEventListener("mouseup", stopSyncing);
  };
}

export function refreshGanttPhaseBars(container: HTMLElement, projects: Project[]): void {
  const projectsById = new Map(projects.map((project) => [project.id, project]));

  container.querySelectorAll<HTMLElement>(".bar-wrapper[data-id]").forEach((wrapper) => {
    const projectId = wrapper.getAttribute("data-id");
    if (!projectId) {
      return;
    }

    const project = projectsById.get(projectId);
    if (!project) {
      return;
    }

    renderPhaseSegments(wrapper, getProjectPhases(project));
  });
}

export function setupGanttPhaseBars(
  container: HTMLElement,
  projects: Project[],
  onPhasesChange?: (projectId: string, phases: ProjectPhases) => void,
): () => void {
  container.classList.add("gantt-container--phases");

  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const cleanups: Array<() => void> = [];

  container.querySelectorAll<HTMLElement>(".bar-wrapper[data-id]").forEach((wrapper) => {
    const projectId = wrapper.getAttribute("data-id");
    if (!projectId) {
      return;
    }

    const project = projectsById.get(projectId);
    if (!project) {
      return;
    }

    const phases = getProjectPhases(project);
    renderPhaseSegments(wrapper, phases);
    cleanups.push(attachDividerDrag(wrapper, projectId, onPhasesChange));
  });

  cleanups.push(attachBarGeometrySync(container));

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    container.classList.remove("gantt-container--phases");
    container.querySelectorAll(".phase-segments").forEach((element) => element.remove());
  };
}
