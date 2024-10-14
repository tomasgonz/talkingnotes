"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import necessary modules from Obsidian and OpenAI
const obsidian_1 = require("obsidian");
const openai_1 = require("openai");
// Set default settings for the plugin
const DEFAULT_SETTINGS = {
    apiKey: "",
};
// Main plugin class
class OpenAIPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        this.settings = DEFAULT_SETTINGS;
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            // Add a ribbon icon to trigger OpenAI interaction
            this.addRibbonIcon("brain", "OpenAI Chat", () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const apiKey = this.settings.apiKey;
                if (!apiKey) {
                    new obsidian_1.Notice("Please set your OpenAI API key in the settings.");
                    return;
                }
                const openai = new openai_1.OpenAI({ apiKey });
                // Example of a text completion request
                const response = yield openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: "You are an assistant summarizing text." },
                        { role: "user", content: "Summarize this note content: ..." },
                    ],
                });
                new obsidian_1.Notice(((_a = response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) || "No response");
            }));
            // Add command to summarize the active note
            this.addCommand({
                id: "summarize-note",
                name: "Summarize Note",
                checkCallback: (checking) => {
                    const activeLeaf = this.app.workspace.activeLeaf;
                    if (activeLeaf && activeLeaf.view.getViewType() === "markdown") {
                        if (!checking) {
                            this.summarizeActiveNote();
                        }
                        return true;
                    }
                    return false;
                },
            });
            // Add settings tab
            this.addSettingTab(new OpenAISettingTab(this.app, this));
        });
    }
    summarizeActiveNote() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const activeLeaf = this.app.workspace.activeLeaf;
            if (!activeLeaf)
                return;
            const file = activeLeaf.view instanceof obsidian_1.MarkdownView ? activeLeaf.view.file : null;
            if (!file)
                return;
            const content = yield this.app.vault.read(file);
            const apiKey = this.settings.apiKey;
            if (!apiKey) {
                new obsidian_1.Notice("Please set your OpenAI API key in the settings.");
                return;
            }
            const openai = new openai_1.OpenAI({ apiKey: apiKey });
            const response = yield openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are an assistant summarizing text." },
                    { role: "user", content: `Summarize this note content: ${content}` },
                ],
            });
            new obsidian_1.Notice(((_a = response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) || "No response");
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
}
exports.default = OpenAIPlugin;
// Settings tab class for the plugin
class OpenAISettingTab extends obsidian_1.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        new obsidian_1.Setting(containerEl)
            .setName("OpenAI API Key")
            .setDesc("Enter your OpenAI API Key here. This key will be stored securely and not tracked by git.")
            .addText((text) => text
            .setPlaceholder("Enter your API key")
            .setValue(this.plugin.settings.apiKey)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.apiKey = value;
            yield this.plugin.saveSettings();
        })));
    }
}
// Chat modal class to interact with OpenAI
class ChatModal extends obsidian_1.Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Chat with OpenAI" });
        const input = new obsidian_1.TextComponent(contentEl);
        input.inputEl.style.width = "100%";
        const button = new obsidian_1.ButtonComponent(contentEl);
        button.setButtonText("Send").onClick(() => __awaiter(this, void 0, void 0, function* () {
            const message = input.getValue();
            const response = yield this.chatWithOpenAI(message);
            contentEl.createEl("p", { text: response });
        }));
    }
    chatWithOpenAI(message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const apiKey = this.plugin.settings.apiKey;
            if (!apiKey) {
                new obsidian_1.Notice("Please set your OpenAI API key in the settings.");
                return "No response";
            }
            const openai = new openai_1.OpenAI({ apiKey });
            const response = yield openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "user", content: message },
                ],
            });
            return ((_a = response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) || "No response";
        });
    }
}
