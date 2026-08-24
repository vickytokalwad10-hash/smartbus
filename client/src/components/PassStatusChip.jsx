// PassStatusChip — shows pass status as a pill badge
const PassStatusChip = ({ status }) => {
  const map = {
    active:   { cls: 'chip-active',   icon: 'check_circle', label: 'Active' },
    pending:  { cls: 'chip-pending',  icon: 'schedule',     label: 'Pending' },
    expired:  { cls: 'chip-expired',  icon: 'cancel',       label: 'Expired' },
    rejected: { cls: 'chip-rejected', icon: 'block',        label: 'Rejected' },
  };
  const { cls, icon, label } = map[status] || map.pending;
  return (
    <span className={cls}>
      <span className="material-symbols-outlined text-[12px]">{icon}</span>
      {label}
    </span>
  );
};

export default PassStatusChip;
