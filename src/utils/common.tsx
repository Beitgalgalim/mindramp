import { Role } from "../types";

let actx: AudioContext | undefined = undefined;

export function beep(vol: number, freq: number, duration: number) {
    try {
        if (!actx) actx = new AudioContext();
        let v = actx.createOscillator();
        let u = actx.createGain();
        v.connect(u);
        v.frequency.value = freq;
        u.connect(actx.destination);
        u.gain.value = vol * 0.01;
        v.start(actx.currentTime);
        v.stop(actx.currentTime + duration * 0.001);
    } catch {
        // ignore
    }
}

export function hasRole(roles:Role[], role:string) {
    return roles?.some(r=>r.id === role);
}
