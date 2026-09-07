/**
 * Static resource content — cell guides, training and forms aren't part of
 * the domain model (no CMS entity was specified), so this is fixed seed
 * content rather than data pulled from the database.
 */

export interface ResourceItem {
  title: string;
  sub: string;
  kind: "PDF" | "Video" | "Form";
  category: "Cell guides" | "Training" | "Forms and templates";
}

export const THIS_WEEKS_GUIDE: ResourceItem = {
  title: "Cell Guide — Walking in the Spirit",
  sub: "For the week of this Sunday's service · Galatians 5:16-26",
  kind: "PDF",
  category: "Cell guides",
};

export const RESOURCES: ResourceItem[] = [
  { title: "Cell Guide — Walking in the Spirit", sub: "This week's study", kind: "PDF", category: "Cell guides" },
  { title: "Cell Guide — The Fruit of Patience", sub: "Last week's study", kind: "PDF", category: "Cell guides" },
  { title: "Cell Guide — Prayer That Moves God", sub: "2 weeks ago", kind: "PDF", category: "Cell guides" },
  { title: "Hosting a First-Timer Well", sub: "12 min · Cell Leader training", kind: "Video", category: "Training" },
  { title: "Reading the Sunday Report Together", sub: "8 min · Cell Leader training", kind: "Video", category: "Training" },
  { title: "Following Up a New Convert", sub: "15 min · Cell Leader training", kind: "Video", category: "Training" },
  { title: "Guest Card", sub: "Printable form", kind: "Form", category: "Forms and templates" },
  { title: "Decision Card", sub: "Printable form", kind: "Form", category: "Forms and templates" },
  { title: "Cell Attendance Register", sub: "Printable template", kind: "Form", category: "Forms and templates" },
];

export const TRAINING_PROGRESS = { completed: 4, total: 6 };
