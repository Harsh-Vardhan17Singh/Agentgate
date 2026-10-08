interface SidebarProps {
  activeItem: string;
  onItemChange: (item: string) => void;
}

function Sidebar({
  activeItem,
  onItemChange,
}: SidebarProps) {
  const navigationItems = [
    'Overview',
    'Requests',
    'Approvals',
    'Audit Logs',
    'Agents',
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 p-5">
      <div className="mb-10">
        <h1 className="text-xl font-bold tracking-tight">
          AgentGate
        </h1>

        <p className="mt-1 text-xs text-slate-500">
          AI Security Gateway
        </p>
      </div>

      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const isActive = activeItem === item;

          return (
            <button
              key={item}
              onClick={() => onItemChange(item)}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {item}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;