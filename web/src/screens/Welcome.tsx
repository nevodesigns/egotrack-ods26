import { useNavigate } from "react-router";
import { Mark, Wordmark } from "../components/Logo";
import { Shell, Screen } from "../components/Shell";
import { Button, LinkButton } from "../components/ui";
import { strings } from "../lib/strings";

export function Welcome() {
  const navigate = useNavigate();
  const s = strings.welcome;

  function onContinue(e: React.FormEvent) {
    e.preventDefault();
    // T4 wires this to POST /api/auth/login
    navigate("/home");
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

        <form className="flex flex-col gap-4 relative z-[1]" onSubmit={onContinue}>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-muted">{s.phone}</span>
            <input
              type="tel"
              name="phone"
              placeholder="080 000 0000"
              autoComplete="tel"
              className="h-11 border-0 border-b-[1.5px] border-line bg-transparent text-base focus:outline-none focus:border-brand"
            />
          </label>

          <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0">
            <legend className="text-[13px] font-semibold text-muted px-0">{s.pin}</legend>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <label key={i} className="flex-1">
                  <span className="sr-only">PIN digit {i}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-full h-12 text-center text-[22px] font-bold border-0 border-b-[1.5px] border-line bg-transparent focus:outline-none focus:border-brand"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <Button type="submit">{s.continue}</Button>
          <Button type="button" variant="text" onClick={() => navigate("/home")}>
            {s.newHere}
          </Button>
        </form>

        <div className="flex-1" />

        <div className="flex items-center gap-3 text-muted text-[13px]">
          <span className="flex-1 h-px bg-line" />
          <span>{s.or}</span>
          <span className="flex-1 h-px bg-line" />
        </div>
        <LinkButton to="/home" variant="outline">
          {s.demo}
        </LinkButton>
        <p className="relative z-[1] text-center text-[13px] text-muted m-0">{s.demoShop}</p>
      </Screen>
    </Shell>
  );
}
