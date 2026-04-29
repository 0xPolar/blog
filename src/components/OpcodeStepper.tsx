import { useState } from "react";

export interface Opcode {
  hex: string;
  desc: string;
}

interface Props {
  opcodes: Opcode[];
}

export default function OpcodeStepper({ opcodes }: Props) {
  const [step, setStep] = useState(0);

  const next = () => {
    const newStep = Math.min(step + 1, opcodes.length - 1);
    setStep(newStep);
    if (typeof window !== "undefined" && (window as any).umami) {
      (window as any).umami.track("opcode-stepped", {
        step: newStep,
        opcode: opcodes[newStep].hex,
      });
    }
  };

  const reset = () => setStep(0);

  return (
    <div className="border border-border rounded-lg p-4 my-6 bg-surface not-prose">
      <div className="font-mono text-lg text-accent">{opcodes[step].hex}</div>
      <div className="text-muted text-sm mt-1">{opcodes[step].desc}</div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={next}
          disabled={step >= opcodes.length - 1}
          className="px-3 py-1 bg-accent text-bg font-medium rounded disabled:opacity-50"
        >
          Step
        </button>
        <button
          onClick={reset}
          className="px-3 py-1 bg-surface border border-border text-text rounded"
        >
          Reset
        </button>
        <span className="text-muted text-sm self-center ml-auto">
          {step + 1} / {opcodes.length}
        </span>
      </div>
    </div>
  );
}
