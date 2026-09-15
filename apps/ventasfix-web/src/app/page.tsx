import { redirect } from "next/navigation";

// proxy.ts ya protege "/"; solo llega acá con sesión válida.
export default function Home() {
  redirect("/dashboard");
}
