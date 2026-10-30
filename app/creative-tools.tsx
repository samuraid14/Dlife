"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { RotateCw, Undo2, Redo2, Eraser, Pencil, Check, X, LoaderCircle } from "lucide-react";

export type CreativeTool = { kind: "photo"; key: string; name: string } | { kind: "drawing" };
type Props = { onSave: (file: File) => Promise<void>; onClose: () => void };
const PAPER = "#fcf6e8";
function png(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(new File([blob], name, { type: "image/png" })) : reject(new Error("图片保存失败，请重试")), "image/png"));
}
export function PhotoEditor({ source, name, onSave, onClose }: Props & { source: string; name: string }) {
  const canvas = useRef<HTMLCanvasElement>(null), image = useRef<HTMLImageElement | null>(null);
  const [turn, setTurn] = useState(0), [ratio, setRatio] = useState("original"), [zoom, setZoom] = useState(1), [panX, setPanX] = useState(50), [panY, setPanY] = useState(50);
  const [brightness, setBrightness] = useState(0), [contrast, setContrast] = useState(0), [mono, setMono] = useState(false), [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => { if (alive) { image.current = img; setLoaded(true); } };
    img.onerror = () => { if (alive) setError("照片未能打开，请重新登录或再试一次。"); };
    img.src = source;
    return () => { alive = false; image.current = null; };
  }, [source]);
  useEffect(() => {
    if (!loaded || !image.current || !canvas.current) return;
    try {
      const img = image.current;
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
      const stage = document.createElement("canvas");
      stage.width = turn % 2 ? h : w; stage.height = turn % 2 ? w : h;
      const ctx = stage.getContext("2d")!;
      ctx.translate(stage.width / 2, stage.height / 2); ctx.rotate(turn * Math.PI / 2); ctx.drawImage(img, -w / 2, -h / 2, w, h);
      const aspect = ratio === "original" ? stage.width / stage.height : Number(ratio);
      const cw = Math.min(stage.width, stage.height * aspect) / zoom, ch = cw / aspect;
      const out = canvas.current;
      out.width = Math.max(1, Math.round(cw)); out.height = Math.max(1, Math.round(ch));
      const dest = out.getContext("2d")!;
      dest.drawImage(stage, (stage.width - cw) * panX / 100, (stage.height - ch) * panY / 100, cw, ch, 0, 0, out.width, out.height);
      // Pixel adjustments also work in browsers without CanvasRenderingContext2D.filter.
      if (brightness || contrast || mono) {
        const pixels = dest.getImageData(0, 0, out.width, out.height), d = pixels.data;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        for (let i = 0; i < d.length; i += 4) {
          let r = factor * (d[i] - 128) + 128 + brightness, g = factor * (d[i + 1] - 128) + 128 + brightness, b = factor * (d[i + 2] - 128) + 128 + brightness;
          if (mono) r = g = b = .299 * r + .587 * g + .114 * b;
          d[i] = r; d[i + 1] = g; d[i + 2] = b;
        }
        dest.putImageData(pixels, 0, 0);
      }
      setError("");
    } catch { setError("这张照片无法编辑，请尝试 JPG、PNG 或 WebP 图片。"); }
  }, [loaded, turn, ratio, zoom, panX, panY, brightness, contrast, mono]);
  function reset() { setTurn(0); setRatio("original"); setZoom(1); setPanX(50); setPanY(50); setBrightness(0); setContrast(0); setMono(false); }
  async function save() {
    if (!canvas.current || busy || !loaded) return;
    setBusy(true); setError("");
    try { await onSave(await png(canvas.current, name.replace(/\.[^.]+$/, "") + "-edited.png")); }
    catch (e) { setError(e instanceof Error ? e.message : "保存失败，照片仍在这里，请重试。"); }
    finally { setBusy(false); }
  }
  return <section className="creative-editor" aria-label="照片编辑器">
    <div className="creative-head"><div><span className="eyebrow">THE DARKROOM</span><h3>整理一张旧时光</h3></div><button type="button" aria-label="关闭照片编辑" disabled={busy} onClick={onClose}><X size={19}/></button></div>
    <p className="tool-description">选择画幅，再移动、旋转或调整色调。保存后替换本次日记中的照片；动图会保存为静态图片。</p>
    <div className="photo-workspace"><canvas ref={canvas} aria-label="编辑后的照片预览" hidden={!loaded}/>{!loaded && !error && <p>正在打开照片…</p>}</div>
    <fieldset disabled={busy || !loaded} className="creative-controls">
      <div className="creative-row"><label>裁剪画幅<select value={ratio} onChange={e => setRatio(e.target.value)}><option value="original">原画幅</option><option value="1">正方形 1:1</option><option value="0.75">竖幅 3:4</option><option value="1.3333333333">横幅 4:3</option><option value="1.7777777778">宽幅 16:9</option></select></label><button className="secondary" type="button" onClick={() => setTurn((turn + 1) % 4)}><RotateCw size={15}/>向右旋转</button></div>
      <label>裁剪缩放 <output>{zoom.toFixed(1)}×</output><input type="range" min="1" max="3" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))}/></label>
      <div className="creative-row"><label>水平位置<input type="range" min="0" max="100" value={panX} onChange={e => setPanX(Number(e.target.value))}/></label><label>垂直位置<input type="range" min="0" max="100" value={panY} onChange={e => setPanY(Number(e.target.value))}/></label></div>
      <div className="creative-row"><label>亮度 <output>{brightness}</output><input type="range" min="-80" max="80" value={brightness} onChange={e => setBrightness(Number(e.target.value))}/></label><label>对比度 <output>{contrast}</output><input type="range" min="-80" max="80" value={contrast} onChange={e => setContrast(Number(e.target.value))}/></label></div>
      <label className="check-label"><input type="checkbox" checked={mono} onChange={e => setMono(e.target.checked)}/>黑白照片</label>
    </fieldset>
    {error && <p className="tool-error" role="alert">{error}</p>}
    <div className="creative-footer"><button type="button" className="text-button" disabled={busy} onClick={reset}>恢复原图</button><button type="button" className="primary" disabled={busy || !loaded} onClick={save}>{busy ? <LoaderCircle className="spin" size={15}/> : <Check size={15}/>}保存照片</button></div>
  </section>;
}
type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: string; width: number };
export function DrawingPad({ onSave, onClose }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null), strokes = useRef<Stroke[]>([]), redo = useRef<Stroke[]>([]), active = useRef<Stroke | null>(null), pointer = useRef<number | null>(null);
  const [color, setColor] = useState("#544537"), [width, setWidth] = useState(6), [eraser, setEraser] = useState(false), [revision, setRevision] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState("");
  function renderStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = s.width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.arc(s.points[0].x, s.points[0].y, s.width / 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s.points[0].x, s.points[0].y); s.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
  }
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 1000, 700);
    strokes.current.forEach(s => renderStroke(ctx, s));
  }, [revision]);
  function point(e: PointerEvent<HTMLCanvasElement>) { const r = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - r.left) * 1000 / r.width, y: (e.clientY - r.top) * 700 / r.height }; }
  function start(e: PointerEvent<HTMLCanvasElement>) {
    if (busy || pointer.current !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); pointer.current = e.pointerId;
    const stroke = { points: [point(e)], color: eraser ? PAPER : color, width: eraser ? width * 4 : width };
    active.current = stroke; renderStroke(e.currentTarget.getContext("2d")!, stroke);
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== e.pointerId || !active.current) return;
    const s = active.current, prev = s.points[s.points.length - 1], p = point(e), ctx = e.currentTarget.getContext("2d")!;
    s.points.push(p); ctx.strokeStyle = s.color; ctx.lineWidth = s.width; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  function finish(e: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== e.pointerId || !active.current) return;
    strokes.current = [...strokes.current, active.current]; redo.current = []; active.current = null; pointer.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setRevision(n => n + 1);
  }
  async function save() {
    if (!canvas.current || busy || !strokes.current.length) return;
    setBusy(true); setError("");
    try { await onSave(await png(canvas.current, "我的心情画-" + new Date().toISOString().slice(0, 10) + ".png")); }
    catch (e) { setError(e instanceof Error ? e.message : "保存失败，画作仍在这里，请重试。"); }
    finally { setBusy(false); }
  }
  return <section className="creative-editor" aria-label="心情画板">
    <div className="creative-head"><div><span className="eyebrow">A FEELING IN COLOUR</span><h3>今天的心情，画下来。</h3></div><button type="button" disabled={busy} aria-label="关闭画板" onClick={onClose}><X size={19}/></button></div>
    <p className="tool-description">画一个形状，涂一片颜色。用鼠标、手指或触控笔，留下此刻的感受。</p>
    <fieldset className="drawing-toolbar" disabled={busy}>
      <button type="button" className={!eraser ? "selected" : ""} aria-pressed={!eraser} onClick={() => setEraser(false)}><Pencil size={16}/>画笔</button>
      <button type="button" className={eraser ? "selected" : ""} aria-pressed={eraser} onClick={() => setEraser(true)}><Eraser size={16}/>橡皮</button>
      <label className="ink-picker">颜色<input aria-label="画笔颜色" type="color" value={color} onChange={e => { setColor(e.target.value); setEraser(false); }}/></label>
      <label className="pen-width">粗细 <input aria-label="画笔粗细" type="range" min="2" max="30" value={width} onChange={e => setWidth(Number(e.target.value))}/><output>{width}</output></label>
      <button type="button" aria-label="撤销一笔" disabled={!strokes.current.length} onClick={() => { redo.current.push(strokes.current.pop()!); setRevision(n => n + 1); }}><Undo2 size={17}/></button>
      <button type="button" aria-label="重做一笔" disabled={!redo.current.length} onClick={() => { strokes.current.push(redo.current.pop()!); setRevision(n => n + 1); }}><Redo2 size={17}/></button>
    </fieldset>
    <canvas className="drawing-canvas" ref={canvas} width="1000" height="700" aria-label="绘画区域，支持鼠标、手指和触控笔" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}/>
    {error && <p className="tool-error" role="alert">{error}</p>}
    <div className="creative-footer"><span>画作将作为一张照片加入这篇日记。</span><button className="primary" type="button" disabled={busy || !strokes.current.length} onClick={save}>{busy ? <LoaderCircle className="spin" size={15}/> : <Check size={15}/>}加入日记</button></div>
  </section>;
}
