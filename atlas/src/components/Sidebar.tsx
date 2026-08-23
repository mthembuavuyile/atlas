import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 h-full bg-[#09090b] border-r border-[#27272a] flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Atlas</h1>
        <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-mono">
          Research Environment
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {/* Explore Section */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
            Explore
          </h3>
          <ul className="space-y-1">
            <SidebarItem icon="◉" label="Mathematics" active />
            <SidebarItem icon="◉" label="Science" />
            <SidebarItem icon="◉" label="Engineering" />
            <SidebarItem icon="◉" label="Systems" />
          </ul>
        </div>

        {/* Tools Section */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
            Tools
          </h3>
          <ul className="space-y-1">
            <SidebarItem icon="⌘" label="Research" />
            <SidebarItem icon="⌘" label="Compute" />
            <SidebarItem icon="⌘" label="Code" />
            <SidebarItem icon="⌘" label="Simulate" />
          </ul>
        </div>

        {/* Projects Section */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
            Projects
          </h3>
          <ul className="space-y-1">
            <SidebarItem icon="▣" label="Distributed Systems" />
            <SidebarItem icon="▣" label="Quantum Computing" />
            <SidebarItem icon="▣" label="Personal Research" />
          </ul>
        </div>
      </div>

      <div className="p-4 border-t border-[#27272a]">
        <button className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/15 text-white rounded-md py-2 px-4 transition-colors text-sm font-medium">
          <span>+ New Investigation</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <li>
      <button
        className={`w-full flex items-center space-x-3 px-2 py-1.5 rounded-md text-sm transition-colors ${
          active
            ? "bg-zinc-800/50 text-white"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
        }`}
      >
        <span className="opacity-70">{icon}</span>
        <span>{label}</span>
      </button>
    </li>
  );
}
