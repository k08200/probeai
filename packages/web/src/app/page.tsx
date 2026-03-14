export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">
          Probe<span className="text-blue-400">AI</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Test and evaluate your AI agents before they reach production.
          Automated scenarios, rule-based + LLM evaluation, actionable reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <Card title="Agents" value="0" description="Registered agents" href="/agents" />
        <Card title="Tests" value="0" description="Total test runs" href="/tests" />
        <Card title="Avg Score" value="—" description="Across all agents" />
      </div>

      <div className="flex justify-center gap-4">
        <a
          href="/agents/new"
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition"
        >
          Register Agent
        </a>
        <a
          href="/tests/new"
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition border border-gray-700"
        >
          Run Test
        </a>
      </div>
    </main>
  );
}

function Card({ title, value, description, href }: {
  title: string;
  value: string;
  description: string;
  href?: string;
}) {
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper
      href={href}
      className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition"
    >
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-400">{description}</p>
    </Wrapper>
  );
}
