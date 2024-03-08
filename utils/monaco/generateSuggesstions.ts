export function generateTypeDefs(obj: any) {
    let typeDefs = `declare const ${obj.displayName}: {\n`;
    // Generate property definitions with descriptions
    Object.keys(obj.properties).forEach(prop => {
        const property = obj.properties[prop];
        // Add JSDoc for property description
        if (property.description) {
            typeDefs += `  /**\n   * ${property.description}\n   */\n`;
        }
        typeDefs += `  ${prop}: ${property.type};\n`;
    });
    // Generate method definitions with descriptions
    Object.keys(obj.methods).forEach(method => {
        const methodDef = obj.methods[method];
        const params = methodDef.parameters.map((param: any) => `${param.name}: ${param.type}`).join(', ');
        // Start JSDoc for method description
        typeDefs += `  /**\n   * ${methodDef.description}\n`;
        // Add parameter descriptions to JSDoc
        methodDef.parameters.forEach((param: any) => {
            if (param.description) {
                typeDefs += `   * @param ${param.name} ${param.description}\n`;
            }
        });
        // Close JSDoc and declare method
        typeDefs += `   * @return ${methodDef.returnType}\n   */\n`;
        typeDefs += `  ${method}: (${params}) => ${methodDef.returnType};\n`;
    });
    typeDefs += '};\n';
    return typeDefs;
}
export function generateComplexTypes(obj: any, objectName: string = 'RootObject'): string {
    let typeDefs = objectName === 'RootObject' ? `declare const ${obj.displayName}: {\n` : '';
    // Iterate over properties to generate definitions
    if (obj.properties) {
        typeDefs += generatePropertyTypes(obj.properties);
    }
    // Check if there are methods to be processed
    if (obj.methods) {
        typeDefs += generateMethodTypes(obj.methods);
    }

    typeDefs += objectName === 'RootObject' ? '};\n' : '';
    return typeDefs;
}
export function generatePropertyTypes(properties: any): string {
    return Object.entries(properties).reduce((acc, [propName, propDef]: any) => {
        // Initialize property documentation with JSDoc
        let propertyDoc = `  /**\n   * ${propDef.description || 'No description provided.'}\n   */\n`;
        // Check if the property is a nested object and has its own properties
        if (propDef.type === 'object' && propDef.properties) {
            // Recursive call to handle nested properties
            const nestedProps = generatePropertyTypes(propDef.properties);
            propertyDoc += `  ${propName}: {\n${nestedProps}  };\n`;
        } else {
            // Simple property
            propertyDoc += `  ${propName}: ${propDef.type};\n`;
        }
        return `${acc}${propertyDoc}`;
    }, '');
}
export function generateMethodTypes(methods: any): string {
    return Object.entries(methods).reduce((acc, [methodName, methodDef]: any) => {
        // Parameters string generation with JSDoc
        const paramsWithJSDoc = methodDef.parameters.map((param: any) =>
            `   * @param ${param.name} ${param.description || ''}\n`
        ).join('');
        const paramsSignature = methodDef.parameters.map((param: any) =>
            `${param.name}: ${param.type}`
        ).join(', ');
        const methodDoc = `  /**\n   * ${methodDef.description}\n${paramsWithJSDoc}   * @return {${methodDef.returnType}}\n   */\n`;
        return `${acc}${methodDoc}  ${methodName}: (${paramsSignature}) => ${methodDef.returnType};\n`;
    }, '');
}

export function registerCustomIntellisense(monaco: any, custom: any) {
    // Define custom completion items
    const customCompletionItems = [
        {
            label: 'customComponent',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'customComponent',
            insertTextRules: monaco.languages.CompletionItemInsertTextRulertAsSnippet,
            documentation: 'My custom function description. \n\n@param data - A string parameter.',
            detail: 'add(a: number): number'
        },
        {
            label: 'widgets',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            insertText: 'widgets',
            documentation: 'My custom variable description.',
        },
    ];
    const data = generateCompletionItemsFromObject(monaco, custom)
    console.log(data)
    getSignatures(monaco, custom)
    // Register completion item provider for the JavaScript language
    return data
}
export function generateCompletionItemsFromObject(monaco: any, component: any) {
    let completionItems: any[] = [];
    // Generate completion items for properties
    Object.entries(component.properties).forEach(([propertyName, propertyDetails]: any) => {
        completionItems.push({
            label: propertyName,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: propertyName,
            documentation: propertyDetails.description,
            detail: `${propertyName}: ${propertyDetails.type}`
        });

        // Handle nested properties if the property is of type 'object'
        if (propertyDetails.type === 'object' && propertyDetails.properties) {
            const nestedItems = generateCompletionItemsFromObject(monaco, { properties: propertyDetails.properties });
            completionItems = completionItems.concat(nestedItems);
        }
    });

    // Generate completion items for methods
    if (component.methods) {
        Object.entries(component.methods).forEach(([methodName, methodDetails]: any) => {
            const methodSignature = `${methodName}(${methodDetails.parameters.map((p: any) => `${p.name}: ${p.type}`).join(', ')}): ${methodDetails.returnType}`;
            completionItems.push({
                label: methodName,
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: `${methodName}($0)`,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: methodDetails.description,
                detail: methodSignature
            });
        });
    }
    return completionItems;
}

export function getSignatures(monaco: any, custom: any) {
    function getMethodDetails(functionName: string, object: any) {
        // Directly access the method details by its name from the customComponent object
        const methodDetails = object.methods[functionName]
        // Check if the method exists
        if (methodDetails) {
            return methodDetails;
        }
        // Return null or an appropriate default value if the method is not found
        return null;
    }

    monaco.languages.registerSignatureHelpProvider('javascript', {
        signatureHelpTriggerCharacters: ['(', ','],
        provideSignatureHelp: function (model: any, position: any) {
            const textUntilPosition = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
            // Extract the function name just before the '(' to determine which function's signature to show
            const functionNameMatch = textUntilPosition.match(/(\w+)\($/);
            if (functionNameMatch) {
                const functionName = functionNameMatch[1];
                // Assuming you have a way to get the method details based on the name
                const methodDetails = getMethodDetails(functionName, custom);
                if (methodDetails) {
                    const signatures = [{
                        label: `${functionName}(${methodDetails.parameters.map((p: any) => `${p.name}: ${p.type}`).join(', ')}): ${methodDetails.returnType}`,
                        parameters: methodDetails.parameters.map((p: any) => ({
                            label: `${p.name}: ${p.type}`,
                            documentation: p.description
                        }))
                    }];
                    return {
                        value: {
                            activeSignature: 0,
                            activeParameter: Math.max(0, textUntilPosition.split(',').length - 2), // Adjust based on actual parameter index
                            signatures: signatures
                        },
                        dispose() { }
                    };
                }
            }
            return null;
        }
    });
}