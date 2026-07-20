'use client';

import { useState } from 'react';

export default function BackupPanel() {
  const [downloading, setDownloading] = useState(false);

  async function handleBackup() {
    setDownloading(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error('Falha ao gerar o backup.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || 'Não foi possível gerar o backup.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Backup de dados</h2>
      <p className="hint" style={{ marginTop: 0 }}>
        Baixe todos os seus dados (lançamentos, categorias, metas, renda, plano de ação) em CSV,
        junto com o esquema das tabelas, em um único arquivo .zip.
      </p>
      <button className="ghost" onClick={handleBackup} disabled={downloading}>
        {downloading ? 'Gerando backup...' : 'Baixar backup completo (.zip)'}
      </button>
    </div>
  );
}
