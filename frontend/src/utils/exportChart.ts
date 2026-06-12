export async function exportChartAsPng(container: HTMLElement, filename = "gantt.png"): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(container, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function exportChartAsSvg(container: HTMLElement, filename = "gantt.svg"): void {
  const svg = container.querySelector("svg");
  if (!svg) {
    throw new Error("Aucun diagramme SVG disponible pour l'export.");
  }

  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clone);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
