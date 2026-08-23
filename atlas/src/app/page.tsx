import ActionCard from "@/components/ActionCard";

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-[#27272a] p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Investigation #024</h2>
          <p className="text-sm text-zinc-400">Can we reduce the computational complexity of X?</p>
        </div>
        <div className="flex space-x-2">
          <div className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
            Reasoning Mode
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* Example conversational item */}
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="text-sm text-zinc-400 flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Atlas Analysis</span>
          </div>
          <div className="prose prose-invert max-w-none">
            <p>
              To reduce the computational complexity, we need to examine the current algorithm's constraints. 
              I have identified the core bottleneck in the data ingestion pipeline.
            </p>
          </div>
        </div>

        {/* Action Card Example - Automatic */}
        <div className="max-w-3xl mx-auto">
          <ActionCard 
            title="Analyse Repository"
            description="Scanning the codebase for complexity bottlenecks."
            status="automatic"
            actionLabel="View Results"
          />
        </div>

        {/* Action Card Example - Approval Required */}
        <div className="max-w-3xl mx-auto">
          <ActionCard 
            title="Execute Performance Benchmark"
            description="Atlas wants to run a multi-threaded load test on your local environment to measure the baseline."
            status="approval"
            actionLabel="Run Benchmark"
            actionDestructive={false}
          >
            <div className="bg-black/50 p-3 rounded-md border border-[#27272a] text-xs font-mono text-zinc-300">
              $ npm run benchmark -- --threads=8
            </div>
          </ActionCard>
        </div>

        {/* Example conversational item - Challenge My Thinking */}
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="text-sm text-amber-500 flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span>Challenge My Thinking</span>
          </div>
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-amber-200">Hidden Assumption Identified</h4>
            <p className="text-sm text-amber-100/70">
              Your hypothesis assumes that the network latency is negligible. However, if we deploy this to a multi-region cluster, the latency between node synchronisation will become the primary bottleneck, regardless of the algorithm's local complexity.
            </p>
            <div className="flex space-x-3 pt-2">
              <button className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-md transition-colors">
                Simulate Network Latency
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#27272a] bg-[#09090b]">
        <div className="max-w-3xl mx-auto relative">
          <textarea 
            className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 pr-24 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
            placeholder="What would you like to investigate?"
            rows={1}
          ></textarea>
          <div className="absolute right-2 top-2">
            <button className="bg-white text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
