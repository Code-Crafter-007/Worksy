// src/components/Logo.tsx

import logo from "../assets/Worksy-logo.png";

export default function Logo(): JSX.Element {
  return (
    <div className="logo-wrapper">
      <img src={logo} alt="Worksy logo" className="logo-img" />
    </div>
  );
}
