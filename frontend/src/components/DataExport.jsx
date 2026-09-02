import { useState } from 'react';
import { format } from 'date-fns';
import { entryDateKey } from '../utils/dates';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './DataExport.css';


const DataExport = ({ habits }) => {
  const [exportStatus, setExportStatus] = useState('');

  const exportToCSV = () => {
    try {
      const headers = ['Habit Name', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const rows = [];

      habits.forEach(habit => {
        const row = [habit.name];
        for (let month = 0; month < 12; month++) {
          const monthStart = new Date(new Date().getFullYear(), month, 1);
          const monthEnd = new Date(new Date().getFullYear(), month + 1, 0);

          let completedDays = 0;
          let totalDays = 0;

          for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
            totalDays++;
            const dateStr = format(new Date(d), 'yyyy-MM-dd');
            const entry = habit.entries.find(e => entryDateKey(e.date) === dateStr);
            if (entry && entry.status === 'done') {
              completedDays++;
            }
          }

          const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
          row.push(`${percentage}%`);
        }
        rows.push(row);
      });

      // Convert to CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `habits-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('CSV exported successfully!');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus('Error exporting CSV: ' + error.message);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const exportToJSON = () => {
    try {
      const data = {
        exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        habits: habits.map(habit => ({
          id: habit._id,
          name: habit.name,
          entries: habit.entries.map(entry => ({
            date: entryDateKey(entry.date),
            status: entry.status,
          })),
        })),
        summary: {
          totalHabits: habits.length,
          startDate: habits.length > 0 && habits[0].entries.length > 0 ? habits[0].entries[0].date : null,
          endDate: new Date().toISOString(),
        },
      };

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `habits-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('JSON exported successfully!');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus('Error exporting JSON: ' + error.message);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      doc.setFontSize(18);
      doc.text('Habit Tracker Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Date
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Habits Table
      const tableData = [];
      habits.forEach(habit => {
        const row = [habit.name];

        for (let month = 0; month < 12; month++) {
          const monthStart = new Date(new Date().getFullYear(), month, 1);
          const monthEnd = new Date(new Date().getFullYear(), month + 1, 0);

          let completedDays = 0;
          let totalDays = 0;

          for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
            totalDays++;
            const dateStr = format(new Date(d), 'yyyy-MM-dd');
            const entry = habit.entries.find(e => entryDateKey(e.date) === dateStr);
            if (entry && entry.status === 'done') {
              completedDays++;
            }
          }

          const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
          row.push(`${percentage}%`);
        }

        tableData.push(row);
      });

      const headers = ['Habit', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: yPosition,
        margin: 10,
        didDrawPage: (data) => {
          // Footer
          doc.setFontSize(9);
          doc.text(
            `Page ${data.pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        },
      });

      doc.save(`habits-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      setExportStatus('PDF exported successfully!');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus('Error exporting PDF: ' + error.message);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const exportAllData = () => {
    try {
      // Create a combined export with multiple formats
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const data = {
        exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        habits: habits.map(habit => ({
          id: habit._id,
          name: habit.name,
          createdAt: habit.createdAt,
          entries: habit.entries.map(entry => ({
            date: entryDateKey(entry.date),
            status: entry.status,
          })),
        })),
        summary: {
          totalHabits: habits.length,
          exportFormat: 'Complete Data Export',
        },
      };

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `habits-complete-${timestamp}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('Complete data export successful!');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus('Error exporting: ' + error.message);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  return (
    <div className="data-export">
      <div className="export-header">
        <h2>📊 Data Export</h2>
        <p>Export your habit data in various formats for backup or analysis</p>
      </div>

      <div className="export-options">
        <div className="export-card">
          <div className="export-icon">📄</div>
          <h3>CSV Export</h3>
          <p>Export to Excel-compatible format</p>
          <button onClick={exportToCSV} className="export-btn csv-btn">
            Export to CSV
          </button>
        </div>

        <div className="export-card">
          <div className="export-icon">📋</div>
          <h3>PDF Export</h3>
          <p>Export as formatted PDF report</p>
          <button onClick={exportToPDF} className="export-btn pdf-btn">
            Export to PDF
          </button>
        </div>

        <div className="export-card">
          <div className="export-icon">⚙️</div>
          <h3>JSON Export</h3>
          <p>Export raw data in JSON format</p>
          <button onClick={exportToJSON} className="export-btn json-btn">
            Export to JSON
          </button>
        </div>

        <div className="export-card">
          <div className="export-icon">💾</div>
          <h3>Complete Backup</h3>
          <p>Export all data with metadata</p>
          <button onClick={exportAllData} className="export-btn backup-btn">
            Complete Backup
          </button>
        </div>
      </div>

      {exportStatus && (
        <div className={`export-status ${exportStatus.includes('Error') ? 'error' : 'success'}`}>
          {exportStatus}
        </div>
      )}

      <div className="export-info">
        <h3>Export Information</h3>
        <ul>
          <li><strong>CSV:</strong> Best for spreadsheet analysis in Excel or Google Sheets</li>
          <li><strong>PDF:</strong> Professional format for printing or sharing reports</li>
          <li><strong>JSON:</strong> Technical format for data integration or backup</li>
          <li><strong>Complete Backup:</strong> Full data export with all metadata</li>
        </ul>
      </div>

      <div className="export-tips">
        <h3>💡 Tips</h3>
        <ul>
          <li>Export your data regularly for backup purposes</li>
          <li>CSV exports are great for creating custom charts in Excel</li>
          <li>JSON exports can be imported into other habit tracking systems</li>
          <li>PDF reports are perfect for performance reviews or sharing progress</li>
        </ul>
      </div>
    </div>
  );
};

export default DataExport;
