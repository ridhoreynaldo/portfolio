/**
 * Logo teks Leetcloud: "1337" (leetspeak, ungu) + "cloud" (biru langit galaksi, berkilau).
 * Dipakai di semua tempat nama brand tampil sebagai teks. Pembaca layar tetap membaca "Leetcloud".
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`} aria-label="Leetcloud" role="img">
      <span className="wm-leet" aria-hidden>1337</span>
      <span className="wm-cloud" aria-hidden>cloud</span>
    </span>
  );
}
