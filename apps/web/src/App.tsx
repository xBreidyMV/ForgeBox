
import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:4310";

type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

type ExperimentIteration = {
  iteration: number;
  success: boolean;
  statusCode: number;
  durationMs: number;
  error: string | null;
};

type ExperimentResult = {
  id: string;
  name: string;
  mode: "latency" | "http_error";
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
  iterations: number;
  successful: number;
  failed: number;
  averageLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  results: ExperimentIteration[];
};

type ExperimentMode = "latency" | "http_error";

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState("");
  const [loadingHealth, setLoadingHealth] = useState(true);

  const [name, setName] = useState("Prueba de resiliencia");
  const [mode, setMode] = useState<ExperimentMode>("latency");
  const [delayMs, setDelayMs] = useState(300);
  const [iterations, setIterations] = useState(3);

  const [running, setRunning] = useState(false);
  const [experimentError, setExperimentError] = useState("");
  const [result, setResult] = useState<ExperimentResult | null>(null);
  const [history, setHistory] = useState<ExperimentResult[]>([]);

  // Comprueba la API al abrir la página y vuelve a comprobarla cada 5 segundos.
  // Actualiza el estado de React sin recargar el documento.
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let requestController: AbortController | null = null;

    async function checkApi() {
      // Evita acumular peticiones si una respuesta tarda más de 5 segundos.
      if (cancelled || inFlight) return;

      inFlight = true;
      requestController = new AbortController();

      try {
        const response = await fetch(`${API_URL}/health`, {
          signal: requestController.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: HealthResponse = await response.json();

        if (!cancelled) {
          setHealth(data);
          setHealthError("");
        }
      } catch (error) {
        if (cancelled || requestController.signal.aborted) return;

        setHealth(null);
        setHealthError(
          error instanceof Error
            ? error.message
            : "No se pudo conectar con la API.",
        );
      } finally {
        inFlight = false;

        if (!cancelled) {
          setLoadingHealth(false);
        }
      }
    }

    void checkApi();

    const intervalId = window.setInterval(() => {
      void checkApi();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      requestController?.abort();
    };
  }, []);

  async function executeExperiment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    setExperimentError("");

    try {
      const response = await fetch(`${API_URL}/experiments/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          mode,
          delayMs,
          iterations,
          statusCode: 503,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? `No se pudo ejecutar la prueba (HTTP ${response.status})`,
        );
      }

      const experiment = data as ExperimentResult;
      setResult(experiment);
      setHistory((previous) => [experiment, ...previous].slice(0, 10));
    } catch (error) {
      setExperimentError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado.",
      );
    } finally {
      setRunning(false);
    }
  }

  async function downloadReport(experiment: ExperimentResult) {
    setExperimentError("");

    try {
      const response = await fetch(`${API_URL}/experiments/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: experiment.name,
          mode: experiment.mode,
          delayMs,
          iterations: experiment.iterations,
          statusCode: 503,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "No se pudo generar el informe.");
      }

      const report = await response.blob();
      const url = URL.createObjectURL(report);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `forgebox-report-${experiment.id}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExperimentError(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el informe.",
      );
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 text-slate-100 sm:px-10 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-6 border-b border-slate-800 pb-8 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">Local resilience lab</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Forge<span className="text-violet-400">Box</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              Laboratorio local para experimentar, medir y comprender la
              resiliencia de servicios.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
            <span className="status-dot" />
            Entorno local
          </div>
        </header>

        <section className="dashboard-grid">
          <article className="panel panel-hover">
            <p className="eyebrow">Infraestructura</p>
            <h2 className="mt-3 text-xl font-semibold">Estado del backend</h2>

            {loadingHealth ? (
              <p className="mt-5 text-sm text-slate-400">
                Conectando con la API...
              </p>
            ) : health ? (
              <>
                <p className="mt-5 flex items-center gap-2 text-sm text-emerald-400">
                  <span className="status-dot" />
                  API conectada
                </p>

                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-400">Servicio</dt>
                    <dd className="break-all text-right font-mono text-slate-200">
                      {health.service}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-400">Estado</dt>
                    <dd className="font-semibold text-emerald-400">
                      {health.status}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Última respuesta</dt>
                    <dd className="mt-2 break-all font-mono text-xs leading-5 text-slate-300">
                      {new Date(health.timestamp).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-sm font-medium text-rose-400">
                  API desconectada
                </p>
                <p className="mt-2 break-words text-sm text-slate-400">
                  {healthError}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Comprueba que el backend esté ejecutándose en el puerto 4310.
                </p>
              </div>
            )}
          </article>

          <article className="panel panel-hover">
            <p className="eyebrow">Motor de pruebas</p>
            <h2 className="mt-3 text-xl font-semibold">
              Nuevo experimento
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ejecuta simulaciones controladas y mide sus resultados.
            </p>

            <form className="mt-6 space-y-5" onSubmit={executeExperiment}>
              <div>
                <label
                  htmlFor="experiment-name"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Nombre del experimento
                </label>
                <input
                  id="experiment-name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={1}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="experiment-mode"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Tipo de experimento
                </label>
                <select
                  id="experiment-mode"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100"
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as ExperimentMode)
                  }
                >
                  <option value="latency">Simular latencia</option>
                  <option value="http_error">Simular error HTTP 503</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="delay" className="text-sm text-slate-300">
                    Retardo por iteración
                  </label>
                  <span className="font-mono text-sm text-violet-300">
                    {delayMs} ms
                  </span>
                </div>
                <input
                  id="delay"
                  className="w-full accent-violet-500"
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={delayMs}
                  onChange={(event) => setDelayMs(Number(event.target.value))}
                />
                <div className="mt-1 flex justify-between text-xs text-slate-500">
                  <span>0 ms</span>
                  <span>5000 ms</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="iterations"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Número de iteraciones
                </label>
                <select
                  id="iterations"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100"
                  value={iterations}
                  onChange={(event) =>
                    setIterations(Number(event.target.value))
                  }
                >
                  <option value={1}>1 iteración</option>
                  <option value={3}>3 iteraciones</option>
                  <option value={5}>5 iteraciones</option>
                  <option value={10}>10 iteraciones</option>
                  <option value={20}>20 iteraciones</option>
                </select>
              </div>

              <button
                type="submit"
                className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                disabled={running || !health}
              >
                {running ? "Ejecutando experimento..." : "▶ Ejecutar experimento"}
              </button>

              {!health && !loadingHealth && (
                <p className="text-xs text-amber-300">
                  Inicia la API para habilitar las pruebas.
                </p>
              )}

              {experimentError && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-300"
                >
                  {experimentError}
                </p>
              )}
            </form>
          </article>
        </section>

        {result && (
          <section className="mt-8 space-y-5" aria-live="polite">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="eyebrow">Última ejecución</p>
                <h2 className="mt-2 text-2xl font-bold">{result.name}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {result.mode === "latency"
                    ? "Simulación de latencia"
                    : "Simulación de error HTTP"}
                </p>
              </div>
              <button
                className="button-primary"
                type="button"
                onClick={() => void downloadReport(result)}
              >
                ↓ Descargar informe JSON
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Latencia media"
                value={`${result.averageLatencyMs.toFixed(2)} ms`}
              />
              <MetricCard
                label="Latencia mínima"
                value={`${result.minLatencyMs.toFixed(2)} ms`}
              />
              <MetricCard
                label="Latencia máxima"
                value={`${result.maxLatencyMs.toFixed(2)} ms`}
              />
              <MetricCard
                label="Ejecuciones exitosas"
                value={`${result.successful}/${result.iterations}`}
                detail={`${result.failed} fallidas`}
              />
            </div>

            <article className="panel">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="eyebrow">Detalle</p>
                  <h3 className="mt-2 text-lg font-semibold">
                    Resultados por iteración
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Duración total: {result.totalDurationMs.toFixed(2)} ms
                </p>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Iteración</th>
                      <th className="px-3 py-3">Resultado</th>
                      <th className="px-3 py-3">HTTP</th>
                      <th className="px-3 py-3 text-right">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((item) => (
                      <tr
                        key={item.iteration}
                        className="border-b border-slate-800/70 last:border-0"
                      >
                        <td className="px-3 py-4 font-mono">
                          #{item.iteration}
                        </td>
                        <td
                          className={
                            item.success
                              ? "px-3 py-4 text-emerald-400"
                              : "px-3 py-4 text-rose-400"
                          }
                        >
                          {item.success ? "Exitoso" : "Fallido"}
                          {item.error && (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.error}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-4 font-mono">
                          {item.statusCode}
                        </td>
                        <td className="px-3 py-4 text-right font-mono">
                          {item.durationMs.toFixed(2)} ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}

        {history.length > 0 && (
          <section className="mt-8">
            <p className="eyebrow">Sesión actual</p>
            <h2 className="mt-2 text-2xl font-bold">Historial de experimentos</h2>
            <div className="mt-4 space-y-3">
              {history.map((experiment) => (
                <button
                  key={experiment.id}
                  type="button"
                  onClick={() => setResult(experiment)}
                  className="flex w-full flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left transition hover:border-violet-400/40 sm:flex-row sm:items-center"
                >
                  <span>
                    <span className="block font-medium text-slate-100">
                      {experiment.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {new Date(experiment.completedAt).toLocaleString()}
                    </span>
                  </span>
                  <span className="text-sm text-slate-400">
                    {experiment.successful} exitosas · {experiment.failed} fallidas
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-800 pt-5 text-xs sm:flex-row">
          <span>ForgeBox · Desarrollo local</span>
          <span>React · TypeScript · Fastify · Tailwind CSS</span>
        </footer>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="panel">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-100">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </article>
  );
}

export default App;
