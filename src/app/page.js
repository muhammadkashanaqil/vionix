import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Image
        src="/logo.svg"
        alt="Vionix logo"
        width={500}
        height={500}
        priority
      />
    </main>
  );
}
