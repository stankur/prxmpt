# PRXMPT

A web-based tool for evaluating prompts against multiple inputs in parallel. Test and compare different LLM prompts across various datasets efficiently.

## Features

- **Batch Processing**: Run multiple prompts against multiple inputs simultaneously
- **Variable Substitution**: Use dynamic variables in prompts (e.g., `{content}`, `{name}`, `{age}`)
- **Multi-Model Support**: Compatible with OpenRouter API (OpenAI, Anthropic, etc.)
- **Real-time Results**: View organized outputs with input-prompt mapping
- **JSON Input Support**: Handle both string and object inputs
- **Monaco Editor**: Syntax highlighting for JSON inputs and prompt editing

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Add Inputs**: Enter JSON data (strings, objects, or arrays) in the Input tab
2. **Create Prompts**: Write prompts with variable placeholders in the Prompt tab
3. **Configure LLM**: Set your OpenRouter API key, select model, and adjust temperature
4. **Run Batch**: Execute all prompt-input combinations in parallel
5. **View Results**: Analyze outputs organized by prompt in the Output tab

## Variable System

- For string inputs: Use `{content}` in prompts
- For object inputs: Use `{fieldName}` or `{nested.field}` syntax
- Variables are automatically extracted from input data structure

## Examples

**Input Data**:
```json
{"name": "John", "age": 30, "city": "New York"}
```

**Prompt**:
```
Hello {name}, I see you're {age} years old and live in {city}. How's the weather there?
```

**Result**: The tool will substitute variables and send the complete prompt to your chosen LLM.

## API Key

Get your API key from [OpenRouter](https://openrouter.ai/) and enter it in the LLM settings. The key is stored locally in your browser.

## License

MIT
