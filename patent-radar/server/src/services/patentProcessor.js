export function processPatentResults(lensResponse) {
  const { total, data, results } = lensResponse;
  const rawPatents = data || results || [];

  const patents = rawPatents.map(patent => ({
    lensId: patent.lens_id,
    jurisdiction: patent.jurisdiction,
    docNumber: patent.doc_number,
    kind: patent.kind,
    datePublished: patent.date_published,
    publicationType: patent.publication_type,
    title: extractTitle(patent.biblio?.invention_title),
    abstract: extractAbstract(patent.abstract),
    applicants: extractApplicants(patent.biblio?.parties?.applicants),
    inventors: extractInventors(patent.biblio?.parties?.inventors),
    ipcCodes: extractIPC(patent.biblio?.classifications_ipcr),
    legalStatus: patent.legal_status?.patent_status || "UNKNOWN",
    familySize: patent.families?.simple_family?.size || 0,
    lensUrl: `https://www.lens.org/lens/patent/${patent.lens_id}`
  }));

  const byYear = {};
  const byCountry = {};
  const byApplicant = {};
  const byIPC = {};

  patents.forEach(p => {
    const year = p.datePublished?.substring(0, 4);
    if (year) byYear[year] = (byYear[year] || 0) + 1;

    byCountry[p.jurisdiction] = (byCountry[p.jurisdiction] || 0) + 1;

    p.applicants.forEach(a => {
      byApplicant[a] = (byApplicant[a] || 0) + 1;
    });

    p.ipcCodes.forEach(code => {
      const mainClass = code.substring(0, 4);
      if (mainClass) byIPC[mainClass] = (byIPC[mainClass] || 0) + 1;
    });
  });

  return {
    total: total || patents.length,
    patents,
    analytics: { byYear, byCountry, byApplicant, byIPC }
  };
}

export function extractTitle(titles) {
  if (!titles) return "Untitled";
  if (Array.isArray(titles)) {
    const en = titles.find(t => t.lang === "en");
    return en?.text || titles[0]?.text || "Untitled";
  }
  return typeof titles === "string" ? titles : "Untitled";
}

export function extractAbstract(abstracts) {
  if (!abstracts) return "";
  if (Array.isArray(abstracts)) {
    const en = abstracts.find(a => a.lang === "en");
    return en?.text || abstracts[0]?.text || "";
  }
  return typeof abstracts === "string" ? abstracts : "";
}

function extractApplicants(applicants) {
  if (!applicants) return [];
  return applicants.map(a =>
    a.extracted_name?.value ||
    a.applicant_name?.last_name ||
    a.applicant_name?.name ||
    "Unknown"
  ).filter(Boolean);
}

export function extractInventors(inventors) {
  if (!inventors) return [];
  return inventors.map(i => {
    if (i.extracted_name?.value) return i.extracted_name.value;
    const parts = [i.inventor_name?.first_name, i.inventor_name?.last_name].filter(Boolean);
    return parts.join(" ");
  }).filter(Boolean);
}

export function extractIPC(classifications) {
  if (!classifications) return [];
  const items = classifications.classifications || classifications;
  if (!Array.isArray(items)) return [];
  return items.map(c => {
    if (c.symbol) return c.symbol;
    const ipc = c.classification_ipcr;
    if (!ipc) return "";
    return `${ipc.section || ""}${ipc.class_ipcr || ""}${ipc.subclass || ""}`;
  }).filter(c => c.length > 0);
}
