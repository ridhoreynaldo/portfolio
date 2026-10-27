import { redirect } from "next/navigation";

/** Katalog lama (/order) sudah dipindah ke halaman jasa; tautan lama tetap bekerja. */
export default function OrderPage() {
  redirect("/jasa#paket");
}
