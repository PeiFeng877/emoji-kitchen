import Box from "@mui/material/Box";
import ImageListItem from "@mui/material/ImageListItem";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import React, { useState, useMemo } from "react";
import { getEmojiData, getNotoEmojiUrl, getSupportedEmoji } from "./utils";

type ActivePosition = "A" | "B" | null;

interface EmojiSelectorProps {
  onEmojiSelect: (emojiCodepoint: string) => void;
  selectedLeftEmoji: string;
  selectedRightEmoji: string;
  activePosition: ActivePosition;
}

export default function EmojiSelector({
  onEmojiSelect,
  selectedLeftEmoji,
  selectedRightEmoji,
  activePosition,
}: EmojiSelectorProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const allEmojis = getSupportedEmoji();

  // 根据搜索词过滤emoji
  const filteredEmojis = useMemo(() => {
    if (!searchTerm.trim()) {
      return allEmojis;
    }

    const searchLower = searchTerm.toLowerCase();
    return allEmojis.filter((emojiCodepoint) => {
      const data = getEmojiData(emojiCodepoint);
      const keywords = data.keywords.map((k) => k.toLowerCase());
      const alt = data.alt.toLowerCase();
      return (
        keywords.some((k) => k.includes(searchLower)) ||
        alt.includes(searchLower)
      );
    });
  }, [searchTerm, allEmojis]);

  const handleEmojiClick = (emojiCodepoint: string) => {
    if (activePosition) {
      onEmojiSelect(emojiCodepoint);
    }
  };

  return (
    <Box>
      {/* 搜索框 */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="搜索emoji..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          disabled={!activePosition}
          helperText={
            activePosition
              ? `正在为位置 ${activePosition} 选择emoji`
              : "请先点击上方的A或B位置"
          }
        />
      </Box>

      {/* Emoji网格 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(10, 1fr)",
            sm: "repeat(12, 1fr)",
            md: "repeat(16, 1fr)",
            lg: "repeat(20, 1fr)",
            xl: "repeat(24, 1fr)",
          },
          gap: 0.5,
        }}
      >
        {filteredEmojis.map((emojiCodepoint) => {
          const data = getEmojiData(emojiCodepoint);
          const isSelected =
            emojiCodepoint === selectedLeftEmoji ||
            emojiCodepoint === selectedRightEmoji;
          const isDisabled = !activePosition;

          return (
            <ImageListItem
              key={data.alt}
              onClick={() => handleEmojiClick(emojiCodepoint)}
              sx={{
                p: 0.5,
                borderRadius: 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.3 : 1,
                backgroundColor: (theme) =>
                  isSelected
                    ? theme.palette.action.selected
                    : theme.palette.background.default,
                "&:hover": {
                  backgroundColor: (theme) => {
                    if (isDisabled) return theme.palette.background.default;
                    return theme.palette.action.hover;
                  },
                },
                transition: "all 0.2s ease-in-out",
                border: isSelected ? 2 : 0,
                borderColor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                loading="lazy"
                width="20px"
                height="20px"
                alt={data.alt}
                src={getNotoEmojiUrl(data.emojiCodepoint)}
                style={{
                  pointerEvents: "none",
                }}
              />
            </ImageListItem>
          );
        })}
      </Box>

      {/* 显示结果数量 */}
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          显示 {filteredEmojis.length} / {allEmojis.length} 个emoji
        </Typography>
      </Box>
    </Box>
  );
}

