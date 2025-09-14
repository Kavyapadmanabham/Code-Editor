"use client";
import { Moon, Sun, Sparkles, Wrench, File, Expand, Shrink, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import axios from "axios";
import LanguageSelector from "./LanguageSelector";
import { EXTENSION_LANGUAGE_MAP, CODE_SNIPPETS } from "../constants";
import { Box } from "@chakra-ui/react";
import Output from "./Output";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function CodeEditor({ file }) {
  const [selectedTheme, setSelectedTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [updatedCode, setUpdatedCode] = useState("//Select a file to start coding..!");
  const [isFixing, setIsFixing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const monaco = useMonaco();
  const timeoutRef = useRef(null);
  const editorRef = useRef();
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const settingsRef = useRef(null);

  useEffect(() => {
    if (file) {
      // Detect language from file prop or extension
      let detectedLang = file.language;
      if (!detectedLang && file.name) {
        const ext = file.name.split('.').pop().toLowerCase();
        detectedLang = EXTENSION_LANGUAGE_MAP[ext] || "plaintext";
      }
      setCodeLanguage(detectedLang || "plaintext");
      fetchFileContent(detectedLang, true);
    }
  }, [file]);

  // Set Monaco language dynamically
  useEffect(() => {
    if (monaco && editorRef.current && codeLanguage) {
      const model = editorRef.current.getModel();
      if (model && model.getLanguageId() !== codeLanguage) {
        monaco.editor.setModelLanguage(model, codeLanguage);
      }
    }
  }, [codeLanguage, monaco]);

  useEffect(() => {
    if (!file?.id || !file?.workspaceId) return;

    const filePath = `workspaces/${file.workspaceId}/files`;
    const fileRef = doc(db, filePath, file.id);

    const unsubscribe = onSnapshot(fileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.content !== updatedCode) {
          setUpdatedCode(data.content || "");
        }
      }
    });

    return () => unsubscribe();
  }, [file]);

  const fetchFileContent = async (langOverride, allowBoilerplate) => {
    if (!file?.id || !file?.workspaceId) return;
    try {
      const filePath = `workspaces/${file.workspaceId}/files`;
      const fileRef = doc(db, filePath, file.id);
      const fileSnap = await getDoc(fileRef);

      if (fileSnap.exists()) {
        const content = fileSnap.data().content || "";
        // If content is empty and allowBoilerplate is true, inject boilerplate
        if (content.trim() === "" && allowBoilerplate) {
          const snippet = CODE_SNIPPETS[langOverride] || CODE_SNIPPETS["plaintext"];
          setUpdatedCode(snippet);
          if (editorRef.current) editorRef.current.setValue(snippet);
        } else {
          setUpdatedCode(content);
        }
        // If language is missing in Firestore, update it
        if (!fileSnap.data().language && langOverride) {
          await updateDoc(fileRef, { language: langOverride });
        }
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  const handleEditorChange = (value) => {
    setUpdatedCode(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => autoSaveFile(value), 0);
  };

  const autoSaveFile = async (content) => {
    if (!file?.id || !file?.workspaceId) return;
    try {
      const filePath = `workspaces/${file.workspaceId}/files`;
      const fileRef = doc(db, filePath, file.id);
      await updateDoc(fileRef, { content, language: codeLanguage });
    } catch (error) {
      console.error("Error auto-saving file:", error);
    }
  };

  const onSelect = (newLang) => {
    setCodeLanguage(newLang);
    // Always inject boilerplate if buffer is empty, even for files with no extension
    if (updatedCode.trim() === "") {
      const snippet = CODE_SNIPPETS[newLang] || CODE_SNIPPETS["plaintext"];
      setUpdatedCode(snippet);
      if (editorRef.current) editorRef.current.setValue(snippet);
    }
  };

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  // const generateDocs = async () => {
  //   setIsLoading(true);
  //   try {
  //     const res = await axios.post("/api/generate-documentation", { code: updatedCode, language: codeLanguage });
  //     const documentation = res.data.documentation;
  //     const commentedDocs = `\n\n${documentation}`;
  //     setUpdatedCode((prevCode) => prevCode + commentedDocs);
  //   } catch (error) {
  //     console.error("Failed to generate documentation:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fixSyntaxErrors = async () => {
    setIsFixing(true);
    try {
      const res = await axios.post("/api/get-errors", { code: updatedCode, codeLanguage });
      if (res.data.fixedCode) {
        setUpdatedCode(res.data.fixedCode);
      }
    } catch (error) {
      console.error("Failed to fix syntax:", error);
    } finally {
      setIsFixing(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setTimeout(() => editorRef.current?.layout(), 100);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themes = [
    { name: "Dark", value: "vs-dark" },
    { name: "Light", value: "light" },
    { name: "High Contrast", value: "hc-black" },
  ];

  return (
    <div className={`bg-gray-900 m-2 h-[94%] rounded-xl p-3 ${isExpanded ? "fixed inset-0 z-50 m-0" : "relative"}`}>
      <Box className="relative h-full">
        <div className="flex h-full">
          <Box w={isExpanded ? "100%" : "78%"} transition="all 0.3s ease" className=" bg-green-30 h-[100%]">
            <div className="flex justify-between items-center h-[10%] pr-12 ">
              {file && (
                <div className="flex items-center bg-gray-900 text-white px-4 max-h-[50px] rounded-md shadow-md border border-gray-700 w-40">
                  <File size={16} className="mr-2 text-green-400" />
                  <span className="text-sm text-gray-300 line-clamp-1">{file.name}</span>
                </div>
              )}
              <div className="flex gap-3 items-center ">
                <div className="relative" ref={settingsRef}>
                  <button
                    className="flex items-center bg-gray-800 text-white p-2 rounded-full shadow-md hover:bg-gray-700 transition ring-1 ring-gray-600"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings size={16} />
                  </button>
                  {showSettings && (
                    <div className="absolute left-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl p-3 space-y-3 z-50">
                      <div>
                        <label className="text-xs text-gray-300 mb-1 block">Theme</label>
                        { <select
                          className="w-full bg-gray-700 text-gray-200 text-xs p-1 rounded"
                          value={selectedTheme}
                          onChange={(e) => setSelectedTheme(e.target.value)}
                        >
                          {themes.map((theme) => (
                            <option key={theme.value} value={theme.value}>
                              {theme.name}
                            </option>
                          ))}
                        </select> }
                      </div>
                      <div>
                        <label className="text-xs text-gray-300 mb-1 block">Font Size</label>
                        <input
                          type="range"
                          min="10"
                          max="24"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs text-gray-300 block text-center">{fontSize}px</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* <button
                  className="flex items-center gap-1.5 bg-blue-700 bg-opacity-20 ring-1 ring-blue-600 text-white px-3 py-1.5 rounded-full shadow-md hover:bg-blue-600 transition disabled:opacity-50 text-xs"
                  onClick={generateDocs}
                  disabled={isLoading}
                >
                  <Sparkles size={14} /> {isLoading ? "Generating..." : "Docs"}
                </button> */}
                <button
                  className="flex items-center gap-1.5 bg-teal-600 bg-opacity-20 ring-1 ring-teal-600 text-white px-3 py-1.5 rounded-full shadow-md hover:bg-teal-600 transition disabled:opacity-50 text-xs"
                  onClick={fixSyntaxErrors}
                  disabled={isFixing}
                >
                  <Wrench size={14} /> {isFixing ? "Fixing..." : "Fix"}
                </button>
                <button
                  className="flex items-center gap-1.5 bg-purple-600 bg-opacity-20 ring-1 ring-purple-600 text-white px-3 py-1.5 rounded-full shadow-md hover:bg-purple-600 transition text-xs"
                  onClick={toggleExpand}
                >
                  {isExpanded ? (
                    <Shrink size={14} className="transition-transform" />
                  ) : (
                    <Expand size={14} className="transition-transform" />
                  )}
                  {isExpanded ? "Collapse" : "Expand"}
                </button>
              </div>
              <LanguageSelector language={codeLanguage} onSelect={onSelect} />
            </div>
            <Editor
              height={isExpanded ? "calc(100vh - 100px)" : "92%"}
              theme={selectedTheme}
              language={codeLanguage}
              value={updatedCode}
              onMount={onMount}
              onChange={handleEditorChange}
              options={{
                fontSize: fontSize,
                wordWrap: "on",
                minimap: { enabled: false },
                bracketPairColorization: true,
                suggest: { preview: true },
                inlineSuggest: {
                  enabled: true,
                  showToolbar: "onHover",
                  mode: "subword",
                  suppressSuggestions: false,
                },
                quickSuggestions: { other: true, comments: true, strings: true },
                suggestSelection: "recentlyUsed",
                tabCompletion: "on",
              }}
            />
          </Box>
          {!isExpanded && <Output editorRef={editorRef} language={codeLanguage} />}
        </div>
      </Box>
    </div>
  );
}