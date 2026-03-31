export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const daysFromNow = (date) => {
  const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

export const statusBadgeClass = (status) => {
  const map = {
    active: 'badge-green', expired: 'badge-red', cancelled: 'badge-gray', pending: 'badge-yellow',
    completed: 'badge-green', scheduled: 'badge-blue', 'in-progress': 'badge-yellow',
    draft: 'badge-gray', sent: 'badge-blue', accepted: 'badge-green', rejected: 'badge-red',
    converted: 'badge-purple', unpaid: 'badge-red', paid: 'badge-green', partial: 'badge-yellow',
    overdue: 'badge-red', dispatched: 'badge-blue', delivered: 'badge-green', processing: 'badge-yellow',
    done: 'badge-green', rescheduled: 'badge-yellow',
  };
  return map[status] || 'badge-gray';
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const truncate = (str, n = 40) => str?.length > n ? str.slice(0, n) + '...' : str;
