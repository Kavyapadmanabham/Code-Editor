export const LANGUAGE_VERSIONS = {
    javascript: "18.15.0",
    python: "3.10.0",
    java: "15.0.2",
    
    cpp: "10.2.0",
    c: "10.2.0",
};

// Map file extensions to Monaco language IDs
export const EXTENSION_LANGUAGE_MAP = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  java: "java",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  c: "c",
  h: "cpp",
  txt: "plaintext",
};

export const CODE_SNIPPETS = {
    javascript: `\nfunction greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("Alex");\n`,
    python: `\ndef greet(name):\n\tprint("Hello, " + name + "!")\n\ngreet("Alex")\n`,
    java: `\npublic class HelloWorld {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}\n`,
    cpp: `\n#include <iostream>\n\nusing namespace std;\n\nint main() {\n\tstring name = "Alex";\n\tcout << "Hello, " << name << "!" << endl;\n\treturn 0;\n}\n`,
    c: `\n#include <stdio.h>\n\nint main() {\n\tchar name[] = "Alex";\n\tprintf("Hello, %s!\\n", name);\n\treturn 0;\n}\n`,
   
    plaintext: `\nHello, World!\n`,
};

