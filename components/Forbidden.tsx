import { ShieldAlert } from "lucide-react";

/** Tampilan 403 sederhana untuk halaman admin tanpa izin. */
export default function Forbidden() {
  return (
    <div className="glass mx-auto mt-16 max-w-md rounded-2xl p-10 text-center">
      <ShieldAlert className="mx-auto h-12 w-12 text-fuchsia-300" />
      <h2 className="font-display mt-4 text-2xl font-bold text-white">403</h2>
      <p className="mt-2 text-slate-400">
        Akses ditolak. Peran Anda tidak memiliki izin untuk halaman ini.
      </p>
    </div>
  );
}
