"use client";
import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Box } from "@chakra-ui/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants";

const EditorContainer = () => {
  const [language, setLanguage] = useState("javascript");
  const editorRef = useRef(null);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    const code = CODE_SNIPPETS[language] || "";
    if (editorRef.current) {
      editorRef.current.setValue(code);
    }
  }, [language]);

  return (
    <Box p={4}>
      <LanguageSelector language={language} onSelect={setLanguage} />
      <Editor
        height="500px"
        language={language}
        defaultValue={CODE_SNIPPETS[language]}
        theme="vs-dark"
        onMount={handleEditorMount}
      />
    </Box>
  );
};

export default EditorContainer;
