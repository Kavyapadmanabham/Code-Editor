"use client";
import { useState } from "react";
import { executeCode } from "../api";

const Output = ({ editorRef, language }) => {
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [userInput, setUserInput] = useState("");

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    setIsLoading(true);
    try {
      const { run: result } = await executeCode(language, sourceCode, userInput);
      setOutput(result.output.split("\n"));
      result.stderr ? setIsError(true) : setIsError(false);
    } catch (error) {
      console.log(error);
      setIsError(true);
      setOutput(['Error while running the code']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" ml-3 w-[30%] bg-black ring-1 ring-gray-700 rounded-lg shadow-lg ">
      <button
        onClick={runCode}
        className="w-full py-2 mb-4 text-white bg-indigo-700 hover:bg-indigo-900 ring-1 ring-indigo-500 bg-opacity-30 rounded-md"
        disabled={isLoading}
      >
        {isLoading ? 'Compiling...' : 'Run Code'}
      </button>
      
      <div
        className={` p-4 rounded-md overflow-auto h-[90%] ${isError ? 'border-red-500 text-red-500' : ' text-white'} `}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-16 h-16 border-4 border-t-teal-500 border-transparent rounded-full animate-spin"></div>
          </div>
        ) : output ? (
          output.map((line, i) => (
            <p key={i} className="text-sm whitespace-pre-wrap overflow-auto">{line}</p>
          ))
        ) : (
          <p className="text-gray-400">Click "Run Code" to see the output here</p>
        )}
      </div>

      <textarea
        className="w-full p-2 mb-2 rounded bg-gray-900 text-white border border-gray-700"
        rows={3}
        placeholder="Enter input for your program here..."
        value={userInput}
        onChange={e => setUserInput(e.target.value)}
      />
      <button
        onClick={runCode}
        className="w-full py-2 mb-4 text-white bg-teal-700 hover:bg-teal-900 ring-1 ring-teal-500 bg-opacity-30 rounded-md"
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Input'}
      </button>
    </div>
  );
};

export default Output;
