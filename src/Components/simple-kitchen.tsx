import {
  amber,
  blue,
  cyan,
  deepOrange,
  deepPurple,
  green,
  indigo,
  lightBlue,
  lightGreen,
  lime,
  orange,
  pink,
  purple,
  teal,
} from "@mui/material/colors";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import React, { useState } from "react";
import { getEmojiData, getNotoEmojiUrl, getSupportedEmoji } from "./utils";
import EmojiSelector from "./emoji-selector";
import CommentGenerator from "./comment-generator";
import PromptEditorButton from "./prompt-editor-simple";

interface CommentData {
  组合: string;
  解读: string;
  锐评: string;
  补刀: string;
}

interface LogEntry {
  timestamp: Date;
  leftEmoji: string;
  rightEmoji: string;
  combinedEmoji?: string;
  prompt: string;
  result?: CommentData;
}

const colors = [
  amber,
  blue,
  cyan,
  deepOrange,
  deepPurple,
  green,
  indigo,
  lightBlue,
  lightGreen,
  lime,
  orange,
  pink,
  purple,
  teal,
];

const theme = createTheme({
  palette: {
    primary: colors[Math.floor(Math.random() * colors.length)],
  },
});

type ActivePosition = "A" | "B" | null;

export default function SimpleKitchen() {
  const [selectedLeftEmoji, setSelectedLeftEmoji] = useState<string>("");
  const [selectedRightEmoji, setSelectedRightEmoji] = useState<string>("");
  const [activePosition, setActivePosition] = useState<ActivePosition>(null);
  const [logs, setLogs] = useState<Array<LogEntry>>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>(() => {
    // 默认提示词
    return `你是一个精通网络抽象梗文化的锐评生成器。请根据用户提供的**两个emoji组合**，用以下JSON格式输出尖锐幽默的冒犯式锐评。

# 输出格式
{
  "组合": "用户提供的emoji",
  "解读": "用10字内解构该组合的本质",
  "锐评": "一句话锐评，需出现至少一个当代网络/生活黑话",
  "补刀": "括号内小字嘲讽，带比喻式羞辱"
}

# 风格规则
1. **短狠毒**：每条内容不超过一行，禁用形容词堆砌
2. **现实锚点**：必须捆绑具体生活场景（例：租房、加班、彩礼、炒股）
3. **类比公式**："像XX一样YY" 或 "XX的YY，YY的ZZ"
4. **黑话库**：优先使用「赛博功德、提肛、氪金、电子烧香、无效自律、破防流水线」等词

# 禁律
- 禁止使用"可能""或许"等暧昧词汇
- 禁止教育用户
- 禁止超过15个字以上的句子

# 示例
{
  "组合": "🏠+💸",
  "解读": "房贷式呼吸",
  "锐评": "房子在吸你寿，公积金在做法事",
  "补刀": "(建议把房产证烧了，能暖和点)"
}`;
  });

  const handleEmojiSelect = (emojiCodepoint: string) => {
    if (activePosition === "A") {
      setSelectedLeftEmoji(emojiCodepoint);
    } else if (activePosition === "B") {
      setSelectedRightEmoji(emojiCodepoint);
    }
  };

  // 提示词更新处理
  const handlePromptUpdate = (newPrompt: string) => {
    setCurrentPrompt(newPrompt);
  };
  
  // 打开提示词编辑器
  const handleOpenEditor = () => {
    // 这里可以使用PromptEditor组件的dialog功能
    // 或者只是简单地打开一个alert，根据需求决定
    console.log("打开提示词编辑器");
  };

  const handlePositionClick = (position: "A" | "B") => {
    // 如果点击的是当前激活的位置，取消激活
    if (activePosition === position) {
      setActivePosition(null);
      return;
    }
    
    // 激活该位置（可以替换已有的emoji）
    setActivePosition(position);
  };

  const handleClearPosition = (position: "A" | "B", event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止触发handlePositionClick
    if (position === "A") {
      setSelectedLeftEmoji("");
    } else {
      setSelectedRightEmoji("");
    }
    setActivePosition(null);
  };

  const getCombinedEmoji = () => {
    if (selectedLeftEmoji === "" || selectedRightEmoji === "") {
      return null;
    }

    const data = getEmojiData(selectedLeftEmoji);
    const combinations = data.combinations[selectedRightEmoji];

    if (!combinations || combinations.length === 0) {
      return null;
    }

    // 获取最新的组合
    const latestCombination = combinations.filter((c) => c.isLatest)[0];
    return latestCombination;
  };

  const combination = getCombinedEmoji();

  // 获取组合后的emoji URL
  const getCombinedEmojiUrl = () => {
    if (!combination) return null;
    return combination.gStaticUrl;
  };

  // 添加日志
  const addLog = (result?: CommentData) => {
    const combinedEmojiUrl = getCombinedEmojiUrl();
    const newLog = {
      timestamp: new Date(),
      leftEmoji: selectedLeftEmoji,
      rightEmoji: selectedRightEmoji,
      combinedEmoji: combinedEmojiUrl,
      prompt: currentPrompt,
      result
    };
    setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 100)); // 保留最新的100条
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100dvh",
          maxHeight: "100dvh",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          overflow: "hidden",
        }}
      >
        {/* 左侧区域：Emoji组合和选择 */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: (theme) => theme.palette.background.default,
          }}
        >
          {/* 上半部分：A + B = C */}
          <Box
            sx={{
              flexShrink: 0,
              py: 4,
              px: 2,
            }}
          >
            <Container maxWidth="md">
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 2, sm: 2 }}
                alignItems="center"
                justifyContent="center"
              >
                {/* A 位置 */}
                <Box sx={{ position: "relative" }}>
                  <Paper
                    elevation={activePosition === "A" ? 8 : 2}
                    onClick={() => handlePositionClick("A")}
                    sx={{
                      width: { xs: 100, sm: 120 },
                      height: { xs: 100, sm: 120 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      border: activePosition === "A" ? 3 : 0,
                      borderColor: "primary.main",
                      backgroundColor: (theme) =>
                        activePosition === "A"
                          ? theme.palette.action.selected
                          : theme.palette.background.paper,
                      "&:hover": {
                        backgroundColor: (theme) => theme.palette.action.hover,
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    {selectedLeftEmoji !== "" ? (
                      <img
                        src={getNotoEmojiUrl(
                          getEmojiData(selectedLeftEmoji).emojiCodepoint
                        )}
                        alt={getEmojiData(selectedLeftEmoji).alt}
                        style={{
                          width: "80%",
                          height: "80%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <Typography
                        variant={{ xs: "body2", sm: "h6" }}
                        color="text.secondary"
                        sx={{ userSelect: "none", textAlign: "center", px: 1 }}
                      >
                        点击选择
                      </Typography>
                    )}
                  </Paper>
                  {selectedLeftEmoji !== "" && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleClearPosition("A", e)}
                      sx={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        backgroundColor: (theme) => theme.palette.error.main,
                        color: "white",
                        "&:hover": {
                          backgroundColor: (theme) => theme.palette.error.dark,
                        },
                        width: 24,
                        height: 24,
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>

                {/* + 号 */}
                <Typography variant={{ xs: "h5", sm: "h4" }} sx={{ userSelect: "none" }}>
                  +
                </Typography>

                {/* B 位置 */}
                <Box sx={{ position: "relative" }}>
                  <Paper
                    elevation={activePosition === "B" ? 8 : 2}
                    onClick={() => handlePositionClick("B")}
                    sx={{
                      width: { xs: 100, sm: 120 },
                      height: { xs: 100, sm: 120 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      border: activePosition === "B" ? 3 : 0,
                      borderColor: "primary.main",
                      backgroundColor: (theme) =>
                        activePosition === "B"
                          ? theme.palette.action.selected
                          : theme.palette.background.paper,
                      "&:hover": {
                        backgroundColor: (theme) => theme.palette.action.hover,
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    {selectedRightEmoji !== "" ? (
                      <img
                        src={getNotoEmojiUrl(
                          getEmojiData(selectedRightEmoji).emojiCodepoint
                        )}
                        alt={getEmojiData(selectedRightEmoji).alt}
                        style={{
                          width: "80%",
                          height: "80%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <Typography
                        variant={{ xs: "body2", sm: "h6" }}
                        color="text.secondary"
                        sx={{ userSelect: "none", textAlign: "center", px: 1 }}
                      >
                        点击选择
                      </Typography>
                    )}
                  </Paper>
                  {selectedRightEmoji !== "" && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleClearPosition("B", e)}
                      sx={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        backgroundColor: (theme) => theme.palette.error.main,
                        color: "white",
                        "&:hover": {
                          backgroundColor: (theme) => theme.palette.error.dark,
                        },
                        width: 24,
                        height: 24,
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>

                {/* = 号 */}
                <Typography variant={{ xs: "h5", sm: "h4" }} sx={{ userSelect: "none" }}>
                  =
                </Typography>

                {/* C 结果位置 */}
                <Paper
                  elevation={2}
                  sx={{
                    width: { xs: 100, sm: 120 },
                    height: { xs: 100, sm: 120 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: (theme) => theme.palette.background.paper,
                  }}
                >
                  {combination ? (
                    <img
                      src={combination.gStaticUrl}
                      alt={combination.alt}
                      style={{
                        width: "90%",
                        height: "90%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <Typography
                      variant={{ xs: "body2", sm: "h6" }}
                      color="text.secondary"
                      sx={{ userSelect: "none", textAlign: "center", px: 1 }}
                    >
                      {selectedLeftEmoji !== "" && selectedRightEmoji !== ""
                        ? "无组合"
                        : ""}
                    </Typography>
                  )}
                </Paper>
              </Stack>

              {/* 提示信息 */}
              {activePosition && (
                <Typography
                  variant="body2"
                  color="primary"
                  textAlign="center"
                  sx={{ mt: 2 }}
                >
                  请从下方的emoji库中选择一个表情填入位置 {activePosition}
                </Typography>
              )}
            </Container>
          </Box>

          {/* 下半部分：Emoji库 */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
            }}
          >
            <Container maxWidth="lg" sx={{ py: 2 }}>
            {/* 锐评生成器 */}
            <CommentGenerator
              leftEmoji={selectedLeftEmoji}
              rightEmoji={selectedRightEmoji}
              currentPrompt={currentPrompt}
              onPromptUpdate={handlePromptUpdate}
              onAddLog={addLog}
              logs={logs}
            />

              {/* Emoji选择器 */}
              <EmojiSelector
                onEmojiSelect={handleEmojiSelect}
                selectedLeftEmoji={selectedLeftEmoji}
                selectedRightEmoji={selectedRightEmoji}
                activePosition={activePosition}
              />
            </Container>
          </Box>
        </Box>

        {/* 右侧区域：历史记录 */}
        <Box
          sx={{
            width: { xs: "100%", md: 450 },
            flexShrink: 0,
            borderLeft: { xs: 0, md: 1 },
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: (theme) => theme.palette.background.paper,
          }}
        >
          {/* 标题栏 */}
          <Box
            sx={{
              px: 2,
              py: 2,
              borderBottom: 1,
              borderColor: "divider",
              backgroundColor: (theme) => theme.palette.primary.main,
              color: "primary.contrastText",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📚 合成历史
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              共 {logs.length} 条记录
            </Typography>
          </Box>

          {/* 历史记录列表 */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
            }}
          >
            {logs.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "text.secondary",
                }}
              >
                <Typography variant="h6">暂无合成记录</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  选择emoji并生成锐评后会自动保存
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {logs.map((log, index) => (
                  <Card
                    key={index}
                    sx={{
                      background: (theme) => theme.palette.background.default,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        boxShadow: (theme) => theme.shadows[8],
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      {/* 合成公式和时间 */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <img
                          src={getNotoEmojiUrl(getEmojiData(log.leftEmoji).emojiCodepoint)}
                          alt=""
                          style={{ width: 28, height: 28 }}
                        />
                        <Typography variant="h6" color="text.primary" sx={{ fontSize: "1.2rem" }}>
                          +
                        </Typography>
                        <img
                          src={getNotoEmojiUrl(getEmojiData(log.rightEmoji).emojiCodepoint)}
                          alt=""
                          style={{ width: 28, height: 28 }}
                        />
                        <Typography variant="h6" color="text.primary" sx={{ fontSize: "1.2rem" }}>
                          =
                        </Typography>
                        {log.combinedEmoji && (
                          <img
                            src={log.combinedEmoji}
                            alt=""
                            style={{ width: 32, height: 32 }}
                          />
                        )}
                        <Divider
                          orientation="vertical"
                          flexItem
                          sx={{ mx: 1, borderColor: "divider" }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(log.timestamp)}
                        </Typography>
                      </Box>

                      {/* AI 解析结果 */}
                      {log.result && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                          {/* 解读 */}
                          <Box
                            sx={{
                              background: "#ff6f00",
                              color: "#fff",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              display: "inline-block",
                              alignSelf: "flex-start",
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {log.result.解读}
                            </Typography>
                          </Box>

                          {/* 锐评 */}
                          <Box
                            sx={{
                              background: (theme) => theme.palette.background.paper,
                              px: 1.5,
                              py: 1,
                              borderRadius: 1,
                              borderLeft: 3,
                              borderColor: "primary.main",
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {log.result.锐评}
                            </Typography>
                          </Box>

                          {/* 补刀 */}
                          <Box
                            sx={{
                              background: (theme) => theme.palette.grey[800],
                              color: "#fff",
                              px: 1.5,
                              py: 0.75,
                              borderRadius: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              fontSize: "0.85rem",
                            }}
                          >
                            <span>👻</span>
                            <Typography variant="caption" sx={{ color: "#fff" }}>
                              {log.result.补刀}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
