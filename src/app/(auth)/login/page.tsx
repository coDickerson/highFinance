import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
      <div className="min-h-screen flex bg-[var(--color-surface-container-low)]">
        {/* Left panel */}
        <div
          className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white"
          style={{
            background: "linear-gradient(160deg, #002046 0%, #1b365d 60%, #002046 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">account_balance</span>
            </div>
            <div>
              <p className="font-display font-bold text-base leading-tight">Treasury Portal</p>
              <p className="text-white/50 text-xs">Fiscal Architect</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight mb-4">
              Clarity through<br />meticulous order.
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              A premium treasury environment built for precision. Every figure, every allocation, every approval — curated with intent.
            </p>
          </div>

          <div className="flex gap-6">
            {[
              { value: "$4.2M", label: "Assets Managed" },
              { value: "98%", label: "Compliance Rate" },
              { value: "4.2h", label: "Avg. Response" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-2xl font-bold">{value}</p>
                <p className="text-white/50 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-base">account_balance</span>
              </div>
              <p className="font-display font-bold text-[var(--color-on-surface)]">Treasury Portal</p>
            </div>

            <h1 className="font-display text-2xl font-extrabold text-[var(--color-on-surface)] mb-1">
              Welcome back
            </h1>
            <p className="text-[var(--color-on-surface-variant)] text-sm mb-8">
              Sign in to access your treasury workspace.
            </p>

            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
