import { Link } from "react-router-dom";

interface LogoProps {
  variant?: 'default' | 'dark' | 'light';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showIcon?: boolean;
  showText?: boolean;
  useWordLogo?: boolean; // Use word logo image instead of text
  linkTo?: string;
}

export function InnaraLogo({
  variant = 'default',
  size = 'md',
  showIcon = true,
  showText = true,
  useWordLogo = true,
  linkTo
}: LogoProps) {
  // Size configurations including new xs for demo headers
  const sizeConfig = {
    xs: { height: 'h-6', logoHeight: 24, wordLogoHeight: 16, fontSize: 'text-sm', gap: 'gap-1.5' },
    sm: { height: 'h-10', logoHeight: 40, wordLogoHeight: 28, fontSize: 'text-xl', gap: 'gap-2.5' },
    md: { height: 'h-14', logoHeight: 56, wordLogoHeight: 40, fontSize: 'text-2xl', gap: 'gap-3' },
    lg: { height: 'h-20', logoHeight: 80, wordLogoHeight: 56, fontSize: 'text-3xl', gap: 'gap-4' },
    xl: { height: 'h-24', logoHeight: 96, wordLogoHeight: 68, fontSize: 'text-4xl', gap: 'gap-4' },
    '2xl': { height: 'h-32', logoHeight: 128, wordLogoHeight: 90, fontSize: 'text-5xl', gap: 'gap-5' }
  };

  const config = sizeConfig[size];

  const logoSrc = variant === 'light'
    ? '/innaralightlogo2.png'
    : '/innaralogo2.png';

  const wordLogoSrc = variant === 'light'
    ? '/innaralightword.png'
    : '/innarawordlogo.png';

  const textColorClass = variant === 'light' ? 'text-white' : 'text-[#1a1d3a]';

  const content = (
    <div className={`flex items-center ${config.gap}`}>
      {showIcon && (
        <img
          src={logoSrc}
          alt="INNARA"
          className="w-auto object-contain"
          style={{ height: config.logoHeight }}
        />
      )}
      {showText && !useWordLogo && (
        <span className={`${config.fontSize} font-semibold tracking-wide ${textColorClass}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
          INNARA
        </span>
      )}
      {showText && useWordLogo && (
        <>
          <img
            src={wordLogoSrc}
            alt="INNARA"
            className="w-auto object-contain"
            style={{ height: config.wordLogoHeight }}
          />
          <span className="sr-only">INNARA</span>
        </>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

// Standalone icon export for favicon or small uses
export function InnaraIcon({ className }: { className?: string }) {
  return (
    <img
      src="/innaralogo2.png"
      alt="INNARA"
      className={className}
    />
  );
}
