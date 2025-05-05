import { RefObject } from "react";
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

export function hasRole(roles: Role[], role: string) {
    return roles?.some(r => r.id === role);
}


export function handleKioskKeyDown(e: any, firstElemRef: RefObject<any>, document: Document) {
    if (e.key == " " || (e.key === "Tab" && !e.shiftKey)) {
        beep(200, 50, 40)
        // Focus the first element if we're on the last one
        e.preventDefault();
        e.stopPropagation();
        if (document.activeElement?.getAttribute("tab-marker") === "last") {
            firstElemRef.current?.focus();
            console.log("focus first")
        } else {
            // Move to next focusable element            
            const focusable = Array.from(
                document.querySelectorAll<HTMLElement>(
                    'button, [tabindex]:not([tabindex="-1"])'
                )
            ).filter(el => !el.hasAttribute("disabled") && el.tabIndex >= 0);

            const index = focusable.indexOf(document.activeElement as HTMLElement);
            if (index > -1 && index + 1 < focusable.length) {
                console.log("focus next")
                focusable[index + 1].focus();
            } else if (focusable.length > 0) {
                console.log("focus first")
                focusable[0].focus();
            }

        }
        return false;
    }
}

export function documentKioskKeyDown(firstElemRef: RefObject<any>, document: Document ) {

    const kdHandler = (e: any) => handleKioskKeyDown(e, firstElemRef, document);

    document.addEventListener("keydown", kdHandler);

    // remove event handler
    return () => document.removeEventListener("keydown", kdHandler);
}