import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface QuickReplyButtonsProps {
  options: string[];
  onSelect: (option: string) => void;
}

export function QuickReplyButtons({ options, onSelect }: QuickReplyButtonsProps) {
  const navigate = useNavigate();

  const handleSelect = (option: string) => {
    const normalized = option.trim().toLowerCase();

    // Prevent known loop: this quick reply should navigate, not be re-parsed as text.
    if (
      normalized === "open room service menu" ||
      normalized === "open menu" ||
      normalized === "show menu" ||
      normalized === "view menu" ||
      normalized === "order one of these"
    ) {
      navigate("/guest/room-service");
      return;
    }

    onSelect(option);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map((option) => (
        <Button
          key={option}
          variant="tertiary"
          size="sm"
          onClick={() => handleSelect(option)}
          className="hover:scale-105"
        >
          {option}
        </Button>
      ))}
    </div>
  );
}
