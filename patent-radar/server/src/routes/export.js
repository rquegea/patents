import { Router } from 'express';

const router = Router();

router.post('/csv', (req, res, next) => {
  try {
    const { patents = [] } = req.body;

    if (patents.length === 0) {
      return res.status(400).json({ error: 'No patents to export' });
    }

    const headers = ['Title', 'Applicants', 'Jurisdiction', 'Date Published', 'Type', 'Legal Status', 'IPC Codes', 'Family Size', 'Lens URL'];
    const escape = (val) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = patents.map(p => [
      escape(p.title),
      escape(Array.isArray(p.applicants) ? p.applicants.join('; ') : p.applicants),
      escape(p.jurisdiction),
      escape(p.datePublished),
      escape(p.publicationType),
      escape(p.legalStatus),
      escape(Array.isArray(p.ipcCodes) ? p.ipcCodes.join('; ') : p.ipcCodes),
      escape(p.familySize),
      escape(p.lensUrl)
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="patent-radar-export.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

router.post('/json', (req, res, next) => {
  try {
    const { patents = [] } = req.body;

    if (patents.length === 0) {
      return res.status(400).json({ error: 'No patents to export' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="patent-radar-export.json"');
    res.send(JSON.stringify(patents, null, 2));
  } catch (err) {
    next(err);
  }
});

export default router;
