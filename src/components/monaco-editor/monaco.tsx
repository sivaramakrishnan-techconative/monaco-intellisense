import { Editor } from '@monaco-editor/react'
import React, { useState } from 'react'
import config from './config.json'
import custom from './custom.json'
import { generateComplexTypes, registerCustomIntellisense, generateCompletionItemsFromObject } from '../../../utils/monaco/generateSuggesstions';

export default function MonacoEditor() {

    const [file, setFile] = useState<{ language: string, path: string }>({ language: 'javascript', path: 'javascript.js' });
    const [value, setvalue] = useState(`function test() {
        console.log("HeY")
    }`)
    const handleEditorWillMount = (monaco: any) => {
        registerCustomIntellisense(monaco, custom)
    }
    function handleEditorDidMount(editor: any, monaco: any) {
        const data = generateComplexTypes(custom)
        const data1 = generateCompletionItemsFromObject(monaco, config)
        console.log(data)
        monaco.languages.registerCompletionItemProvider('javascript', {
            provideCompletionItems: () => ({ suggestions: data1 }),
        });
        const functionDeclarations = `
            /**
             * Adds two numbers and returns the result.
             * @param a {number} The first number.
             * @param b {number} The second number.
             * @return {number} The sum of the two numbers.
             */
            declare function add(a: number, b: number): number;

            /**
             * Subtracts the second number from the first and returns the result.
             * @param a {number} The number to subtract from.
             * @param b {number} The number to subtract.
             * @return {number} The difference of the two numbers.
             */
            declare function subtract(a: number, b: number): number;
            `;
        // monaco.languages.typescript.javascriptDefaults.addExtraLib(data.concat(functionDeclarations), 'filename/facts.d.ts');
    }
    function handleChange(newValue: any) {
    }

    return (
        <div style={{ marginTop: '5em' }}>
            <Editor
                height="80vh"
                defaultLanguage={file.language}
                path={file.path}
                value={value}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                onChange={handleChange}
            />
        </div>
    )
}