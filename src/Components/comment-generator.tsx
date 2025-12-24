import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ShareIcon from "@mui/icons-material/Share";
import HistoryIcon from "@mui/icons-material/History";
import React, { useState, useRef } from "react";
import { getEmojiData, getNotoEmojiUrl } from "./utils";
import PromptEditorButton from "./prompt-editor-simple";
import html2canvas from "html2canvas";

interface CommentData {
  组合: string;
  解读: string;
  锐评: string;
  补刀: string;
}

interface CommentGeneratorProps {
  leftEmoji: string;
  rightEmoji: string;
  currentPrompt: string;
  onPromptUpdate: (prompt: string) => void;
  onAddLog?: (result?: CommentData) => void;
  buttonOnly?: boolean;
  logs?: Array<{
    timestamp: Date;
    leftEmoji: string;
    rightEmoji: string;
    combinedEmoji?: string;
    prompt: string;
    result?: CommentData;
  }>;
}

export default function CommentGenerator({ leftEmoji, rightEmoji, currentPrompt, onPromptUpdate, onAddLog, buttonOnly = false, logs = [] }: CommentGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState<CommentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedLogIndex, setSelectedLogIndex] = useState(0);
  
  // 用于保存图片的ref
  const cardRef = useRef<HTMLDivElement>(null);
  const [savingImage, setSavingImage] = useState(false);

  // 获取组合后的emoji
  const getCombinedEmoji = () => {
    if (!leftEmoji || !rightEmoji) return null;

    const leftEmojiData = getEmojiData(leftEmoji);
    const combinations = leftEmojiData.combinations[rightEmoji];

    if (!combinations || combinations.length === 0) {
      return null;
    }

    // 获取最新的组合
    const latestCombination = combinations.filter((c) => c.isLatest)[0];
    return latestCombination.gStaticUrl;
  };

  // 生成锐评
  const generateComment = async () => {
    if (!leftEmoji || !rightEmoji) return;

    const leftEmojiData = getEmojiData(leftEmoji);
    const rightEmojiData = getEmojiData(rightEmoji);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-e283acd8b9bd489a93ae0e3bccea57e7'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: currentPrompt },
            { role: 'user', content: `「${leftEmojiData.alt}」+「${rightEmojiData.alt}」` }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // 解析JSON
      let parsedComment;
      try {
        parsedComment = JSON.parse(content);
        setComment(parsedComment);
        setOpen(true);
        onAddLog?.(parsedComment);
      } catch (parseError) {
        console.error('解析JSON失败:', content, parseError);

        // 尝试提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedComment = JSON.parse(jsonMatch[0]);
          setComment(parsedComment);
          setOpen(true);
          onAddLog?.(parsedComment);
        } else {
          throw new Error('无法从回复中提取有效的JSON');
        }
      }
    } catch (err: any) {
      const errorMessage = `生成锐评失败: ${err.message}`;
      setError(errorMessage);
      onAddLog?.(); // 即使失败也记录
    } finally {
      setLoading(false);
    }
  };

  // 清除评论
  const clearComment = () => {
    setComment(null);
    setOpen(false);
  };

    // 保存为图片
  const handleSaveAsImage = async () => {
    if (!cardRef.current) return;
    
    setSavingImage(true);
    try {
      // 辅助函数：将URL转换为Base64
      const urlToBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = url;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            // 对于SVG，naturalWidth可能不准确，给定一个足够大的尺寸保证清晰度
            // 或者使用我们在UI中显示的尺寸的2倍
            canvas.width = img.naturalWidth || 100;
            canvas.height = img.naturalHeight || 100;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(url); // 降级
              return;
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            try {
              const dataURL = canvas.toDataURL('image/png');
              resolve(dataURL);
            } catch (e) {
              console.warn('Canvas转换Base64失败:', e);
              resolve(url);
            }
          };
          img.onerror = () => {
            console.warn('图片加载失败:', url);
            resolve(url);
          };
        });
      };

      // 获取原始emoji数据
      const leftEmojiData = getEmojiData(leftEmoji);
      const rightEmojiData = getEmojiData(rightEmoji);
      
      // 获取图片URL
      const leftEmojiUrl = leftEmoji ? getNotoEmojiUrl(getEmojiData(leftEmoji).emojiCodepoint) : '';
      const rightEmojiUrl = rightEmoji ? getNotoEmojiUrl(getEmojiData(rightEmoji).emojiCodepoint) : '';
      const combinedEmojiUrl = getCombinedEmoji() || '';

      // 并行转换为Base64
      const [leftBase64, rightBase64, combinedBase64] = await Promise.all([
        leftEmojiUrl ? urlToBase64(leftEmojiUrl) : Promise.resolve(''),
        rightEmojiUrl ? urlToBase64(rightEmojiUrl) : Promise.resolve(''),
        combinedEmojiUrl ? urlToBase64(combinedEmojiUrl) : Promise.resolve('')
      ]);
      
      // 使用html2canvas生成图片
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff', // 使用白色背景
        scale: 2, // 提高图片质量
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
        onclone: (clonedDoc) => {
          // 在克隆的文档中，确保所有元素样式正确
          const card = clonedDoc.querySelector('[data-save-card]') as HTMLElement;
          if (card) {
            // 强制应用渐变背景
            card.style.background = 'linear-gradient(135deg, #fff8e1 0%, #fff3e0 50%, #ffecb3 100%)';
            
            // 替换图片为Base64
            const images = card.querySelectorAll('img');
            images.forEach((img) => {
              const alt = img.getAttribute('alt');
              // 确保替换正确的图片
              if (leftEmoji && alt === getEmojiData(leftEmoji).alt && leftBase64) {
                img.src = leftBase64;
              } else if (rightEmoji && alt === getEmojiData(rightEmoji).alt && rightBase64) {
                img.src = rightBase64;
              } else if (comment && alt === comment.组合 && combinedBase64) {
                img.src = combinedBase64;
              }
              // 确保样式一致
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
            });
          }
        }
      });
      
      // 转换为blob并下载
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `emoji-锐评-${leftEmojiData.alt}-${rightEmojiData.alt}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png', 0.95);
    } catch (error) {
      console.error('保存图片失败:', error);
    } finally {
      setSavingImage(false);
    }
  };

  return (
    <Box>
      {buttonOnly ? (
        // 只显示修改提示词按钮
        <PromptEditorButton
          currentPrompt={currentPrompt}
          onPromptUpdate={onPromptUpdate}
        />
      ) : (
        // 显示完整界面
        <>
          {/* 三个按钮并排 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              onClick={generateComment}
              disabled={loading || !leftEmoji || !rightEmoji}
              sx={{ px: 3, py: 1 }}
            >
              {loading ? '生成中...' : '生成锐评'}
            </Button>

            {/* 查看历史日志按钮 */}
            <Button
              variant="outlined"
              onClick={() => setLogsDialogOpen(true)}
              disabled={logs.length === 0}
              startIcon={<HistoryIcon />}
              sx={{ px: 2, py: 1 }}
            >
              查看日志
            </Button>

            {/* 修改提示词按钮 */}
            <PromptEditorButton
              currentPrompt={currentPrompt}
              onPromptUpdate={onPromptUpdate}
            />
          </Box>

          {/* 错误提示 */}
          {error && (
            <Box sx={{ mt: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
        </>
      )}

      {/* 评论对话框 */}
      <Dialog 
        open={open} 
        onClose={clearComment}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            aspectRatio: '3/4',
            maxWidth: '450px',
            margin: '0 auto'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h5" component="div">Emoji 锐评</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              onClick={handleSaveAsImage}
              disabled={savingImage}
              color="primary"
              title="保存为图片"
            >
              {savingImage ? <div className="loading-spinner" /> : <DownloadIcon />}
            </IconButton>
            <IconButton 
              onClick={clearComment}
              color="default"
              title="关闭"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {comment && (
            <Box>
              {/* 用于保存为图片的卡片 */}
              <Card 
                ref={cardRef}
                data-save-card="true"
                sx={{ 
                  m: 3, 
                  p: 0, // 移除内边距，完全自定义布局
                  borderRadius: 3,
                  background: '#fffbf0', // 温暖的米白色背景
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                  aspectRatio: '3/4',
                  maxWidth: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '8px solid #333', // 增加黑边框，更有漫画/海报感
                }}
              >
                {/* 装饰性背景元素 */}
                <Box sx={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: '#ffecb3',
                  opacity: 0.6,
                  zIndex: 0
                }} />
                <Box sx={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '-20px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: '#ffcc80',
                  opacity: 0.4,
                  zIndex: 0
                }} />
                
                <CardContent sx={{ 
                  position: 'relative', 
                  zIndex: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 3,
                  '&:last-child': { pb: 3 }
                }}>
                  {/* 1. Emoji 展示区 - 增加趣味性底板 */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    mb: 2,
                    mt: 1,
                    gap: 1.5,
                  }}>
                     {/* 运算过程容器 */}
                     <Box sx={{
                       display: 'flex',
                       alignItems: 'center',
                       background: '#fff',
                       border: '2px solid #333',
                       borderRadius: '16px',
                       px: 2,
                       py: 1,
                       boxShadow: '4px 4px 0px #333' // 硬阴影，增加波普感
                     }}>
                        {/* 左侧emoji */}
                        {leftEmoji && (
                          <img 
                            src={getNotoEmojiUrl(getEmojiData(leftEmoji).emojiCodepoint)} 
                            alt={getEmojiData(leftEmoji).alt}
                            style={{ width: 32, height: 32 }}
                          />
                        )}
                        
                        <Typography variant="h6" sx={{ mx: 1, fontWeight: 900, color: '#333' }}>+</Typography>
                        
                        {/* 右侧emoji */}
                        {rightEmoji && (
                           <img 
                             src={getNotoEmojiUrl(getEmojiData(rightEmoji).emojiCodepoint)} 
                             alt={getEmojiData(rightEmoji).alt}
                             style={{ width: 32, height: 32 }}
                           />
                        )}
                     </Box>

                     <Typography variant="h5" sx={{ mx: 0.5, fontWeight: 900, color: '#333' }}>=</Typography>
                     
                     {/* 结果展示 - 放大突出 */}
                     <Box sx={{
                        position: 'relative',
                        width: 72, 
                        height: 72,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                     }}>
                        {/* 结果背景光晕 */}
                        <Box sx={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          background: '#ffe082',
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite',
                          zIndex: -1
                        }} />
                        {getCombinedEmoji() && (
                          <img 
                            src={getCombinedEmoji()} 
                            alt={comment.组合}
                            style={{ width: 64, height: 64, filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.2))' }}
                          />
                        )}
                     </Box>
                  </Box>
                  
                  {/* 分割线 */}
                  <Divider sx={{ borderBottomWidth: 2, borderColor: '#333', borderStyle: 'dashed', my: 2, opacity: 0.3 }} />

                  {/* 2. 核心内容区 - 紧凑布局 */}
                  <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    {/* 解读 - 标题样式 */}
                    <Box sx={{
                      background: '#ff6f00',
                      color: '#fff',
                      px: 2,
                      py: 0.5,
                      transform: 'rotate(-2deg)', // 微微倾斜增加动感
                      boxShadow: '3px 3px 0px #333',
                      mb: 2
                    }}>
                      <Typography 
                        variant="h5" 
                        component="h2" 
                        sx={{ 
                          fontWeight: 900, 
                          textAlign: 'center',
                          letterSpacing: 1,
                        }}
                      >
                        {comment.解读}
                      </Typography>
                    </Box>
                    
                    {/* 锐评 - 大字报风格 */}
                    <Box sx={{ position: 'relative', px: 2, py: 1 }}>
                       {/* 装饰性引号 */}
                       <Typography sx={{ 
                         position: 'absolute', 
                         top: -10, 
                         left: 0, 
                         fontSize: '4rem', 
                         lineHeight: 1, 
                         color: '#ffcc80', 
                         opacity: 0.5,
                         fontFamily: 'serif'
                       }}>“</Typography>
                       
                       <Typography 
                        variant="h5" 
                        sx={{ 
                          lineHeight: 1.4,
                          textAlign: 'center',
                          color: '#333',
                          fontWeight: 700,
                          textShadow: '1px 1px 0px #fff'
                        }}
                      >
                        {comment.锐评}
                      </Typography>
                      
                      <Typography sx={{ 
                         position: 'absolute', 
                         bottom: -20, 
                         right: 10, 
                         fontSize: '4rem', 
                         lineHeight: 1, 
                         color: '#ffcc80', 
                         opacity: 0.5,
                         fontFamily: 'serif'
                       }}>”</Typography>
                    </Box>
                  </Box>

                  {/* 3. 底部区域 */}
                  <Box sx={{ mt: 'auto', pt: 2, display: 'flex', justifyContent: 'center' }}>
                    {/* 补刀 - 气泡样式 */}
                    <Box sx={{ 
                      position: 'relative',
                      backgroundColor: '#333',
                      color: '#fff',
                      borderRadius: '20px',
                      px: 3,
                      py: 1.5,
                      maxWidth: '90%',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      {/* 气泡小三角 */}
                      <Box sx={{
                        position: 'absolute',
                        top: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '8px solid #333',
                      }} />
                      
                      <Typography sx={{ 
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1
                      }}>
                        <span style={{ fontSize: '1.2em' }}>👻</span> {comment.补刀}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* 底部版权/水印 (可选，增加完整度) */}
                  <Typography sx={{ 
                    textAlign: 'center', 
                    fontSize: '0.7rem', 
                    color: '#999', 
                    mt: 2, 
                    fontWeight: 500,
                    letterSpacing: 1,
                    textTransform: 'uppercase'
                  }}>
                    EMOJI KITCHEN · 锐评生成器
                  </Typography>

                </CardContent>
              </Card>
              
              {/* 操作按钮 */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 2, 
                pt: 2,
                px: 2,
                pb: 1,
                flexShrink: 0
              }}>
                <Button 
                  variant="outlined" 
                  startIcon={<ShareIcon />}
                  onClick={handleSaveAsImage}
                  disabled={savingImage}
                  size="small"
                >
                  {savingImage ? '保存中...' : '保存为图片'}
                </Button>
                <Button 
                  variant="contained" 
                  onClick={clearComment}
                  color="primary"
                  size="small"
                >
                  关闭
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 历史日志对话框 */}
      <Dialog
        open={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          历史日志
          <IconButton onClick={() => setLogsDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {logs.length > 0 ? (
            <Box sx={{ display: 'flex', height: '100%' }}>
              {/* 左侧日志列表 */}
              <Box sx={{ width: '30%', borderRight: 1, borderColor: 'divider', overflowY: 'auto' }}>
                <List>
                  {logs.map((log, index) => (
                    <ListItem
                      key={index}
                      button
                      selected={selectedLogIndex === index}
                      onClick={() => setSelectedLogIndex(index)}
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        py: 1.5,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {log.leftEmoji && (
                          <img
                            src={getNotoEmojiUrl(getEmojiData(log.leftEmoji).emojiCodepoint)}
                            alt=""
                            style={{ width: 24, height: 24 }}
                          />
                        )}
                        <Typography variant="body2">+</Typography>
                        {log.rightEmoji && (
                          <img
                            src={getNotoEmojiUrl(getEmojiData(log.rightEmoji).emojiCodepoint)}
                            alt=""
                            style={{ width: 24, height: 24 }}
                          />
                        )}
                        {log.combinedEmoji && (
                          <>
                            <Typography variant="body2">=</Typography>
                            <img
                              src={log.combinedEmoji}
                              alt=""
                              style={{ width: 24, height: 24 }}
                            />
                          </>
                        )}
                      </Box>
                      <Typography variant="caption">
                        {new Date(log.timestamp).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* 右侧详情 */}
              <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
                {logs[selectedLogIndex] && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {new Date(logs[selectedLogIndex].timestamp).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </Typography>

                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Emoji 组合
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        {logs[selectedLogIndex].leftEmoji && (
                          <>
                            <img
                              src={getNotoEmojiUrl(getEmojiData(logs[selectedLogIndex].leftEmoji).emojiCodepoint)}
                              alt={getEmojiData(logs[selectedLogIndex].leftEmoji).alt}
                              style={{ width: 48, height: 48 }}
                            />
                            <Typography variant="body2">
                              {getEmojiData(logs[selectedLogIndex].leftEmoji).alt}
                            </Typography>
                          </>
                        )}
                        <Typography variant="h6">+</Typography>
                        {logs[selectedLogIndex].rightEmoji && (
                          <>
                            <img
                              src={getNotoEmojiUrl(getEmojiData(logs[selectedLogIndex].rightEmoji).emojiCodepoint)}
                              alt={getEmojiData(logs[selectedLogIndex].rightEmoji).alt}
                              style={{ width: 48, height: 48 }}
                            />
                            <Typography variant="body2">
                              {getEmojiData(logs[selectedLogIndex].rightEmoji).alt}
                            </Typography>
                          </>
                        )}
                        {logs[selectedLogIndex].combinedEmoji && (
                          <>
                            <Typography variant="h6">=</Typography>
                            <img
                              src={logs[selectedLogIndex].combinedEmoji}
                              alt=""
                              style={{ width: 48, height: 48 }}
                            />
                          </>
                        )}
                      </Box>
                    </Paper>

                    <Paper sx={{ p: 2, mb: 2, flex: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        使用的提示词
                      </Typography>
                      <TextField
                        multiline
                        fullWidth
                        value={logs[selectedLogIndex].prompt}
                        variant="outlined"
                        InputProps={{
                          readOnly: true,
                          sx: {
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: 'none'
                            }
                          }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'grey.50',
                          }
                        }}
                      />
                    </Paper>

                    {logs[selectedLogIndex].result && (
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          AI 返回的结果
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              组合
                            </Typography>
                            <Typography variant="body1">
                              {logs[selectedLogIndex].result.组合}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              解读
                            </Typography>
                            <Typography variant="body1">
                              {logs[selectedLogIndex].result.解读}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              锐评
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {logs[selectedLogIndex].result.锐评}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              补刀
                            </Typography>
                            <Typography variant="body2">
                              {logs[selectedLogIndex].result.补刀}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="h6" color="text.secondary">
                暂无历史记录
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}