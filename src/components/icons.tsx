import type { SVGAttributes } from "react";

export function Bullseye(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 22H6v-2h12v2ZM6 20H4v-2h2v2Zm14 0h-2v-2h2v2ZM4 18H2V6h2v12Zm12 0H8v-2h8v2Zm6 0h-2V8h2v10ZM8 16H6V8h2v8Zm10 0h-2v-4h2v4Zm-4-2h-4v-4h4v4Zm2-4h-2V8h2v2Zm-4-2H8V6h4v2Zm6 0h-2V6h2v2ZM6 6H4V4h2v2Zm14-2h2v2h-4V2h2v2Zm-4 0H6V2h10v2Z" />
    </svg>
  );
}

export function Search(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 22h-2v-2h2v2Zm-2-2h-2v-2h2v2Zm-6-2H6v-2h8v2Zm4 0h-2v-2h2v2ZM6 16H4v-2h2v2Zm10 0h-2v-2h2v2ZM4 14H2V6h2v8Zm14 0h-2V6h2v8ZM6 6H4V4h2v2Zm10 0h-2V4h2v2Zm-2-2H6V2h8v2Z" />
    </svg>
  );
}

export function Paper(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4H4v16h2zm10-2H4v2h12zm4 4h-2v14h2zm0 14H4v2h16zM16 4h2v2h-2zm-4 0h2v6h-2z" />
      <path d="M12 8h6v2h-6zm-5 6h2v5H7zm2 1h2v2H9zm-2-3h6v2H7zm4 2h2v5h-2zm3-2h2v7h-2z" />
    </svg>
  );
}

export function Flash(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 13h8v6h2v2h-2v2h-2v-8H2v-4h2v2Zm12 6h-2v-2h2v2Zm2-2h-2v-2h2v2Zm2-2h-2v-2h2v2Zm-6-6h8v4h-2v-2h-8V5h-2V3h2V1h2v8Zm-8 2H4V9h2v2Zm2-2H6V7h2v2Zm2-2H8V5h2v2Z" />
    </svg>
  );
}

export function CutPaper(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 2v2h4v18H4V4h4V2h8ZM6 20h12V6h-2v2H8V6H6v14Zm4-16v2h4V4h-4Z" />
    </svg>
  );
}

export function Anvil(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 4h4v2H2zm0 2h2v2H2zm2 2h2v2H4zm2-6h2v10H6z" />
      <path d="M6 10h12v2H6zm12-2h2v2h-2zm2-6h2v6h-2zM6 2h14v2H6zm2 10h2v4H8zm6 0h2v4h-2zM4 16h16v2H4zm0 2h2v4H4zm14 0h2v4h-2zM6 20h12v2H6z" />
    </svg>
  );
}
