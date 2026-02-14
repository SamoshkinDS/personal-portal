import PDFDocument from "pdfkit";

export function createResumePdf({ profile, projects, skillsByCategory }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (error) => reject(error));

    doc.font("Helvetica-Bold").fontSize(24).text(profile.name || "Имя не указано");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(12).text(`${profile.specialization || ""}`);
    doc.moveDown(0.5);
    if (profile.email) doc.text(`Email: ${profile.email}`);
    if (profile.telegram) doc.text(`Telegram: ${profile.telegram}`);
    doc.moveDown();
    doc.fontSize(11).text(profile.summary || "", { align: "justify" });
    doc.moveDown(0.5);

    doc.font("Helvetica-Bold").fontSize(14).text("Skills Summary");
    doc.moveDown(0.3);
    Object.entries(skillsByCategory || {}).forEach(([category, items]) => {
      doc.font("Helvetica-Bold").fontSize(11).text(category);
      doc.font("Helvetica").fontSize(10).text(items.join(", "));
      doc.moveDown(0.2);
    });
    doc.addPage();

    doc.font("Helvetica-Bold").fontSize(14).text("Selected Projects");
    doc.moveDown(0.5);
    projects.forEach((project) => {
      doc.font("Helvetica-Bold").fontSize(12).text(project.title || "-");
      doc.font("Helvetica").fontSize(10).text(`${project.company || ""} - ${project.role || ""}`);
      const dates = `${project.startDate || "-"} - ${project.endDate || "по настоящее время"}`;
      doc.text(dates);
      if (project.description) {
        doc.text(project.description, { align: "justify" });
      }
      if (project.achievements?.length) {
        doc.text("Achievements:", { underline: true });
        project.achievements.forEach((achievement) => doc.text(`• ${achievement}`));
      }
      if (project.metrics && Object.keys(project.metrics).length) {
        doc.text("Metrics:");
        Object.entries(project.metrics).forEach(([key, value]) => doc.text(`• ${key}: ${value}`));
      }
      if (project.skillIds?.length) {
        doc.text("Technologies:", { continued: true });
        doc.text((project.skillIds || []).join(", "));
      }
      doc.moveDown(0.5);
    });

    doc.end();
  });
}
