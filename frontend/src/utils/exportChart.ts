export type ExportFormat = "png" | "svg" | "pdf";

function findExportSvg(container: HTMLElement): SVGElement {
  const svg = container.querySelector("svg");
  if (!svg) {
    throw new Error("Aucun diagramme SVG disponible pour l'export.");
  }
  return svg;
}

async function renderExportCanvas(container: HTMLElement): Promise<HTMLCanvasElement> {
  const html2canvas = (await import("html2canvas")).default;
  return html2canvas(container, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    scrollX: 0,
    scrollY: 0,
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportChartAsPng(
  container: HTMLElement,
  filename = "gantt.png",
): Promise<void> {
  const canvas = await renderExportCanvas(container);
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function exportChartAsSvg(container: HTMLElement, filename = "gantt.svg"): void {
  const svg = findExportSvg(container);
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clone);
  downloadBlob(new Blob([source], { type: "image/svg+xml;charset=utf-8" }), filename);
}

export async function exportChartAsPdf(
  container: HTMLElement,
  filename = "gantt.pdf",
): Promise<void> {
  const canvas = await renderExportCanvas(container);
  const { jsPDF } = await import("jspdf");

  const imgData = canvas.toDataURL("image/png");
  const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(filename);
}

export async function exportGanttChart(
  container: HTMLElement,
  format: ExportFormat,
  filename: string,
): Promise<void> {
  switch (format) {
    case "png":
      await exportChartAsPng(container, filename);
      return;
    case "svg":
      exportChartAsSvg(container, filename);
      return;
    case "pdf":
      await exportChartAsPdf(container, filename);
      return;
    default:
      throw new Error("Format d'export non supporté.");
  }
}

export function buildExportFilename(calendarName: string | undefined, format: ExportFormat): string {
  const slug =
    calendarName
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_àâäéèêëïîôùûüç]/gi, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "gantt";

  return `${slug}.${format}`;
}
