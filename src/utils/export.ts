import type { VehicleRecord } from '../types/database';

export function exportToCSV(records: VehicleRecord[]) {
  const headers = [
    'Placa/Veículo',
    'Motivo',
    'Autorização',
    'Data Retirada',
    'Hora Retirada',
    'Nome Retirada',
    'Data Devolução',
    'Hora Devolução',
    'Nome Devolução',
    'Status',
    'Observações',
  ];

  const rows = records.map((record) => [
    record.vehicle_plate,
    record.reason,
    record.authorized_by,
    new Date(record.pickup_date).toLocaleDateString('pt-BR'),
    record.pickup_time,
    record.pickup_name,
    record.return_date ? new Date(record.return_date).toLocaleDateString('pt-BR') : '',
    record.return_time || '',
    record.return_name || '',
    record.status,
    record.observations || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `controle-veiculos-${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generatePrintReport(records: VehicleRecord[], filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const filterInfo = [];
  if (filters?.startDate) {
    filterInfo.push(
      `Data inicial: ${new Date(filters.startDate).toLocaleDateString('pt-BR')}`
    );
  }
  if (filters?.endDate) {
    filterInfo.push(`Data final: ${new Date(filters.endDate).toLocaleDateString('pt-BR')}`);
  }
  if (filters?.status && filters.status !== 'Todos') {
    filterInfo.push(`Status: ${filters.status}`);
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relatório de Controle de Veículos</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .filters {
          background: #f5f5f5;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
        }
        .filters p {
          margin: 5px 0;
          font-size: 14px;
        }
        .stats {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          flex: 1;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
        }
        .stat-card .number {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
        }
        .stat-card .label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px 8px;
          text-align: left;
          font-size: 12px;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
        }
        .status.em-uso {
          background: #fef3c7;
          color: #92400e;
        }
        .status.devolvido {
          background: #d1fae5;
          color: #065f46;
        }
        @media print {
          body {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Controle de Veículos</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>

      ${
        filterInfo.length > 0
          ? `
        <div class="filters">
          <strong>Filtros aplicados:</strong>
          ${filterInfo.map((info) => `<p>• ${info}</p>`).join('')}
        </div>
      `
          : ''
      }

      <div class="stats">
        <div class="stat-card">
          <div class="number">${records.length}</div>
          <div class="label">Total de Registros</div>
        </div>
        <div class="stat-card">
          <div class="number">${records.filter((r) => r.status === 'Em uso').length}</div>
          <div class="label">Em Uso</div>
        </div>
        <div class="stat-card">
          <div class="number">${records.filter((r) => r.status === 'Devolvido').length}</div>
          <div class="label">Devolvidos</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Placa/Veículo</th>
            <th>Motivo</th>
            <th>Data/Hora Retirada</th>
            <th>Nome Retirada</th>
            <th>Data/Hora Devolução</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${records
            .map(
              (record) => `
            <tr>
              <td>${record.vehicle_plate}</td>
              <td>${record.reason}</td>
              <td>${new Date(record.pickup_date).toLocaleDateString('pt-BR')} ${record.pickup_time}</td>
              <td>${record.pickup_name}</td>
              <td>${
                record.return_date
                  ? `${new Date(record.return_date).toLocaleDateString('pt-BR')} ${record.return_time}`
                  : '-'
              }</td>
              <td><span class="status ${record.status === 'Em uso' ? 'em-uso' : 'devolvido'}">${record.status}</span></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
