import { registerAct } from "./events";
import { S } from "../core/store";

/* ================= 模块：ui/audio 音效与朗读 =================
 * 职责：WebAudio 音效（beep/sTick/sOk/sBad/sWin/sShield）、TTS 单词朗读 speak()
 * 依赖：core/store（S.set.sound/S.set.tts，运行时）
 * 共享状态：AC（AudioContext 单例，本模块持有）
 * ==================================================================== */
/* ================= 音效 / 朗读（修复移动端TTS） ================= */
let AC: any;
export function ac() {
  return AC || (AC = new (window as any).AudioContext || (window as any).webkitAudioContext());
}
export function beep(f: any, d = 0.07, t = "square", g = 0.045) {
  if (!S.set.sound) return;
  try {
    const a = ac(),
      o = a.createOscillator(),
      v = a.createGain();
    o.type = t;
    o.frequency.value = f;
    v.gain.value = g;
    v.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
    o.connect(v).connect(a.destination);
    o.start();
    o.stop(a.currentTime + d);
  } catch (e) {}
}
export const sTick = () => beep(760, 0.03, "square", 0.02),
  sOk = () => {
    beep(660, 0.08);
    setTimeout(() => beep(880, 0.1), 60);
  },
  sBad = () => beep(130, 0.16, "sawtooth", 0.06),
  sWin = () =>
    [523, 659, 784, 1047].forEach((f: any, i: any) =>
      setTimeout(() => beep(f, 0.14, "triangle", 0.06), i * 110)
    ),
  sShield = () => beep(420, 0.12, "triangle", 0.06);

export function speak(t: any) {
  if (!S.set.tts) return;
  try {
    if (AC && AC.state === "suspended") AC.resume().catch(() => {});
    (window as any).speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "en-US";
    u.rate = 0.92;
    u.pitch = 1.0;
    u.volume = 1.0;
    const voices = (window as any).speechSynthesis.getVoices();
    const voice =
      voices.find((v: any) => v.lang.startsWith("en-US")) ||
      voices.find((v: any) => v.lang.startsWith("en")) ||
      null;
    if (voice) u.voice = voice;
    u.onerror = (e: any) => {
      console.warn("TTS error:", e);
    };
    (window as any).speechSynthesis.speak(u);
  } catch (e) {
    console.warn("speak exception:", e);
  }
}









registerAct("speak", (_el: any, _ev: any, args: any[]) => (speak as any)(...(args || [])));
