import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, RotateCw, Clock, Image as ImageIcon } from "lucide-react";
import { Shell, Screen } from "../components/Shell";
import { Button } from "../components/ui";
import { strings } from "../lib/strings";
import { api } from "../lib/api";

/** shrinks a photo to about 1600px on the long side before it ever leaves
 * the phone, per ~/odS_hack/plan/20_HANDOFF.md section 4.5: small photos
 * send fast on weak data. */
function shrinkImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const longSide = Math.max(img.width, img.height);
      const scale = Math.min(1, 1600 / longSide);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not prepare the photo."));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not prepare the photo."))), "image/jpeg", 0.82);
    };
    img.onerror = () => reject(new Error("Could not open that photo."));
    img.src = url;
  });
}

export function Scan() {
  const navigate = useNavigate();
  const s = strings.scan;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChosen(file: File) {
    setError(null);
    try {
      const shrunk = await shrinkImage(file);
      setBlob(shrunk);
      setPreview(URL.createObjectURL(shrunk));
      setRotation(0);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onUse() {
    if (!blob) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      const rotated = rotation === 0 ? blob : await rotateBlob(blob, rotation);
      form.append("photo", rotated, "page.jpg");
      form.append("clientId", crypto.randomUUID());
      const { id } = await api.postForm<{ id: string }>("/pages", form);
      navigate(`/check/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

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
            onClick={() => setRotation((r) => (r + 90) % 360)}
            disabled={!preview}
            className="flex h-9.5 w-9.5 items-center justify-center rounded-[8px] text-ink disabled:opacity-30"
          >
            <RotateCw size={19} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-line rounded-[10px] px-3.5 py-2.5">
          <Clock size={17} strokeWidth={2} className="text-brand" aria-hidden="true" />
          <span className="text-[14px]">{s.hint}</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFileChosen(e.target.files[0])}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 rounded-[14px] bg-[#262B28] relative flex items-center justify-center overflow-hidden border-0 p-0"
        >
          {preview ? (
            <img
              src={preview}
              alt="Photo of the notebook page"
              style={{ transform: `rotate(${rotation}deg)` }}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="w-[70%] aspect-[3/4] bg-[#EFEDE3] rounded flex flex-col items-center justify-center gap-2.5 text-[#8e968e]">
              <ImageIcon size={36} strokeWidth={1.7} aria-hidden="true" />
              <span className="text-[13px]">Tap to take a photo</span>
            </div>
          )}
        </button>

        {error && <p className="text-[13px] text-owed m-0">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
            {s.retake}
          </Button>
          <Button onClick={onUse} disabled={!blob || busy}>
            {busy ? "Sending..." : s.use}
          </Button>
        </div>
      </Screen>
    </Shell>
  );
}

async function rotateBlob(blob: Blob, deg: number): Promise<Blob> {
  const img = await createImageBitmap(blob);
  const swap = deg === 90 || deg === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? img.height : img.width;
  canvas.height = swap ? img.width : img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.82));
}
