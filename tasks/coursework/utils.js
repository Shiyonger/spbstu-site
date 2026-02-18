export function $(sel){ return document.querySelector(sel) }
export function $all(sel){ return Array.from(document.querySelectorAll(sel)) }
export function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)] }
export function formatTime(s){ const m = Math.floor(s/60); const ss = s%60; return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}` }
export default { $, $all, randChoice, formatTime }
