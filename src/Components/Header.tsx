// src/components/Header.tsx

import Logo from "./Logo";
import "./Header.css";

export default function Header(): JSX.Element {
  return (
    <header className="header">
      <Logo />
    </header>
  );
}
