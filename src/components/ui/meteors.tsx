import { cn } from "@/lib/utils";

export function Meteors({
  number = 20,
  className,
}: {
  number?: number;
  className?: string;
}): React.ReactElement {
  const meteors = new Array(number).fill(true);
  return (
    <>
      {meteors.map((_, idx) => (
        <span
          key={`meteor-${idx}`}
          className={cn(
            "animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-bronze-light shadow-[0_0_0_1px_rgba(155,115,64,0.1)] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-bronze/60 before:to-transparent",
            className
          )}
          style={{
            top: 0,
            left: `${Math.floor(Math.random() * 800 - 400)}px`,
            animationDelay: `${Math.random() * 0.6 + 0.2}s`,
            animationDuration: `${Math.floor(Math.random() * 8 + 2)}s`,
          }}
        />
      ))}
    </>
  );
}
