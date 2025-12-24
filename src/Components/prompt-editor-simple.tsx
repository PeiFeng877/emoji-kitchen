import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { BoxProps } from "@mui/material/Box";
import { ButtonProps } from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";

interface PromptEditorButtonProps {
  currentPrompt: string;
  onPromptUpdate: (prompt: string) => void;
}

// 简化的提示词编辑器hook
export const usePromptEditor = (
  currentPrompt: string,
  onPromptUpdate: (prompt: string) => void
) => {
  const [open, setOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(currentPrompt);

  // 打开编辑器
  const handleOpen = () => {
    setEditingPrompt(currentPrompt);
    setOpen(true);
  };

  // 保存提示词
  const handleSave = () => {
    onPromptUpdate(editingPrompt);
    setOpen(false);
  };

  // 关闭编辑器
  const handleClose = () => {
    setEditingPrompt(currentPrompt);
    setOpen(false);
  };

  return {
    open,
    handleOpen,
    handleSave,
    handleClose,
    editingPrompt,
    setEditingPrompt
  };
};

export default function PromptEditorButton({ currentPrompt, onPromptUpdate }: PromptEditorButtonProps) {
  const promptEditor = usePromptEditor(currentPrompt, onPromptUpdate);
  const { open, handleOpen, handleClose, editingPrompt, setEditingPrompt } = promptEditor;

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleOpen}
        startIcon={<EditIcon />}
      >
        修改提示词
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>编辑提示词</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            可以在此修改AI生成锐评的提示词。
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">当前提示词</Typography>
            <TextField
              multiline
              rows={10}
              fullWidth
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              variant="outlined"
              sx={{
                fontFamily: 'monospace',
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            取消
          </Button>
          <Button onClick={promptEditor.handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}