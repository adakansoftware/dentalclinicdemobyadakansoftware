import { LangProvider } from "@/context/LangContext";
import NotFoundClient from "@/components/public/NotFoundClient";

export default function NotFound() {
  return (
    <LangProvider>
      <NotFoundClient />
    </LangProvider>
  );
}
