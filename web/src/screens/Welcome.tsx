import { useState } from "react";
import { useNavigate } from "react-router";
import { Mark, Wordmark } from "../components/Logo";
import { Shell, Screen } from "../components/Shell";
import { Button } from "../components/ui";
import { strings } from "../lib/strings";
import { api } from "../lib/api";

export function Welcome() {
  const navigate = useNavigate();
  const s = strings.welcome;
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState("");
  const [market, setMarket] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setPinDigit(i: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[i] = digit;
    setPin(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isNew) {
        await api.post("/auth/register", { phone, pin: pin.join(""), name, market });
      } else {
        await api.post("/auth/login", { phone, pin: pin.join("") });
      }
      navigate("/home");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDemo() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/demo");
      navigate("/home");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Shell paper>
      <Screen className="pt-7 gap-4.5">
        <div className="relative z-[1] flex items-center gap-2.5">
          <Mark />
          <Wordmark />
        </div>

        <h1 className="relative z-[1] text-[23px] leading-[29px] font-extrabold max-w-[260px]">
          {s.title}
        </h1>

        <form className="flex flex-col gap-4 relative z-[1]" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-muted">{s.phone}</span>
            <input
              type="tel"
              name="phone"
              placeholder="080 000 0000"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 border-0 border-b-[1.5px] border-line bg-transparent text-base focus:outline-none focus:border-brand"
            />
          </label>

          <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0">
            <legend className="text-[13px] font-semibold text-muted px-0">{s.pin}</legend>
            <div className="flex gap-3">
              {pin.map((d, i) => (
                <label key={i} className="flex-1">
                  <span className="sr-only">PIN digit {i + 1}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => setPinDigit(i, e.target.value)}
                    className="w-full h-12 text-center text-[22px] font-bold border-0 border-b-[1.5px] border-line bg-transparent focus:outline-none focus:border-brand"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          {isNew && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-muted">Shop name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 border-0 border-b-[1.5px] border-line bg-transparent text-base focus:outline-none focus:border-brand"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-muted">Market</span>
                <input
                  type="text"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  placeholder="Kuto, Itoku, Lafenwa..."
                  className="h-11 border-0 border-b-[1.5px] border-line bg-transparent text-base focus:outline-none focus:border-brand"
                />
              </label>
            </>
          )}

          {error && <p className="text-[13px] text-owed m-0">{error}</p>}

          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : s.continue}
          </Button>
          <Button type="button" variant="text" onClick={() => setIsNew((v) => !v)}>
            {isNew ? "I already have a shop" : s.newHere}
          </Button>
        </form>

        <div className="flex-1" />

        <div className="flex items-center gap-3 text-muted text-[13px]">
          <span className="flex-1 h-px bg-line" />
          <span>{s.or}</span>
          <span className="flex-1 h-px bg-line" />
        </div>
        <Button type="button" variant="outline" onClick={onDemo} disabled={busy}>
          {s.demo}
        </Button>
        <p className="relative z-[1] text-center text-[13px] text-muted m-0">{s.demoShop}</p>
      </Screen>
    </Shell>
  );
}
