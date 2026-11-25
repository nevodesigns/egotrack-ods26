import { useNavigate } from "react-router";
import { ArrowLeft, RotateCw, Clock, Image as ImageIcon } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { Button, LinkButton } from "../components/ui";
import { strings } from "../lib/strings";

export function Scan() {
  const navigate = useNavigate();
  const s = strings.scan;

  return (
    <Shell>
      <Screen className="pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back to Home"
            onClick={() => navigate("/home")}
            className="flex h-9.5 w-9.5 items-center justify-center rounded-[8px] text-ink"
          >
            <ArrowLeft size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <span className="text-[18px] font-extrabold">{s.title}</span>
          <span className="flex-1" />
          <button
            type="button"
            aria-label={s.rotate}
            className="flex h-9.5 w-9.5 items-center justify-center rounded-[8px] text-ink"
          >
            <RotateCw size={19} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-line rounded-[10px] px-3.5 py-2.5">
          <Clock size={17} strokeWidth={2} className="text-brand" aria-hidden="true" />
          <span className="text-[14px]">{s.hint}</span>
        </div>

        <div className="flex-1 rounded-[14px] bg-[#262B28] relative flex items-center justify-center overflow-hidden">
          <div className="w-[70%] aspect-[3/4] bg-[#EFEDE3] rounded flex flex-col items-center justify-center gap-2.5 text-[#8e968e] shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
            <ImageIcon size={36} strokeWidth={1.7} aria-hidden="true" />
            <span className="text-[13px]">Photo of notebook page</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" type="button">
            {s.retake}
          </Button>
          <LinkButton to="/check">{s.use}</LinkButton>
        </div>
        <Button variant="text" type="button">
          {s.gallery}
        </Button>
      </Screen>
    </Shell>
  );
}
