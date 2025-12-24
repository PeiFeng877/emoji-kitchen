import React from "react";
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
import SimpleKitchen from "./Components/simple-kitchen";

// 🌈
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

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <SimpleKitchen />
    </ThemeProvider>
  );
}
