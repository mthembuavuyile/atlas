import React from "react";

type ActionStatus = "automatic" | "approval" | "never";

interface ActionCardProps {
  title: string;
  description: string;
  status: ActionStatus;
  actionLabel: string;
  actionDestructive?: boolean;
  children?: React.ReactNode;
}

export default function ActionCard({ 
  title, 
  description, 
  status, 
  actionLabel, 
  actionDestructive = false,
  children
}: ActionCardProps) {
  
  const statusColors = {
    automatic: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    approval: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    never: "bg-rose-500/20 text-rose-400 border-rose-500/30"
  };

  const statusIcons = {
    automatic: "🟢",
    approval: "🟡",
    never: "🔴"
  };

  const statusText = {
    automatic: "Executed Automatically",
    approval: "Approval Required",
    never: "Action Blocked"
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-lg shadow-black/50">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-white flex items-center space-x-2">
            <span>{title}</span>
          </h3>
          <div className={`text-xs px-2 py-1 rounded-full border flex items-center space-x-1.5 ${statusColors[status]}`}>
            <span>{statusIcons[status]}</span>
            <span className="font-medium tracking-wide">{statusText[status]}</span>
          </div>
        </div>
        <p className="text-sm text-zinc-400 mb-4">
          {description}
        </p>
        
        {children && (
          <div className="mb-4">
            {children}
          </div>
        )}

      </div>
      <div className="bg-[#09090b] border-t border-[#27272a] p-3 flex justify-end space-x-3">
        {status === "approval" && (
          <button className="text-sm text-zinc-400 hover:text-white px-4 py-1.5 transition-colors">
            Cancel
          </button>
        )}
        <button 
          className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
            status === "automatic" 
              ? "bg-zinc-800 text-white hover:bg-zinc-700"
              : actionDestructive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
