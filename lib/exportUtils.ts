/**
 * Utility to export incident data to CSV format
 */
export const exportToCSV = (data: any[], filename: string = 'incident_logs.csv') => {
  if (data.length === 0) return;

  // Define headers
  const headers = ['ID', 'Type', 'Status', 'Timestamp', 'Location', 'Latitude', 'Longitude', 'Description', 'Contact', 'Reporter'];
  
  // Map data to rows
  const rows = data.map(alert => [
    alert.id,
    alert.type || 'N/A',
    alert.status || 'pending',
    new Date(alert.timestamp).toLocaleString(),
    alert.locationName ? `"${alert.locationName.replace(/"/g, '""')}"` : 'N/A',
    alert.lat,
    alert.lng,
    alert.message ? `"${alert.message.replace(/"/g, '""')}"` : 'N/A',
    alert.contact || 'N/A',
    alert.reporter || 'N/A'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
